export const Head = ({ title, blurb, action }: { title: string; blurb?: string; action?: React.ReactNode }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-4xl font-extrabold text-plum">{title}</h1>
      {blurb && <p className="mt-1 max-w-2xl text-sm text-ink/60">{blurb}</p>}
    </div>
    {action}
  </header>
)

export const Wrap = ({ head, children }: { head: React.ReactNode; children: React.ReactNode }) => (
  <div className="mx-auto max-w-6xl">{head}{children}</div>
)
