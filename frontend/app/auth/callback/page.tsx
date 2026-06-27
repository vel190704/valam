'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = new URLSearchParams(window.location.search).get('code')

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (data?.session) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', data.session.user.id)
              .maybeSingle()

            if (profile) {
              router.replace('/dashboard')
              return
} else {
  const pending =
    localStorage.getItem(
      'pendingAssessment'
    )

  if (pending) {
    try {

      const BASE =
        process.env
          .NEXT_PUBLIC_BACKEND_URL
        ?? 'http://localhost:5000'

      const assessment =
        JSON.parse(pending)

      const res = await fetch(
        `${BASE}/profile/save-assessment`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${data.session.access_token}`
          },

          body:
            JSON.stringify(
              assessment
            )
        }
      )

      if (res.ok) {
        localStorage.removeItem(
          'pendingAssessment'
        )

        router.replace('/dashboard')

      } else {
        router.replace(
          '/result'
        )
      }
    } catch (err) {
      console.error(
        'Migration failed',
        err
      )
      router.replace(
        '/result'
      )
    }
  } }
} }

        // No code in URL — check if session already exists
        // (happens when Supabase processes the hash fragment automatically)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle()

         if (profile) {
              router.replace('/dashboard')
              return
} else {
  const pending =
    localStorage.getItem(
      'pendingAssessment'
    )

  if (pending) {
    try {

      const BASE =
        process.env
          .NEXT_PUBLIC_BACKEND_URL
        ?? 'http://localhost:5000'

      const assessment =
        JSON.parse(pending)

      const res = await fetch(
        `${BASE}/profile/save-assessment`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`
          },

          body:
            JSON.stringify(
              assessment
            )
        }
      )

      if (res.ok) {
        localStorage.removeItem(
          'pendingAssessment'
        )

        router.replace('/dashboard')

      } else {
        router.replace(
          '/result'
        )
      }
    } catch (err) {
      console.error(
        'Migration failed',
        err
      )
      router.replace(
        '/result'
      )
    }
  }
else{
  router.replace('/onboarding/step1')
}}
        } else {
          router.replace('/login?error=oauth_failed')
        }
      } catch (err) {
        console.error('Callback error:', err)
        router.replace('/login?error=oauth_failed')
      }
    }

    void handleCallback()
  }, [router])

  return (
    <main style={{ minHeight:'100vh', background:'#1a0f0a',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#f5f0e8' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'16px' }}>⏳</div>
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:'1rem' }}>
          Completing sign in...
        </p>
      </div>
    </main>
  )
}
