'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

type Props = {
  activeTab:
    | 'Dashboard'
    | 'Portfolio'
    | 'Net Worth'
    | 'Goals'
    | 'Allocation'
}

export default function DNavbar({
  activeTab,
}: Props) {
  const [dark, setDark] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
      async function load() {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user)
            return
        const BASE    = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
        const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
        try {
          const [profileRes] = await Promise.all([
            fetch(`${BASE}/profile`,{ headers }),
          ])
          if (profileRes.ok) {
            const json = await profileRes.json() as {
              profile: {
                name: string; 
              }
            }
            const p = json.profile
            setName(p.name)
          }
        } catch (err) {
          console.error('Failed to load dashboard:', err)
        }
      }
      void load()
    }, [])

    async function handleSignOut() {
      await supabase.auth.signOut()
      sessionStorage.clear()
      localStorage.clear()
      router.push('/')
    }

  const tabs = [
    'Dashboard',
    'Portfolio',
    'Net Worth',
    'Goals',
    'Allocation',
  ] as const

  return (
    <>
      {/* TOP NAV */}
      <nav
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 28px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,.07)',
        }}
      >

        {/* Left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <Link
            href="/"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <span
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 14
              }}
            >
              V
            </span>
          </Link>

          <Link
            href="/"
            style={{
              textDecoration: 'none',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--text)',
            }}
          >
            VALAM
          </Link>
        </div>

        {/* Right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >

          {/* Live / Local */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              background: 'var(--surface2)',
              borderRadius: 20,
              padding: '3px 10px',
              border: '1px solid var(--border)',
            }}
          >
          </div>
          {/* Theme */}
          <button
            onClick={() => setDark(!dark)}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {dark
              ? '☀️ Light'
              : '🌙 Dark'}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border:
                '1px solid rgba(201,168,76,0.3)',
              borderRadius: 20,
              padding: '4px 14px',
              fontSize: 11,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>

          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg,var(--gold),var(--bronze))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {name
  ? name.charAt(0).toUpperCase()
  : 'U'}
          </div>

        </div>
      </nav>

      {/* TAB BAR */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',

          height: 44,

          display: 'flex',

          alignItems: 'stretch',

          padding: '0 28px',

          position: 'sticky',

          top: 51,

          zIndex: 19,
        }}
      >

        {tabs.map(tab => (

          <div

            key={tab}

            onClick={() => {

              if (tab === 'Dashboard')
                router.push('/dashboard')

              if (tab === 'Portfolio')
                router.push('/portfolio')

              if (tab === 'Net Worth')
                router.push('/networth')

              if (tab === 'Goals')
                router.push('/goals')

              if (tab === 'Allocation')
                router.push('/allocation')

            }}

            style={{

              display: 'flex',

              alignItems: 'center',

              padding: '0 18px',

              fontSize: 12,

              fontWeight: 500,

              color:

                tab === activeTab

                  ? 'var(--gold)'

                  : 'var(--muted)',

              borderBottom:

                tab === activeTab

                  ? '2.5px solid var(--gold)'

                  : '2.5px solid transparent',

              cursor: 'pointer',

              transition: '.2s',
            }}
          >

            {tab}

          </div>

        ))}

      </div>
    </>
  )
}