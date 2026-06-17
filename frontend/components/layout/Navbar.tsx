'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hiddenPage, setHiddenPage] = useState(false)

  useEffect(() => {
    // Hide global navbar on app pages that have their own nav
    const appPages = ['/dashboard', '/portfolio', '/networth',
      '/income', '/result', '/onboarding', '/auth', '/profile']
    const isAppPage = appPages.some(p =>
      window.location.pathname.startsWith(p)
    )
    setHiddenPage(isAppPage)

    const handlePopState = () => {
      const isApp = appPages.some(p =>
        window.location.pathname.startsWith(p)
      )
      setHiddenPage(isApp)
    }
    window.addEventListener('popstate', handlePopState)

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
      window.removeEventListener('popstate', handlePopState)
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#B8924A]/15 bg-[#EFEDE8]/90 dark:bg-[#231512]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B8924A] font-serif text-xl font-bold text-white shadow-lg shadow-[#B8924A]/20 transition hover:scale-105"
          aria-label="Go to home"
          onClick={() => setMenuOpen(false)}>
          V
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 font-serif text-base font-semibold text-[#1E1C18]/75 dark:text-[#F5F0E8]/75 md:flex">
          {navLinks}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:block">
          {userEmail ? (
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B8924A] font-serif text-base font-bold text-white shadow-lg shadow-[#B8924A]/20"
              aria-label="Go to dashboard">
              {userEmail.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <div className="flex items-center gap-3 font-serif">
              <Link
                href="/login"
                className="rounded-full border border-[#B8924A]/50 px-4 py-2 text-sm font-semibold text-[#1E1C18] dark:text-[#F5F0E8] transition hover:border-[#B8924A]">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-[#D4AD72] via-[#B8924A] to-[#8F6828] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#B8924A]/20 transition hover:scale-[1.02]">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-[#B8924A]/40 text-[#B8924A] md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}>
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#B8924A]/15 bg-[#EFEDE8]/95 dark:bg-[#231512]/95 px-4 pb-5 pt-2 shadow-xl shadow-black/10 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 font-serif text-lg font-semibold text-[#1E1C18]/80 dark:text-[#F5F0E8]/80">
            {navLinks}
            <div className="mt-2 h-px bg-[#B8924A]/15" />
            {userEmail ? (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-lg border border-[#B8924A]/25 px-4 py-3 text-[#1E1C18] dark:text-[#F5F0E8]">
                <span>Dashboard</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B8924A] text-base font-bold text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-[#B8924A]/50 px-4 py-2 text-center text-base text-[#1E1C18] dark:text-[#F5F0E8]">
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[#D4AD72] via-[#B8924A] to-[#8F6828] px-4 py-2 text-center text-base font-bold text-white">
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
