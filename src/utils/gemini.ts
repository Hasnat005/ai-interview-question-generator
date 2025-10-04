const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash-002'

const DEFAULT_GEMINI_API_VERSION = 'v1'

function getGeminiEndpoint(model: string, apiVersion: string = DEFAULT_GEMINI_API_VERSION): string {
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`
}

export async function generateInterviewQuestions(
  jobTitle: string,
  experience: string,
): Promise<string[]> {
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
        maxOutputTokens: 512,
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
  const questions = normalizeQuestions(text)

  if (questions.length === 0) {
    throw new Error('Gemini returned an empty response.')
  }

  return questions.slice(0, 5)
}

function buildPrompt(jobTitle: string, experience: string): string {
  const safeTitle = jobTitle.trim() || 'software engineer'
  const safeExperience = experience.trim() || 'mid-level'

  return `You are an experienced interviewer.
Generate five interview questions for a ${safeExperience} ${safeTitle}.
Return only a numbered list formatted exactly as:
1. Question one
2. Question two
Each question must be concise, mix behavioral and technical topics, and avoid explanations.`
}

function extractFirstCandidateText(payload: GeminiGenerateContentResponse): string {
  return (
    payload?.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
      .filter(Boolean)
      .join('\n') ?? ''
  )
}

function normalizeQuestions(raw: string): string[] {
  if (!raw.trim()) return []

  const numberedMatches = raw.match(/\d+\.\s+[^]+?(?=(?:\n\d+\.\s+)|$)/g)
  if (numberedMatches && numberedMatches.length > 0) {
    return numberedMatches
      .map((segment) => segment.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
  }

  const bulletMatches = raw.match(/[-*]\s+[^]+?(?=(?:\n[-*]\s+)|$)/g)
  if (bulletMatches && bulletMatches.length > 0) {
    return bulletMatches
      .map((segment) => segment.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
  }

  const sentences = raw
    .split(/(?<=[?.!])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /\?$/.test(sentence) || sentence.length > 20)

  if (sentences.length > 0) {
    return sentences.slice(0, 5)
  }

  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
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
