const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash-002'

const DEFAULT_GEMINI_API_VERSION = 'v1'

function getGeminiEndpoint(model: string, apiVersion: string = DEFAULT_GEMINI_API_VERSION): string {
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`
}

export interface GeneratedQuestionCard {
  question: string
  type: 'technical' | 'behavioral'
  difficulty: 'Junior' | 'Mid-Level' | 'Senior'
  suggestedAnswer: string
  keyTips: string[]
  keywords: string[]
  codeExample?: string
  behavioralStructure?: string[]
  referenceUrl?: string
}

interface GeminiQuestionPayload {
  questions?: Array<Partial<GeneratedQuestionCard>>
}

export async function generateInterviewQuestions(
  jobTitle: string,
  experience: string,
): Promise<GeneratedQuestionCard[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const model = (import.meta.env.VITE_GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim()
  const apiVersion = (import.meta.env.VITE_GEMINI_API_VERSION ?? DEFAULT_GEMINI_API_VERSION).trim()

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your environment.')
  }
  if (!model) {
    throw new Error('Missing Gemini model. Provide VITE_GEMINI_MODEL or use the default configuration.')
  }
  if (!apiVersion) {
    throw new Error('Missing Gemini API version. Provide VITE_GEMINI_API_VERSION or use the default configuration.')
  }

  const prompt = buildPrompt(jobTitle, experience)

  const response = await fetch(`${getGeminiEndpoint(model, apiVersion)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt.trim() }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await safeParseError(response)
    throw new Error(
      `Gemini API request failed (${response.status}): ${errorBody ?? 'Unknown error'}`,
    )
  }

  const payload: GeminiGenerateContentResponse = await response.json()
  const text = extractFirstCandidateText(payload)
  const structuredQuestions = normalizeQuestions(text, experience)

  if (structuredQuestions.length === 0) {
    throw new Error('Gemini returned an empty response.')
  }

  return structuredQuestions.slice(0, 5)
}

