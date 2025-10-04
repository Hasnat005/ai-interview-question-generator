import { useState, type FormEvent } from 'react'

export function App() {
  const [jobTitle, setJobTitle] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level')
  const [questions, setQuestions] = useState<string[]>([])

  const isGenerateDisabled = jobTitle.trim().length === 0
  const hasQuestions = questions.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = jobTitle.trim()
    if (!trimmedTitle) return

    const basePrompt = `${experienceLevel} ${trimmedTitle}`.trim()

    setQuestions([
      `How would you describe the core responsibilities of a ${basePrompt}?`,
      `Walk me through a recent project where you demonstrated strengths required for a ${basePrompt}.`,
      `What metrics or signals do you use to evaluate success in a ${basePrompt} role?`,
      `Describe a challenging scenario a ${basePrompt} might encounter and how you would resolve it.`,
      `How do you stay current with industry trends relevant to being a ${basePrompt}?`,
    ])
  }

  const handleCopyAll = async () => {
    if (!hasQuestions) return

    try {
      await navigator.clipboard.writeText(questions.map((question, index) => `${index + 1}. ${question}`).join('\n'))
    } catch (error) {
      console.error('Failed to copy questions to clipboard', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900/80 p-10 text-center shadow-2xl shadow-slate-900/40 backdrop-blur">
        <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">
          AI Interview Question Generator
        </h1>
        <p className="mt-4 text-base text-slate-300 md:text-lg">
          Enter a job title to get realistic interview questions.
        </p>

        <form
          className="mt-8 flex flex-col gap-6 text-left"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="job-title"
              className="text-sm font-medium uppercase tracking-wide text-slate-300"
            >
              Job Title
            </label>
            <input
              id="job-title"
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="experience-level"
              className="text-sm font-medium uppercase tracking-wide text-slate-300"
            >
              Experience Level
            </label>
            <select
              id="experience-level"
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/60"
            >
              <option>Junior</option>
              <option>Mid-Level</option>
              <option>Senior</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerateDisabled}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            Generate Questions
          </button>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 px-5 py-6 text-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Generated Questions
              </h2>
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={!hasQuestions}
                className="rounded-lg border border-violet-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200 transition hover:border-violet-400 hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Copy All
              </button>
            </div>

            {hasQuestions ? (
              <ol className="space-y-3 text-sm leading-relaxed text-slate-200">
                {questions.map((question, index) => (
                  <li key={question} className="pl-2">
                    <span className="font-semibold text-violet-200">{index + 1}.</span> {question}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm italic text-slate-500">
                Questions will appear here…
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
