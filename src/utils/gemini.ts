const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash-002'
const DEFAULT_GEMINI_API_VERSION = 'v1'
const REQUESTED_QUESTION_COUNT = 5

function getGeminiEndpoint(model: string, apiVersion: string = DEFAULT_GEMINI_API_VERSION): string {
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`
}

export interface GeneratedQuestionCard {
  question: string
}

type GeminiTextPart = { text?: string }
type GeminiCandidate = { content?: { parts?: GeminiTextPart[] } }
interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[]
}

export async function generateInterviewQuestions(
  jobTitle: string,
  experience: string,
): Promise<GeneratedQuestionCard[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
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
        temperature: 0.6,
        maxOutputTokens: 512,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await safeParseError(response)
    throw new Error(`Gemini API request failed (${response.status}): ${errorBody ?? 'Unknown error'}`)
  }

  const payload: GeminiGenerateContentResponse = await response.json()
  const text = extractFirstCandidateText(payload)
  const questions = parseQuestions(text)

  if (questions.length === 0) {
    throw new Error('Gemini returned an empty response.')
  }

  return questions.slice(0, REQUESTED_QUESTION_COUNT).map((question) => ({ question }))
}

function buildPrompt(jobTitle: string, experience: string): string {
  const safeTitle = jobTitle.trim() || 'software engineer'
  const safeExperience = experience.trim() || 'mid-level'

  return `Suppose you are an experienced ${safeTitle} interviewing a ${safeExperience} ${safeTitle} candidate. Generate exactly ${REQUESTED_QUESTION_COUNT} concise interview questions for a ${safeExperience} ${safeTitle} candidate.
Respond only with a compact JSON array of strings. Example:
["Question one?", "Question two?", "Question three?", "Question four?", "Question five?"]
Do not include metadata, numbering, explanations, markdown, or any structure besides the JSON string array.`
}

function extractFirstCandidateText(payload: GeminiGenerateContentResponse): string {
  return (
    payload?.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
      .filter(Boolean)
      .join('\n') ?? ''
  )
}

function parseQuestions(raw: string): string[] {
  if (!raw.trim()) {
    return []
  }

  const jsonBlock = extractJsonArray(raw)
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? sanitizeQuestionText(item) : ''))
          .filter(Boolean)
      }
    } catch (error) {
      console.warn('Failed to parse Gemini JSON array', error, raw)
    }
  }

  return fallbackFromPlainText(raw)
}

function extractJsonArray(raw: string): string | null {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return raw.slice(start, end + 1)
}

function fallbackFromPlainText(raw: string): string[] {
  const lines = raw
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean)

  if (lines.length > 0) {
    return lines.map(sanitizeQuestionText)
  }

  const sentences = raw
    .split(/(?<=[?.!])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 8)

  return sentences.map(sanitizeQuestionText)
}

function sanitizeQuestionText(value: string): string {
  let text = value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  text = text.replace(/^(?:\d+\.)\s*/, '').trim()

  if (!text) {
    return ''
  }

  if (!text.endsWith('?')) {
    text = text.replace(/[-.:;,/]+$/, '').trim()
    text = `${text}?`
  }

  return text.replace(/\?+$/, '?').trim()
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const data = await response.json()
    if (typeof data === 'object' && data && 'error' in data) {
      const message = (data as { error?: { message?: string } }).error?.message
      return typeof message === 'string' ? message : JSON.stringify(data)
    }

    return JSON.stringify(data)
  } catch {
    try {
      return await response.text()
    } catch {
      return null
    }
  }
}
