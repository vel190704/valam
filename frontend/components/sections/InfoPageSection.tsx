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
  <main
    style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '8rem 1rem 4rem',
      transition: 'all .3s ease'
    }}
    className="sm:px-6 lg:px-8"
  >
    <section className="mx-auto max-w-4xl">

      <p
        style={{
          marginBottom: '1rem',
          fontSize: '.875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.25em',
          color: 'var(--gold)'
        }}
      >
        {eyebrow}
      </p>

      <h1
        className="font-serif sm:text-5xl lg:text-6xl"
        style={{
          fontSize: 'clamp(2.25rem,5vw,4rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'var(--text)'
        }}
      >
        {title}
      </h1>

      <p
        className="font-serif sm:text-xl"
        style={{
          marginTop: '1.5rem',
          maxWidth: '42rem',
          fontSize: '1.125rem',
          lineHeight: 1.8,
          color: 'var(--muted)'
        }}
      >
        {body}
      </p>

      <div
        className="sm:grid-cols-2"
        style={{
          marginTop: '2.5rem',
          display: 'grid',
          gap: '1rem'
        }}
      >
        {points.map((point) => (
          <div
            key={point}
            style={{
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '1.25rem',
              fontSize: '.95rem',
              lineHeight: 1.7,
              color: 'var(--text)',
              boxShadow: '0 4px 20px rgba(0,0,0,.04)',
              transition: 'all .3s ease'
            }}
          >
            {point}
          </div>
        ))}
      </div>

    </section>
  </main>
)
}