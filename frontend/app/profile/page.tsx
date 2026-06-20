'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [joinedMonth, setJoinedMonth] = useState('')
  const [onboarded, setOnboarded] = useState(false)
  const [user, setUser] = useState<{
    email: string
    name: string
    age: number | null
  } | null>(null)
  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      if (profile) {

  setOnboarded(true)

  const joined = new Date(profile.created_at)
    .toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })

  setJoinedMonth(joined)

  setUser({
    email: session.user.email || '',
    name: profile.name || session.user.user_metadata.name || '',
    age: profile.age ?? null,
  })

} else {

  setOnboarded(false)

  setUser({
    email: session.user.email || '',
    name: session.user.user_metadata.name || '',
    age: null,
  })
}
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a0f0a] flex items-center justify-center">
        <h1 className="text-[#f5f0e8] text-2xl">
          Loading...
        </h1>
      </main>
    )
  }
  return (
  <main
    style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '2.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'all .3s ease'
    }}
  >

    {/* Logo */}
    <div
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(2rem,4vw,2.5rem)',
        fontWeight: 700,
        letterSpacing: '4px',
        color: 'var(--gold)',
        marginBottom: '2.5rem'
      }}
    >
      {/* VALAM ★ */}
    </div>

    {/* Card */}
    <div
      style={{
        width: '100%',
        maxWidth: '32rem',
        borderRadius: '1.5rem',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: '0 20px 50px rgba(0,0,0,.12)',
        padding: '2rem',
        transition: 'all .3s ease'
      }}
    >

      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >

        <div
          style={{
            width: '7rem',
            height: '7rem',
            borderRadius: '9999px',
            border: '4px solid var(--gold)',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.25rem',
            fontWeight: 700,
            color: 'var(--text)'
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <h1
          style={{
            marginTop: '1.25rem',
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.875rem',
            color: 'var(--text)'
          }}
        >
          Hey, {user?.name}
        </h1>

        {onboarded ? (

          <p
            style={{
              color: 'var(--muted)',
              marginTop: '.25rem'
            }}
          >
            Growing with VALAM since {joinedMonth}
          </p>

        ) : (

          <div
            style={{
              marginTop: '.75rem',
              textAlign: 'center'
            }}
          >

            <p
              style={{
                color: 'var(--muted)'
              }}
            >
              Complete your registration to save all your data.
            </p>

            <button
              onClick={() =>
                router.push('/onboarding/step1')
              }
              style={{
                marginTop: '1rem',
                borderRadius: '9999px',
                background:
                  'linear-gradient(135deg,var(--gold-lt) 0%,var(--gold) 40%,var(--bronze) 100%)',
                padding: '.5rem 1.25rem',
                fontSize: '.875rem',
                fontWeight: 600,
                color: '#2a1a0e',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform .2s ease'
              }}
            >
              Complete Registration →
            </button>

          </div>

        )}

      </div>

      {/* User Details */}
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >

        <div
          style={{
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            padding: '1rem 1.25rem'
          }}
        >
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '.875rem'
            }}
          >
            Email
          </p>

          <p
            style={{
              color: 'var(--text)',
              fontSize: '1.125rem',
              marginTop: '.25rem'
            }}
          >
            {user?.email}
          </p>
        </div>

        <div
          style={{
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            padding: '1rem 1.25rem'
          }}
        >
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '.875rem'
            }}
          >
            Name
          </p>

          <p
            style={{
              color: 'var(--text)',
              fontSize: '1.125rem',
              marginTop: '.25rem'
            }}
          >
            {user?.name}
          </p>
        </div>

        {onboarded && (

          <div
            style={{
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              padding: '1rem 1.25rem'
            }}
          >
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '.875rem'
              }}
            >
              Age
            </p>

            <p
              style={{
                color: 'var(--text)',
                fontSize: '1.125rem',
                marginTop: '.25rem'
              }}
            >
              {user?.age}
            </p>
          </div>

        )}

      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: '2.5rem',
          width: '100%',
          padding: '.85rem',
          borderRadius: '9999px',
          fontWeight: 700,
          color: '#2a1a0e',
          border: 'none',
          cursor: 'pointer',
          background:
            'linear-gradient(135deg,var(--gold-lt) 0%,var(--gold) 40%,var(--bronze) 100%)',
          boxShadow: '0 8px 24px rgba(184,146,74,.25)',
          transition: 'transform .2s ease'
        }}
      >
        Logout
      </button>

    </div>

  </main>
)
}