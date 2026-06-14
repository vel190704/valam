'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { VALAMResult } from '@/lib/valam'
import type { Recommendation, GoalKey } from '@/lib/recommendations'
import { supabase } from "@/lib/supabase";

interface DashboardData {
  name: string
  valamScore: number
  valamLevel: number
  valamLevelName: string
  goal: string
  investments: string
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
    ageScore: number
  }
}

interface ProfileAPIResponse {
  profile: {
    id: string; name: string; age: number; income: string
    savingsRate: string; investments: string; experience: string
    goal: string; valamScore: number; valamLevel: number
    valamLevelName: string
    breakdown: {
      savingsScore: number; investmentsScore: number; incomeScore: number
      experienceScore: number; ageScore: number
    }
    createdAt: string
    recommendation: Recommendation
  }
}

interface AllocationSlice { label: string; pct: number; color: string }

function getAllocation(level: number): AllocationSlice[] {
  if (level <= 2) return [
    { label: 'Emergency Fund', pct: 50, color: '#c9a84c' },
    { label: 'FDs',            pct: 30, color: '#8b6914' },
    { label: 'Mutual Funds',   pct: 20, color: '#5a3e28' },
  ]
  if (level <= 4) return [
    { label: 'Mutual Funds',   pct: 40, color: '#c9a84c' },
    { label: 'FDs',            pct: 25, color: '#8b6914' },
    { label: 'Stocks',         pct: 20, color: '#5a3e28' },
    { label: 'Emergency Fund', pct: 15, color: '#d4943a' },
  ]
  if (level <= 6) return [
    { label: 'Stocks',       pct: 40, color: '#c9a84c' },
    { label: 'Mutual Funds', pct: 30, color: '#8b6914' },
    { label: 'Bonds',        pct: 15, color: '#5a3e28' },
    { label: 'Gold',         pct: 15, color: '#d4943a' },
  ]
  return [
    { label: 'Stocks',        pct: 35, color: '#c9a84c' },
    { label: 'International', pct: 25, color: '#8b6914' },
    { label: 'Alternatives',  pct: 20, color: '#5a3e28' },
    { label: 'Bonds',         pct: 20, color: '#d4943a' },
  ]
}

function buildGradient(slices: AllocationSlice[]): string {
  let cursor = 0
  const parts: string[] = []
  for (const s of slices) {
    const start = cursor * 3.6
    cursor += s.pct
    parts.push(`${s.color} ${start}deg ${cursor * 3.6}deg`)
  }
  return `conic-gradient(${parts.join(', ')})`
}

const LEVEL_FLOOR: Record<number, number> = {
  1:1.0,2:1.5,3:2.0,4:2.5,5:3.0,6:3.5,7:4.0,8:4.5
}

function levelProgress(score: number, level: number): number {
  const floor = LEVEL_FLOOR[level] ?? 1.0
  return Math.min(100, Math.max(0, Math.round(((score - floor) / 0.5) * 100)))
}

