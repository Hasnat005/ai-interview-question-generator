const STARTER_QUESTIONS = [
  {
    category: 'System Design',
    prompt:
      'Design a global interview question generator that supports dynamic question difficulty, localization, and integrates with multiple ATS providers. Describe the architecture, key services, and data flows.',
  },
  {
    category: 'Algorithms',
    prompt:
      'Given a stream of candidate responses, build a service that flags potential plagiarism in real time. Outline the approach, data structures, and complexity trade-offs.',
  },
  {
    category: 'Product Thinking',
    prompt:
      'You are launching an AI-powered interview preparation assistant. Draft the first version of the product spec describing target users, success metrics, and critical launch features.',
  },
  {
    category: 'Leadership',
    prompt:
      'Describe a strategy to roll out AI-assisted interviewing across a 5,000 person organization. How would you address change management, ethics, and training?',
  },
]

export type QuestionTemplate = (typeof STARTER_QUESTIONS)[number]

export function getStarterQuestions(): QuestionTemplate[] {
  return STARTER_QUESTIONS
}

export function getRandomQuestion(seed?: number): QuestionTemplate {
  const source = STARTER_QUESTIONS

  if (!source.length) {
    throw new Error('No question templates available')
  }

  if (typeof seed === 'number') {
    const index = Math.abs(seed) % source.length
    return source[index]
  }

  const index = Math.floor(Math.random() * source.length)
  return source[index]
}
