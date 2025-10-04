import { useState } from 'react'
import { Header } from '../components/Header'
import { QuestionCard } from '../components/QuestionCard'
import {
  getRandomQuestion,
  getStarterQuestions,
  type QuestionTemplate,
} from '../utils/questionTemplates'

export function Home() {
  const [question, setQuestion] = useState<QuestionTemplate>(() =>
    getRandomQuestion(),
  )

  const handleGenerateClick = () => {
    setQuestion(getRandomQuestion())
  }

  const starterCount = getStarterQuestions().length

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 pb-16 pt-24">
      <Header
        title="Generate interview prompts backed by AI"
        subtitle="Kick off your next interview with curated prompts for system design, leadership, product, and algorithm challenges. Expand the templates or plug in your own LLM workflows."
      />

      <QuestionCard question={question.prompt} category={question.category} />

      <div className="flex flex-col items-center gap-3 text-sm text-slate-300">
        <button
          type="button"
          onClick={handleGenerateClick}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          Generate another question
        </button>
        <p className="max-w-xl text-center text-slate-400">
          Start with {starterCount} curated prompts or integrate your own model.
        </p>
      </div>
    </main>
  )
}
