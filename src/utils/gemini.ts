const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

export async function generateInterviewQuestions(
  jobTitle: string,
  experience: string,
): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    console.warn('Missing Gemini API key. Falling back to template questions.')
    return generateFallbackQuestions(jobTitle, experience)
  }

  const prompt = buildPrompt(jobTitle, experience)

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
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
      console.warn(
        `Gemini API request failed (${response.status}): ${errorBody ?? 'Unknown error'}. Falling back to template questions.`,
      )
      return generateFallbackQuestions(jobTitle, experience)
    }

    const payload: GeminiGenerateContentResponse = await response.json()
    const text = extractFirstCandidateText(payload)
    const questions = normalizeQuestions(text)

    return ensureQuestionCount(questions, jobTitle, experience)
  } catch (error) {
    console.error('Gemini request threw an error. Falling back to template questions.', error)
    return generateFallbackQuestions(jobTitle, experience)
  }
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

  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function ensureQuestionCount(
  questions: string[],
  jobTitle: string,
  experience: string,
): string[] {
  if (questions.length >= 5) {
    return questions.slice(0, 5)
  }

  const fallback = generateFallbackQuestions(jobTitle, experience)

  if (questions.length === 0) {
    return fallback
  }

  const combined = [...questions]

  for (const question of fallback) {
    if (combined.length >= 5) break
    if (!combined.includes(question)) {
      combined.push(question)
    }
  }

  return combined.slice(0, 5)
}

function generateFallbackQuestions(jobTitle: string, experience: string): string[] {
  const safeTitle = jobTitle.trim() || 'candidate'
  const safeExperience = experience.trim() || 'professional'

  const roleDescription = `${safeExperience} ${safeTitle}`.replace(/\s+/g, ' ').trim()

  return [
    `Can you walk me through a recent project that showcases your strengths as a ${roleDescription}?`,
    `How do you keep your skills sharp and up-to-date in your role as a ${roleDescription}?`,
    `Describe a challenging problem you solved as a ${roleDescription}. What was your approach?`,
    `How do you collaborate with cross-functional partners when working as a ${roleDescription}?`,
    `What goals are you focusing on next in your career as a ${roleDescription}?`,
  ]
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
