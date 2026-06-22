'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Session } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null);
  const [isonboarded, setIsonboarded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [navigating, setNavigating] = useState(false);
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    getSession()
    const keysToRemove = [
      'valam_name', 'valam_age', 'valam_income', 'valam_savings',
      'valam_investments', 'valam_knowledge', 'valam_goal', 'valam_result'
    ]
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    localStorage.removeItem('valam_profile_id')
  }, [])

  useEffect(() => {
    async function checkExistingProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', session.user.id)
          .maybeSingle()
        setIsonboarded(profile?.onboarded === true)
      } finally {
        setChecking(false)
      }
    }
    void checkExistingProfile()
  }, [router])

  return (
    <main
  style={{
    position: 'relative',
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 24px 40px',
    textAlign: 'center',
    transition: 'background .3s ease, color .3s ease'
  }}
>

      <div style={{ fontFamily: "'Playfair Display', serif",
        fontSize: '2rem', color: 'var(--gold)', fontWeight: 700,
        marginBottom: '48px', letterSpacing: '4px' }}>
        VALAM ★
      </div>

      <h1 style={{ fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--text)',
        fontWeight: 700, marginBottom: '24px', lineHeight: 1.2,
        maxWidth: '700px', transition: 'color .3s ease' }}>
        Your Journey to Unlock Your Financial Potential
      </h1>

      <p style={{ fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.2rem', color: 'var(--muted)',
        maxWidth: '560px', lineHeight: 1.7, marginBottom: '56px' }}>
        Investing isn&apos;t for the rich, it&apos;s for anyone who wants financial freedom.
        Join the top 10% of Indians who actively invest by building wealth through
        this smart, safe, and personalized journey.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '16px', maxWidth: '560px', width: '100%',
        marginBottom: '32px' }}>
        {[
          { icon: '📊', title: 'Discover Your Financial Stage',
            desc: 'Know exactly where you stand' },
          { icon: '🗺️', title: 'Get Your Roadmap',
            desc: 'Personalised steps to grow wealth' },
          { icon: '💡', title: 'India-First Advice',
            desc: 'SIP, ELSS, NPS, PPF — done right' },
          { icon: '🎯', title: '8 Wealth Levels',
            desc: 'From Seed to Legend' },
        ].map((item) => (
          <div key={item.title} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px',
            textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'all .3s ease' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              {item.icon}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif',
              fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem',
              marginBottom: '4px' }}>{item.title}</div>
            <div style={{ fontFamily: 'Inter, sans-serif',
              color: 'var(--muted)', fontSize: '0.8rem' }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={checking || navigating}
        onClick={async () => {
          setNavigating(true)
          try {
            const { data: { session: liveSession } } = await supabase.auth.getSession()
            if (!liveSession?.user) { router.push('/onboarding/step1'); return }
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarded')
              .eq('user_id', liveSession.user.id)
              .maybeSingle()
            router.push(profile?.onboarded ? '/dashboard' : '/onboarding/step1')
          } finally {
            setNavigating(false)
          }
        }}
        style={{ padding: '18px 56px',
          background: 'linear-gradient(135deg, var(--gold-lt) 0%, var(--gold) 40%, var(--bronze) 100%)',
          border: 'none', borderRadius: '50px',
          cursor: (checking || navigating) ? 'default' : 'pointer',
          opacity: (checking || navigating) ? 0.6 : 1,
          fontFamily: 'Inter, sans-serif', fontWeight: 700,
          fontSize: '1.1rem', color: '#2a1a0e',
          boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
          transition: 'opacity 0.2s' }}>
        {(checking || navigating) ? '…' : session && isonboarded ? 'Go to Dashboard →' : 'Get Started →'}
      </button>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
        color: 'var(--muted)', marginTop: '24px' }}>
        Free · No login required · Takes 2 minutes
      </p>
    </main>
  )
}