function buildPrompt(jobTitle: string, experience: string): string {
  const safeTitle = jobTitle.trim() || 'software engineer'
  const safeExperience = experience.trim() || 'mid-level'

  return `You are an experienced interviewer and career coach.
Generate five interview questions for a ${safeExperience} ${safeTitle} candidate.
Respond ONLY with minified JSON that matches this TypeScript type with no additional commentary:
{
  "questions": [
    {
      "question": string,
      "type": "technical" | "behavioral",
      "difficulty": "Junior" | "Mid-Level" | "Senior",
      "suggestedAnswer": string,
      "keyTips": string[],
      "keywords": string[],
      "codeExample"?: string,
      "behavioralStructure"?: string[],
      "referenceUrl"?: string
    }
  ]
}
Guidance:
- Mix technical and behavioral prompts.
- Keep suggestedAnswer concise (<= 120 words) and highlight the most important idea first.
- Populate keyTips with 2-4 short actionable bullets.
- Fill keywords with 3-6 important terms; highlight acronyms or tech names.
- Provide codeExample only when the question is technical and benefits from a short snippet (max 25 lines, use ${'`'}${'`'}${'`'} fences inside the string if needed).
- Provide behavioralStructure only when the question is behavioral, following STAR (Situation, Task, Action, Result) or similar frameworks.
- Include a credible referenceUrl for deeper learning when relevant.
- Default difficulty to "${safeExperience}" if unsure.
Ensure the response is valid JSON, no Markdown fences, no trailing commas.`
}

function extractFirstCandidateText(payload: GeminiGenerateContentResponse): string {
  return (
    payload?.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
      .filter(Boolean)
      .join('\n') ?? ''
  )
}

function normalizeQuestions(raw: string, fallbackDifficulty: string): GeneratedQuestionCard[] {
  if (!raw.trim()) return []

  const json = extractJsonBlock(raw)
  if (json) {
    try {
      const parsed = JSON.parse(json) as GeminiQuestionPayload
      if (Array.isArray(parsed?.questions)) {
        const cards = parsed.questions
          .map((item) => sanitizeQuestion(item, fallbackDifficulty))
          .filter((item): item is GeneratedQuestionCard => Boolean(item))

        if (cards.length > 0) {
          return cards
        }
      }
    } catch (error) {
      console.warn('Failed to parse Gemini JSON response', error, raw)
    }
  }

  return fallbackCardsFromText(raw, fallbackDifficulty)
}

function extractJsonBlock(raw: string): string | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return raw.slice(start, end + 1)
}

function normalizeDifficulty(value: string): GeneratedQuestionCard['difficulty'] {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('junior') || normalized.includes('entry')) return 'Junior'
  if (normalized.includes('senior') || normalized.includes('lead')) return 'Senior'
  return 'Mid-Level'
}

function sanitizeQuestion(
  item: Partial<GeneratedQuestionCard> | undefined,
  fallbackDifficulty: string,
): GeneratedQuestionCard | undefined {
  if (!item?.question || typeof item.question !== 'string') {
    return undefined
  }

  const type = item.type === 'behavioral' ? 'behavioral' : 'technical'
  const fallback = normalizeDifficulty(fallbackDifficulty)
  const difficulty = item.difficulty && ['Junior', 'Mid-Level', 'Senior'].includes(item.difficulty)
    ? (item.difficulty as GeneratedQuestionCard['difficulty'])
    : fallback

  const questionText = cleanQuestionText(item.question)
  const suggestedAnswer = cleanText(item.suggestedAnswer ?? '')
  const defaultAnswer =
    suggestedAnswer ||
    (type === 'technical'
      ? `Describe your approach to ${questionText} with clear reasoning, practical tradeoffs, and reference to relevant tools or patterns you trust.`
      : `Walk through a real example using the STAR method (Situation, Task, Action, Result) that showcases how you handled ${questionText}.`)

  const sanitizedTips = Array.isArray(item.keyTips)
    ? item.keyTips.map((tip) => cleanText(String(tip))).filter(Boolean)
    : []
  const keyTips = sanitizedTips.length > 0 ? sanitizedTips : buildDefaultTips(type)

  const sanitizedKeywords = Array.isArray(item.keywords)
    ? item.keywords.map((keyword) => cleanText(String(keyword))).filter(Boolean)
    : []
  const keywords = sanitizedKeywords.length > 0 ? sanitizedKeywords : deriveKeywords(questionText)

  const providedFlow = Array.isArray(item.behavioralStructure)
    ? item.behavioralStructure.map((step) => cleanText(String(step))).filter(Boolean)
    : []
  const behavioralStructure = providedFlow.length > 0 ? providedFlow : buildAnswerFlow(type)

  const codeExample =
    type === 'technical' && item.codeExample
      ? cleanCode(item.codeExample)
      : undefined

  return {
  question: questionText,
    type,
  difficulty,
    suggestedAnswer: defaultAnswer,
    keyTips,
    keywords,
    codeExample,
    behavioralStructure,
    referenceUrl: validateUrl(item.referenceUrl),
  }
}

function cleanText(value: string): string {
  return value.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim()
}

function cleanQuestionText(value: string): string {
  let text = cleanText(value)
  if (!text) return ''

  text = text.replace(/\/\*[\s\S]*?\*\//g, ' ')

  const metadataRegex = /(type|suggested answer|key tips|keywords|answer structure|reference url|keytips|behavioralstructure|code example)\s*:/i
  const metadataMatch = metadataRegex.exec(text)
  if (metadataMatch && metadataMatch.index >= 0) {
    text = text.slice(0, metadataMatch.index).trim()
  }

  const lines = text
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const questionKeywords = /(who|what|when|where|why|how|describe|explain|tell|give|walk|imagine|discuss|share|talk|outline|clarify|focus)/i
  const isCodeLike = (line: string) =>
    /[{}`;]/.test(line) ||
    /^\s*[.#]/.test(line) ||
    /^\s*<\/?[a-z]/i.test(line) ||
    line.toLowerCase().startsWith('specificity') ||
    line.includes(' = ') ||
    /^\s*@/.test(line)

  const keywordLine = lines.find((line) => questionKeywords.test(line) && !isCodeLike(line))
  const fallbackLine = lines.find((line) => !isCodeLike(line))

  text = (keywordLine ?? fallbackLine ?? lines[0] ?? '').trim()
  text = text.replace(/^(?:\d+\.\s*)/, '')

  const questionSentences = text.match(/[^?]+?\?/g)
  if (questionSentences && questionSentences.length > 0) {
    const firstValid = questionSentences.find((sentence) => /[a-zA-Z]/.test(sentence))
    text = (firstValid ?? questionSentences[0]).trim()
  }

  text = text.replace(/\s+/g, ' ').trim()

  if (!text.endsWith('?')) {
    text = text.replace(/[-.:;,/]+$/, '').trim()
    text = `${text}?`
  }

  return text.replace(/\?+$/, '?').trim()
}

