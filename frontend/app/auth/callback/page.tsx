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
        console.log('Callback hit, code present:', !!code)

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('Exchange result:', { success: !!data?.session, error: error?.message })

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
  console.log('checking if user filled form')
  const pending =
    localStorage.getItem(
      'pendingAssessment'
    )

  if (pending) {
    console.log('user has filled the form so creating new profile with input data');
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
        console.log('data saved so removing local cache now')
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
        console.log('Existing session check:', !!session)

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
  console.log('checking if user filled form')
  const pending =
    localStorage.getItem(
      'pendingAssessment'
    )

  if (pending) {
    console.log('user has filled the form so creating new profile with input data');
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
        console.log('data saved so removing local cache now')
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
