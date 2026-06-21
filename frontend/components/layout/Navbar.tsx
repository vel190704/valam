'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/app/context/themecontext'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { dark, toggleTheme } = useTheme()
  const appPages = [
    '/dashboard',
    '/portfolio',
    '/networth',
    '/income',
    '/result',
    '/onboarding',
    '/auth',
  ]

  const hiddenPage = appPages.some(
    p => pathname.startsWith(p)
  )

  useEffect(() => {

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (hiddenPage) return null

  const navLinks = (
    <>
      <Link
        className="transition hover:text-[#B8924A]"
        href="/about"
        onClick={() => setMenuOpen(false)}>
        About
      </Link>
      <Link
        className="transition hover:text-[#B8924A]"
        href="/vision"
        onClick={() => setMenuOpen(false)}>
        Vision
      </Link>
      <Link
        className="transition hover:text-[#B8924A]"
        href="/contact"
        onClick={() => setMenuOpen(false)}>
        Contact
      </Link>
    </>
  )

  return (
  <header
    style={{
      position: 'fixed',
      left: 0,
      right: 0,
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      backdropFilter: 'blur(10px)',
      transition: 'all .3s ease'
    }}
  >
    <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

      {/* Logo */}
       <Link
       href='/'
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--gold)'
        }}
      >
      VALAM
      </Link>

      {/* Desktop nav links */}
      <div
        className="hidden items-center gap-7 font-serif text-base font-semibold md:flex"
        style={{
          color: 'var(--text)'
        }}
      >
        {navLinks}
      </div>

      {/* Desktop auth */}
      <div className="hidden md:flex items-center gap-3">

        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-base font-bold transition hover:scale-105"
          style={{
            background: 'var(--surface2)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 10px rgba(0,0,0,.08)'
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {userEmail ? (
          <Link
            href="/profile"
            aria-label="Go to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-base font-bold text-white"
            style={{
              background: 'var(--gold)',
              boxShadow: '0 4px 20px rgba(184,146,74,.25)'
            }}
          >
            {userEmail.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <div className="flex items-center gap-3 font-serif">

            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-full px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.02]"
              style={{
                background:
                  'linear-gradient(135deg,var(--gold-lt) 0%,var(--gold) 40%,var(--bronze) 100%)',
                boxShadow: '0 4px 20px rgba(184,146,74,.25)'
              }}
            >
              Sign Up
            </Link>

          </div>
        )}
      </div>

      {/* Mobile actions */}
<div className="flex items-center gap-2 md:hidden">

  {/* Theme button */}
  <button
    onClick={toggleTheme}
    className="flex h-10 w-10 items-center justify-center rounded-full"
    style={{
      background: 'var(--surface2)',
      color: 'var(--muted)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 10px rgba(0,0,0,.08)'
    }}
  >
    {dark ? '☀️' : '🌙'}
  </button>

  {/* Hamburger */}
  <button
    type="button"
    onClick={() => setMenuOpen(open => !open)}
    className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full"
    style={{
      border: '1px solid var(--border)',
      color: 'var(--gold)'
    }}
    aria-label="Toggle navigation menu"
    aria-expanded={menuOpen}
  >
    <span className="h-0.5 w-5 rounded-full bg-current" />
    <span className="h-0.5 w-5 rounded-full bg-current" />
    <span className="h-0.5 w-5 rounded-full bg-current" />
  </button>

</div>
    </nav>

    {/* Mobile menu */}
    {menuOpen && (
      <div
        className="px-4 pb-5 pt-2 shadow-xl md:hidden"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)'
        }}
      >
        <div
          className="mx-auto flex max-w-6xl flex-col gap-4 font-serif text-lg font-semibold"
          style={{
            color: 'var(--text)'
          }}
        >

          {navLinks}

          <div
            style={{
              height: 1,
              background: 'var(--border)'
            }}
          />

          {userEmail ? (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            >
              <span>Profile</span>

              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-white"
                style={{
                  background: 'var(--gold)'
                }}
              >
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </Link>
          ) : (

            <div className="grid grid-cols-2 gap-3">

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-full px-4 py-2 text-center text-base"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              >
                Login
              </Link>

              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="rounded-full px-4 py-2 text-center text-base font-bold text-white"
                style={{
                  background:
                    'linear-gradient(135deg,var(--gold-lt) 0%,var(--gold) 40%,var(--bronze) 100%)'
                }}
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