export default function DashboardPage() {
  const [data, setData]             = useState<DashboardData | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'local' | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading]       = useState(true)

 useEffect(() => {
    async function load() {
      try {
        // 1. Let Supabase securely read and parse the user ID from localStorage
        const { data: { session } } = await supabase.auth.getSession()
        const profileId = session?.user?.id

        if (profileId) {
          try {
            const res = await fetch(`/api/profile?id=${encodeURIComponent(profileId)}`)
            if (res.ok) {
              const json = await res.json() as ProfileAPIResponse
              const p = json.profile
              setData({
                name: p.name, valamScore: p.valamScore,
                valamLevel: p.valamLevel, valamLevelName: p.valamLevelName,
                goal: p.goal, investments: p.investments,
                breakdown: p.breakdown,
              })
              setRecommendation(p.recommendation)
              setDataSource('live')
              setLoading(false)
              return
            }
          } catch(error) { 
            console.error("Frontend fetch failed entirely:", error) 
          }
        }
      } catch (authError) {
        console.error("Failed to retrieve Supabase session:", authError)
      }

      // 2. Fallback to sessionStorage if no authenticated database profile is found
      try {
        const raw         = sessionStorage.getItem('valam_result')
        const name        = sessionStorage.getItem('valam_name')
        const goal        = sessionStorage.getItem('valam_goal')
        const investments = sessionStorage.getItem('valam_investments')
        if (raw) {
          const parsed = JSON.parse(raw) as VALAMResult
          setData({
            name: name ?? '', valamScore: parsed.valamScore,
            valamLevel: parsed.valamLevel, valamLevelName: parsed.valamLevelName,
            goal: goal ?? '', investments: investments ?? '',
            breakdown: parsed.breakdown,
          })
          setDataSource('local')
          const recRes = await fetch(
            `/api/recommendations?level=${parsed.valamLevel}&goal=${encodeURIComponent(goal ?? 'wealth')}`
          )
          if (recRes.ok) {
            const recJson = await recRes.json() as { recommendation: Recommendation }
            setRecommendation(recJson.recommendation)
          }
        }
      } catch { /* both sources failed */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#f5f0e8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading your dashboard...</p>
      </div>
    </main>
  )

  if (!data) return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#f5f0e8', maxWidth: '400px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif",
          marginBottom: '16px' }}>No assessment found</h2>
        <Link href="/onboarding/step1"
          style={{ background: 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)',
            padding: '14px 40px', borderRadius: '50px', textDecoration: 'none',
            color: '#2a1a0e', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          Start Assessment →
        </Link>
      </div>
    </main>
  )

  const allocation = getAllocation(data.valamLevel)
  const gradient   = buildGradient(allocation)
  const progress   = levelProgress(data.valamScore, data.valamLevel)

  return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a',
      padding: '40px 24px 120px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
    
    {/* Header */}
    <div style={{ 
      position: 'relative',        // Anchor point for absolute centering
      display: 'flex', 
      justifyContent: 'flex-end',  // Automatically pushes the status badge to the right edge
      alignItems: 'center', 
      minHeight: '40px',           // Gives a consistent baseline alignment height
      marginBottom: '40px' 
    }}>
      
      {/* Title - Locked to exact horizontal center of the 900px container */}
      <div style={{ 
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)', // Centers the text relative to its own width
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', // Responsive sizing across mobile & desktop
        color: '#c9a84c', 
        fontWeight: 700,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap'          // Prevents the text from wrapping tightly on small phones
      }}>
        VALAM ★
      </div>

      {/* Status Badge - Pushed to the right, sitting smoothly on top of layout layer */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        fontFamily: 'Inter, sans-serif', 
        fontSize: '0.8rem',
        background: 'rgba(245,240,232,0.1)', 
        borderRadius: '20px',
        padding: '4px 12px', 
        border: '1px solid rgba(201,168,76,0.3)',
        zIndex: 2                    // Keeps badge clickable/hoverable above background lines
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%',
          background: dataSource === 'live' ? '#4caf50' : '#ffc107',
          display: 'inline-block' 
        }}></span>
        <span style={{ color: '#f5f0e8' }}>
          {dataSource === 'live' ? 'Live' : 'Local'}
        </span>
      </div>

    </div>


        <h1 style={{ fontFamily: "'Playfair Display', serif",
          fontSize: '2rem', color: '#f5f0e8', marginBottom: '8px' }}>
          {data.name ? `Welcome back, ${data.name}! 👋` : 'Welcome back! 👋'}
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond', serif",
          color: 'rgba(245,240,232,0.6)', fontSize: '1.1rem',
          marginBottom: '32px' }}>
          Your wealth journey is progressing well
        </p>

        {/* Level Card */}
        <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
          padding: '32px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                color: '#2a1a0e', fontSize: '1.2rem' }}>
                Level {data.valamLevel}: {data.valamLevelName}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif',
                color: '#5a3e28', fontSize: '0.9rem' }}>
                VALAM Score: {data.valamScore.toFixed(2)}
                {data.valamLevel < 8 ? ` · ${progress}% to Level ${data.valamLevel + 1}` : ' · Max Level'}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#f0d080,#c9a84c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif', fontWeight: 700,
              fontSize: '1.2rem', color: '#2a1a0e' }}>
              {data.valamLevel}
            </div>
          </div>
          <div style={{ height: '8px', background: 'rgba(90,62,40,0.2)',
            borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg,#c9a84c,#f0d080)',
              borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem',
            color: '#5a3e28', marginTop: '8px' }}>
            {progress}% to next level
          </div>
        </div>

        {/* Goal */}
        <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
          padding: '24px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.3)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif",
            color: '#2a1a0e', marginBottom: '8px' }}>
            Your Goal: {data.goal || '—'}
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#5a3e28',
            fontSize: '0.95rem' }}>
            Current investments: {data.investments || '—'}
          </p>
        </div>

        {/* Score Breakdown */}
        <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
          padding: '32px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.3)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif",
            fontSize: '1.4rem', color: '#2a1a0e', marginBottom: '20px' }}>
            Score Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '12px' }}>
            {[
              { label: '💰 Savings Rate', value: data.breakdown.savingsScore, max: 5 },
              { label: '💎 Investments',  value: data.breakdown.investmentsScore, max: 5 },
              { label: '📈 Income',       value: data.breakdown.incomeScore, max: 5 },
              { label: '📚 Experience',   value: data.breakdown.experienceScore, max: 4 },
            ].map((item) => (
              <div key={item.label} style={{ padding: '12px',
                background: 'rgba(201,168,76,0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#5a3e28',
                  marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontWeight: 600, color: '#2a1a0e' }}>
                  {item.value} / {item.max}
                </div>
              </div>
            ))}
            <div style={{ padding: '12px', background: 'rgba(201,168,76,0.1)',
              borderRadius: '8px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.85rem', color: '#5a3e28',
                marginBottom: '4px' }}>🎂 Age Score</div>
              <div style={{ fontWeight: 600, color: '#2a1a0e' }}>
                {data.breakdown.ageScore} / 5
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        {recommendation ? (
          <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
            padding: '32px', marginBottom: '24px',
            border: '1px solid rgba(201,168,76,0.3)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif",
              fontSize: '1.4rem', color: '#2a1a0e', marginBottom: '8px' }}>
              Your Roadmap
            </h3>
            <div style={{ fontFamily: "'Playfair Display', serif",
              fontSize: '1.3rem', color: '#c9a84c', marginBottom: '12px',
              fontStyle: 'italic' }}>
              {recommendation.headline}
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif",
              color: '#5a3e28', fontSize: '1rem', lineHeight: '1.6',
              marginBottom: '24px' }}>
              {recommendation.summary}
            </p>
            <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
              color: '#2a1a0e', marginBottom: '12px' }}>Your Next Steps</h4>
            <div style={{ display: 'flex', flexDirection: 'column',
              gap: '12px', marginBottom: '24px' }}>
              {recommendation.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px',
                  alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#f0d080,#c9a84c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    fontSize: '0.85rem', color: '#2a1a0e', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#2a1a0e',
                    fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
            <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
              color: '#2a1a0e', marginBottom: '12px' }}>Recommended For You</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px',
              marginBottom: '24px' }}>
              {recommendation.products.map((p) => (
                <span key={p} style={{ padding: '6px 14px',
                  border: '1px solid #c9a84c', borderRadius: '20px',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                  color: '#c9a84c' }}>{p}</span>
              ))}
            </div>
            <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: '12px',
              padding: '16px', marginBottom: '12px',
              display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>🏆</span>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  color: '#2a1a0e', fontSize: '0.85rem', marginBottom: '4px' }}>
                  Next Milestone
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#5a3e28',
                  fontSize: '0.9rem', margin: 0 }}>
                  {recommendation.milestone}
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,80,80,0.06)', borderRadius: '12px',
              padding: '16px', display: 'flex', gap: '12px',
              alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  color: '#2a1a0e', fontSize: '0.85rem', marginBottom: '4px' }}>
                  Common Mistake to Avoid
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#5a3e28',
                  fontSize: '0.9rem', margin: 0 }}>
                  {recommendation.warning}
                </p>
              </div>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif",
              fontSize: '0.85rem', color: '#8b6914', textAlign: 'center',
              fontStyle: 'italic', marginTop: '20px' }}>
              This is educational guidance based on your inputs. Please consult
              a certified financial planner before making actual investments.
            </p>
          </div>
        ) : (
          <div style={{ background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px',
            padding: '32px', marginBottom: '24px', textAlign: 'center',
            color: 'rgba(245,240,232,0.4)', fontFamily: 'Inter, sans-serif' }}>
            Loading your personalised roadmap...
          </div>
        )}

        {/* Portfolio */}
        <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
          padding: '32px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.3)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif",
            fontSize: '1.4rem', color: '#2a1a0e', marginBottom: '24px' }}>
            Portfolio Overview
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: '40px', marginBottom: '24px',
            flexWrap: 'wrap' }}>
            <div style={{ width: '140px', height: '140px',
              borderRadius: '50%', background: gradient }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allocation.map((s) => (
                <div key={s.label} style={{ display: 'flex',
                  alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '14px', height: '14px',
                    borderRadius: '3px', background: s.color }}></div>
                  <span style={{ fontFamily: 'Inter, sans-serif',
                    color: '#2a1a0e', fontSize: '0.9rem' }}>
                    {s.label} {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif",
            fontSize: '0.85rem', color: '#5a3e28', textAlign: 'center',
            fontStyle: 'italic' }}>
            This is a model allocation for educational purposes based on your inputs.
            Please consult a certified financial planner before making actual investments.
          </p>
        </div>

      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a0f0a', borderTop: '1.5px solid rgba(201,168,76,0.3)',
        padding: '12px 24px', display: 'flex',
        justifyContent: 'space-around', zIndex: 10 }}>
        {[
          { href: '/dashboard', icon: '🏠', label: 'Home' },
          { href: '#', icon: '📊', label: 'Portfolio' },
          { href: '#', icon: '🎯', label: 'Goals' },
          { href: '#', icon: '👤', label: 'Profile' },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            style={{ color: item.href === '/dashboard'
              ? '#c9a84c' : 'rgba(245,240,232,0.5)',
              textDecoration: 'none', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
            <span style={{ fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
