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

            router.replace(profile ? '/dashboard' : '/onboarding/step1')
            return
          }
        }

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

          router.replace(profile ? '/dashboard' : '/onboarding/step1')
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
