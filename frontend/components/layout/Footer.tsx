import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[#c9a84c]/15 bg-[#1a0f0a] px-4 py-8 text-[#f5f0e8]/60 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-lg font-bold tracking-[0.2em] text-[#c9a84c]">
          VALAM
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="transition hover:text-[#c9a84c]" href="/about">
            About
          </Link>
          <Link className="transition hover:text-[#c9a84c]" href="/vision">
            Vision
          </Link>
          <Link className="transition hover:text-[#c9a84c]" href="/contact">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
