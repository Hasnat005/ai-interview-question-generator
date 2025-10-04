import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateInterviewQuestions } from './utils/gemini'

const API_ERROR_MESSAGE = 'Something went wrong. Please try again later.'
const EMPTY_RESULT_MESSAGE = 'No questions found. Try a different title.'

export function App() {
  const [jobTitle, setJobTitle] = useState('')
  const [experience, setExperience] = useState('Mid-Level')
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )

  const isGenerateDisabled = jobTitle.trim().length === 0 || loading
  const hasQuestions = questions.length > 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = jobTitle.trim()
    if (!trimmedTitle) return

    setLoading(true)
    setError(null)
    setCopyStatus('idle')

    try {
      const generatedQuestions = await generateInterviewQuestions(
        trimmedTitle,
        experience,
      )

      if (!generatedQuestions.length) {
        setError(EMPTY_RESULT_MESSAGE)
        setQuestions([])
        return
      }

      setQuestions(generatedQuestions)
    } catch (error) {
      console.error('Failed to generate interview questions', error)
      setError(API_ERROR_MESSAGE)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAll = async () => {
    if (!hasQuestions) return

    try {
      await navigator.clipboard.writeText(questions.map((question, index) => `${index + 1}. ${question}`).join('\n'))
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1500)
    } catch (error) {
      console.error('Failed to copy questions to clipboard', error)
      setCopyStatus('error')
    }
  }

  const handleClear = () => {
    setJobTitle('')
    setExperience('Mid-Level')
    setQuestions([])
    setError(null)
    setCopyStatus('idle')
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
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/60"
            >
              <option>Junior</option>
              <option>Mid-Level</option>
              <option>Senior</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isGenerateDisabled}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating questions…' : 'Generate Questions'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading && !hasQuestions}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 shadow-inner transition hover:border-slate-500 hover:bg-slate-900/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}

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

            {copyStatus === 'copied' ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Copied!
              </p>
            ) : copyStatus === 'error' ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-300">
                Unable to copy. Please try again.
              </p>
            ) : null}

            <AnimatePresence mode="wait">
              {hasQuestions ? (
                <motion.ol
                  key="questions"
                  className="space-y-3 text-sm leading-relaxed text-slate-200"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {questions.map((question, index) => (
                    <motion.li
                      key={`${question}-${index}`}
                      className="pl-2"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <span className="font-semibold text-violet-200">{index + 1}.</span> {question}
                    </motion.li>
                  ))}
                </motion.ol>
              ) : loading ? (
                <motion.div
                  key="loading"
                  className="flex flex-col items-center gap-3 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 text-violet-200">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="block h-2 w-2 rounded-full bg-current"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                  <p className="text-sm italic text-slate-500">Crafting tailored questions…</p>
                </motion.div>
              ) : (
                <motion.p
                  key="placeholder"
                  className="text-sm italic text-slate-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {error === EMPTY_RESULT_MESSAGE
                    ? EMPTY_RESULT_MESSAGE
                    : 'Questions will appear here…'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
