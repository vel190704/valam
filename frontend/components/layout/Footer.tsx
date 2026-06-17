'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const appPages = ['/dashboard', '/portfolio', '/networth',
      '/income', '/result', '/onboarding', '/auth', '/profile']
    setHidden(appPages.some(p => window.location.pathname.startsWith(p)))
  }, [])

  if (hidden) return null

  return (
    <footer className="border-t border-[#B8924A]/15 bg-[#EFEDE8] dark:bg-[#231512] px-4 py-8 text-[#1E1C18]/60 dark:text-[#F5F0E8]/60 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-lg font-bold tracking-[0.2em] text-[#B8924A]">
          VALAM
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="transition hover:text-[#B8924A]" href="/about">About</Link>
          <Link className="transition hover:text-[#B8924A]" href="/vision">Vision</Link>
          <Link className="transition hover:text-[#B8924A]" href="/contact">Contact</Link>
        </div>
        <p className="text-xs text-[#1E1C18]/40 dark:text-[#F5F0E8]/40">
          © {new Date().getFullYear()} VALAM. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
