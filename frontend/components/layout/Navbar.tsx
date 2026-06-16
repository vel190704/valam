'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCurrentUser, getStoredUser, type AuthUser } from '@/lib/backend-api'

export default function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetchCurrentUser().then(setUser)

    const handleAuthChanged = () => setUser(getStoredUser())
    window.addEventListener('valam-auth-changed', handleAuthChanged)

    return () => window.removeEventListener('valam-auth-changed', handleAuthChanged)
  }, [])

  const navLinks = (
    <>
      <Link className="transition hover:text-[#c9a84c]" href="/about" onClick={() => setMenuOpen(false)}>
        About
      </Link>
      <Link className="transition hover:text-[#c9a84c]" href="/vision" onClick={() => setMenuOpen(false)}>
        Vision
      </Link>
      <Link className="transition hover:text-[#c9a84c]" href="/contact" onClick={() => setMenuOpen(false)}>
        Contact
      </Link>
    </>
  )

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#c9a84c]/15 bg-[#1a0f0a]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c9a84c] font-serif text-xl font-bold text-[#1a0f0a] shadow-lg shadow-[#c9a84c]/20 transition hover:scale-105"
          aria-label="Go to home"
          onClick={() => setMenuOpen(false)}
        >
          V
        </Link>

        <div className="hidden items-center gap-7 font-serif text-base font-semibold text-[#f5f0e8]/75 md:flex">
          {navLinks}
        </div>

        <div className="hidden md:block">
          {user ? (
            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a84c] font-serif text-base font-bold text-[#1a0f0a] shadow-lg shadow-[#c9a84c]/20"
              aria-label="Open profile"
            >
              {user.email?.charAt(0).toUpperCase() ?? 'U'}
            </Link>
          ) : (
            <div className="flex items-center gap-3 font-serif">
              <Link
                href="/login"
                className="rounded-full border border-[#c9a84c]/50 px-4 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#c9a84c]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-[#f0d080] via-[#c9a84c] to-[#a07828] px-4 py-2 text-sm font-bold text-[#2a1a0e] shadow-lg shadow-[#c9a84c]/20 transition hover:scale-[1.02]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-[#c9a84c]/40 text-[#c9a84c] md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#c9a84c]/15 bg-[#1a0f0a]/95 px-4 pb-5 pt-2 shadow-xl shadow-black/20 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 font-serif text-lg font-semibold text-[#f5f0e8]/80">
            {navLinks}
            <div className="mt-2 h-px bg-[#c9a84c]/15" />
            {user ? (
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-lg border border-[#c9a84c]/25 px-4 py-3 text-[#f5f0e8]"
              >
                <span>Profile</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9a84c] text-base font-bold text-[#1a0f0a]">
                  {user.email?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-[#c9a84c]/50 px-4 py-2 text-center text-base text-[#f5f0e8]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[#f0d080] via-[#c9a84c] to-[#a07828] px-4 py-2 text-center text-base font-bold text-[#2a1a0e]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
