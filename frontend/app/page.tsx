'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { fetchCurrentUser, type AuthUser } from '@/lib/backend-api'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const getSession = async () => {
    setUser(await fetchCurrentUser());
  }
  getSession();
    const keysToRemove = [
      'valam_name', 'valam_age', 'valam_income', 'valam_savings',
      'valam_investments', 'valam_knowledge', 'valam_goal', 'valam_result'
    ]
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    localStorage.removeItem('valam_profile_id')
  }, [])

  return (
    <main
  style={{
    position: 'relative',
    minHeight: '100vh',
    background: '#1a0f0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 24px 40px',
    textAlign: 'center'
  }}
>

      <div style={{ fontFamily: "'Playfair Display', serif",
        fontSize: '2rem', color: '#c9a84c', fontWeight: 700,
        marginBottom: '48px', letterSpacing: '4px' }}>
        VALAM ★
      </div>

      <h1 style={{ fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#f5f0e8',
        fontWeight: 700, marginBottom: '24px', lineHeight: 1.2,
        maxWidth: '700px' }}>
        Your Journey to Unlock Your Financial Potential
      </h1>

      <p style={{ fontFamily: "'Cormorant Garamond', serif",
        fontSize: '1.2rem', color: 'rgba(245,240,232,0.7)',
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
            background: 'rgba(245,240,232,0.06)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: '12px', padding: '20px',
            textAlign: 'left' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              {item.icon}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif',
              fontWeight: 600, color: '#f5f0e8', fontSize: '0.9rem',
              marginBottom: '4px' }}>{item.title}</div>
            <div style={{ fontFamily: 'Inter, sans-serif',
              color: 'rgba(245,240,232,0.5)', fontSize: '0.8rem' }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      <button
         onClick={() => {
    if (!user) {
      router.push('/onboarding/step1')
      return
    }

    router.push('/dashboard')
  }}
        style={{ padding: '18px 56px',
          background: 'linear-gradient(135deg, #f0d080 0%, #c9a84c 40%, #a07828 100%)',
          border: 'none', borderRadius: '50px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontWeight: 700,
          fontSize: '1.1rem', color: '#2a1a0e',
          boxShadow: '0 4px 24px rgba(201,168,76,0.3)' }}>
        {user ? 'Go to Dashboard ->' : 'Get Started ->'}
      </button>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
        color: 'rgba(245,240,232,0.3)', marginTop: '24px' }}>
        Free · No login required · Takes 2 minutes
      </p>
    </main>
  )
}
