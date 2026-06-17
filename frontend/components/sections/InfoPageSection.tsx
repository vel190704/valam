'use client'

interface InfoPageSectionProps {
  eyebrow: string
  title: string
  body: string
  points: string[]
}

export default function InfoPageSection({
  eyebrow,
  title,
  body,
  points,
}: InfoPageSectionProps) {
  return (
    <main className="min-h-screen bg-[#EFEDE8] dark:bg-[#231512] px-4 pb-16 pt-32 text-[#1E1C18] dark:text-[#F5F0E8] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#B8924A]">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-8 text-[#1E1C18]/70 dark:text-[#F5F0E8]/70 sm:text-xl">
          {body}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map((point) => (
            <div
              key={point}
              className="rounded-lg border border-[#B8924A]/25 bg-[#1E1C18]/5 dark:bg-[#F5F0E8]/5 p-5 text-sm leading-6 text-[#1E1C18]/75 dark:text-[#F5F0E8]/75"
            >
              {point}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
