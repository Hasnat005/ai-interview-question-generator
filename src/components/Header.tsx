interface HeaderProps {
  title: string
  subtitle: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex flex-col items-center gap-4 text-center text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-300/70">
        AI Interview Question Generator
      </p>
      <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
        {title}
      </h1>
      <p className="max-w-3xl text-base text-slate-300 md:text-lg">{subtitle}</p>
    </header>
  )
}
