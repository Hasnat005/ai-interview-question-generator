interface QuestionCardProps {
  question: string
  category: string
}

export function QuestionCard({ question, category }: QuestionCardProps) {
  return (
    <section className="w-full max-w-3xl rounded-3xl border border-slate-700/60 bg-slate-900/70 p-10 text-left shadow-[0_30px_80px_-48px_rgba(129,140,248,0.65)] backdrop-blur">
      <span className="inline-flex items-center justify-center rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
        {category}
      </span>
      <p className="mt-6 text-lg leading-relaxed text-slate-100 md:text-xl">{question}</p>
    </section>
  )
}
