'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const appPages = [
    '/dashboard', '/portfolio', '/networth', '/income',
    '/result', '/onboarding', '/auth', '/profile',
    '/learning', '/milestones', '/allocation', '/sip',
    '/calculators', '/knowledge-hub'
  ]
  if (appPages.some(p => pathname.startsWith(p))) return null

 return (
  <footer
    style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--muted)',
      padding: '2rem 1rem',
      transition: 'all .3s ease'
    }}
  >
    <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">

      {/* Logo */}
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--gold)'
        }}
      >
        VALAM
      </p>

      {/* Links */}
      <div className="flex flex-wrap gap-4">

        <Link
          href="/about"
          style={{
            color: 'var(--muted)',
            transition: 'color .2s ease'
          }}
          onMouseEnter={e =>
            e.currentTarget.style.color = 'var(--gold)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.color = 'var(--muted)'
          }
        >
          About
        </Link>

        <Link
          href="/vision"
          style={{
            color: 'var(--muted)',
            transition: 'color .2s ease'
          }}
          onMouseEnter={e =>
            e.currentTarget.style.color = 'var(--gold)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.color = 'var(--muted)'
          }
        >
          Vision
        </Link>

        <Link
          href="/contact"
          style={{
            color: 'var(--muted)',
            transition: 'color .2s ease'
          }}
          onMouseEnter={e =>
            e.currentTarget.style.color = 'var(--gold)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.color = 'var(--muted)'
          }
        >
          Contact
        </Link>

      </div>

      {/* Copyright */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted)',
          opacity: 0.65
        }}
      >
        © {new Date().getFullYear()} VALAM. All rights reserved.
      </p>

    </div>
    <div style={{
      borderTop: '1px solid var(--border)',
      paddingTop: 12,
      marginTop: 12,
      fontSize: 10,
      color: 'var(--muted)',
      lineHeight: 1.7,
      textAlign: 'center',
    }}>
      VALAM is not a SEBI-registered Investment Adviser. All content is for
      educational purposes only and does not constitute investment advice.
      Investments are subject to market risks.
      <br />
      © {new Date().getFullYear()} VALAM. All rights reserved.
    </div>
  </footer>
)
}