function cleanCode(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
  }
  return trimmed
}

function validateUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value)
    return url.href
  } catch {
    return undefined
  }
}

function buildDefaultTips(type: 'technical' | 'behavioral'): string[] {
  if (type === 'technical') {
    return [
      'Clarify any assumptions before diving into the solution.',
      'Explain the trade-offs and reasoning behind your approach.',
      'Relate the concept back to real projects or performance considerations.',
    ]
  }

  return [
    'Set the scene quickly with the role, team, and stakes.',
    'Highlight the specific actions you took and why.',
    'Share measurable outcomes and lessons learned.',
  ]
}

function deriveKeywords(question: string): string[] {
  const tokens = question
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)

  const unique = Array.from(new Set(tokens.map((token) => token.toLowerCase())))
  return unique.slice(0, 5).map((token) => capitalize(token))
}

function buildAnswerFlow(type: 'technical' | 'behavioral'): string[] {
  return type === 'behavioral' ? buildBehavioralFlow() : buildTechnicalFlow()
}

function buildBehavioralFlow(): string[] {
  return [
    'Situation — Set the context and why it mattered.',
    'Task — Clarify your responsibility and success criteria.',
    'Action — Walk through the decisive steps you took and why.',
    'Result — Quantify the outcome and key lesson learned.',
  ]
}

function buildTechnicalFlow(): string[] {
  return [
    'Clarify requirements and constraints up front.',
    'Outline the high-level approach and supporting architecture.',
    'Dive into implementation details, tooling, and trade-offs.',
    'Explain validation, testing, and performance considerations.',
    'Discuss follow-up optimizations or scaling strategies.',
  ]
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function fallbackCardsFromText(raw: string, fallbackDifficulty: string): GeneratedQuestionCard[] {
  const questions = extractQuestionsFromText(raw)
  if (questions.length === 0) return []

    const difficulty = normalizeDifficulty(fallbackDifficulty)

  return questions.slice(0, 5).map((question) => {
    const type = detectQuestionType(question)
    const cleaned = cleanQuestionText(question)

    return {
      question: cleaned,
      type,
      difficulty,
      suggestedAnswer:
        type === 'technical'
          ? `Outline how you would tackle ${cleaned.toLowerCase()}, covering the tools, trade-offs, and validation steps.`
          : `Structure your response with Situation, Task, Action, and Result while emphasizing the key lesson learned.`,
      keyTips: buildDefaultTips(type),
      keywords: deriveKeywords(cleaned),
      codeExample: undefined,
      behavioralStructure: buildAnswerFlow(type),
      referenceUrl: undefined,
    }
  })
}

function extractQuestionsFromText(raw: string): string[] {
  const contextualMatches = raw.match(/(?:\d+\.\s*)?(?:As\s+(?:a|an)\s[^?]+\?)/gi)
  if (contextualMatches && contextualMatches.length > 0) {
    return contextualMatches.map((segment) => segment.trim())
  }

  const numberedMatches = raw.match(/\d+\.\s+[^]+?(?=(?:\n\d+\.\s+)|$)/g)
  if (numberedMatches && numberedMatches.length > 0) {
    return numberedMatches.map((segment) => segment.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
  }

  const bulletMatches = raw.match(/[-*]\s+[^]+?(?=(?:\n[-*]\s+)|$)/g)
  if (bulletMatches && bulletMatches.length > 0) {
    return bulletMatches.map((segment) => segment.replace(/^[-*]\s*/, '').trim()).filter(Boolean)
  }

  const sentences = raw
    .split(/(?<=[?.!])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10)

  if (sentences.length > 0) {
    return sentences.slice(0, 5)
  }

  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 10)
}

function detectQuestionType(question: string): 'technical' | 'behavioral' {
  const normalized = question.toLowerCase()

  const behavioralKeywords = ['describe a time', 'tell me about', 'how did you handle', 'give an example', 'walk me through']
  if (behavioralKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'behavioral'
  }

  return 'technical'
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const data = await response.json()
    if (data?.error?.message) {
      return data.error.message
    }
    return typeof data === 'string' ? data : JSON.stringify(data)
  } catch {
    return response.statusText ?? null
  }
}

interface GeminiContentPart {
  text?: string
}

interface GeminiContent {
  parts?: GeminiContentPart[]
}

interface GeminiCandidate {
  content?: GeminiContent
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[]
}
