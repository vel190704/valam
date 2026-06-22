'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  calculateVALAM,
  LEVEL_NAMES_ARR,
  type VALAMResult,
  type IncomeKey,
  type SavingsKey,
  type InvestmentsKey,
  type ExperienceKey,
} from '@/lib/valam'
import { supabase } from '@/lib/supabase'

export default function ResultPage() {
  const router = useRouter()
  const hasSaved = useRef(false)
  const [result, setResult] = useState<VALAMResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresSignup, setRequiresSignup] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true

    async function calculateAndSave() {
      const name        = sessionStorage.getItem('valam_name') ?? ''
      const age         = Number(sessionStorage.getItem('valam_age') ?? 0)
      const experience  = sessionStorage.getItem('valam_experience') ?? 'beginner'
      const income      = sessionStorage.getItem('valam_income') ?? '<3L'
      const savingsRate = sessionStorage.getItem('valam_savings') ?? '<2'
      const investments = sessionStorage.getItem('valam_investments') ?? '<10k'
      const goal        = sessionStorage.getItem('valam_goal') ?? 'wealth'

      const calculated = calculateVALAM({
        age,
        income:      income as IncomeKey,
        savingsRate: savingsRate as SavingsKey,
        investments: investments as InvestmentsKey,
        experience:  experience as ExperienceKey,
      })
      setResult(calculated)
      setLoading(false)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setRequiresSignup(true)
        return
      }

      try {
        const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
        const saveRes = await fetch(`${BASE}/profile/save-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name,
            age,
            income,
            savingsRate,
            investments,
            experience,
            goal,
            valamScore:         calculated.positionScore,
            valamLevel:         calculated.positionLevel,
            valamLevelName:     calculated.positionLevelName,
            potentialScore:     calculated.potentialScore,
            potentialLevel:     calculated.potentialLevel,
            potentialLevelName: calculated.potentialLevelName,
            wealthVelocity:     calculated.breakdown.wealthVelocity,
            breakdown: {
              savingsScore:     calculated.breakdown.savingsScore,
              investmentsScore: calculated.breakdown.wealthVelocityScore,
              incomeScore:      calculated.breakdown.incomeScore,
              experienceScore:  calculated.breakdown.experienceScore,
              ageScore:         calculated.breakdown.ageScore,
            },
          }),
        })
        if (!saveRes.ok) {
          const body = await saveRes.text()
          console.error('save-assessment failed:', saveRes.status, body)
          let msg: string
          try { msg = (JSON.parse(body) as { error?: string; detail?: string }).error ?? `HTTP ${saveRes.status}` }
          catch { msg = `HTTP ${saveRes.status}` }
          setSaveError(msg)
        }
      } catch (err) {
        console.error('Failed to save profile:', err)
        setSaveError('Network error — check your connection and try again.')
      }
    }

    void calculateAndSave()
  }, [])

  if (loading) return (
    <main style={{
      minHeight: '100vh',
      background: '#1a0f0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '3rem',
        fontWeight: 700,
        color: '#c9a84c',
        letterSpacing: '0.25em',
        lineHeight: 1,
      }}>
        VALAM
      </div>
      <div style={{
        fontFamily: 'Cormorant Garamond, Playfair Display, serif',
        fontSize: '1.1rem',
        color: 'rgba(245,240,232,0.6)',
        letterSpacing: '0.08em',
        fontStyle: 'italic',
      }}>
        Calculating your financial stage…
      </div>
      <div style={{
        marginTop: 8,
        width: 40,
        height: 40,
        border: '3px solid rgba(201,168,76,0.2)',
        borderTop: '3px solid #c9a84c',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}/>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )

  if (!result) return null

  return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a', padding: '112px 24px 60px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏆</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif",
            fontSize: '2.2rem', color: '#f5f0e8', marginBottom: '8px' }}>
            Your VALAM Assessment
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond', serif",
            color: 'rgba(245,240,232,0.7)', fontSize: '1.1rem' }}>
            Here is where you stand today
          </p>
        </div>

        {/* ── Guest signup banner ── */}
        {requiresSignup && (
          <div style={{
            maxWidth: 600,
            margin: '0 auto 24px',
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 16,
              color: '#c9a84c',
              fontWeight: 600,
            }}>
              Save your assessment
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(245,240,232,0.7)',
              lineHeight: 1.6,
            }}>
              Create a free account to save your VALAM score,
              track your progress, and access your personalised dashboard.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/signup" style={{
                background: 'linear-gradient(135deg, #c9a84c, #8b6914)',
                color: '#fff',
                borderRadius: 10,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
              }}>
                Sign Up Free →
              </a>
              <a href="/login" style={{
                background: 'none',
                border: '1px solid rgba(201,168,76,0.4)',
                color: 'rgba(245,240,232,0.8)',
                borderRadius: 10,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
              }}>
                Log In
              </a>
            </div>
          </div>
        )}

        {/* ── Save error banner ── */}
        {saveError && (
          <div style={{
            maxWidth: 600,
            margin: '0 auto 24px',
            background: 'rgba(192,57,43,0.12)',
            border: '1px solid rgba(192,57,43,0.4)',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13,
                fontWeight: 600, color: '#f5a5a5', marginBottom: 4 }}>
                Score could not be saved
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12,
                color: 'rgba(245,240,232,0.7)', lineHeight: 1.5 }}>
                {saveError} — your result is shown below but was not persisted.
                Refresh and try again, or contact support if the problem persists.
              </div>
            </div>
          </div>
        )}

        {/* CARD 1: Current Position */}
        <div style={{ background: 'rgba(245,240,232,0.95)',
          borderRadius: '20px', padding: '36px', marginBottom: '20px',
          border: '1px solid rgba(201,168,76,0.3)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                letterSpacing: '2px', color: '#8b6914', fontWeight: 600,
                marginBottom: '6px' }}>CURRENT POSITION</div>
              <div style={{ fontFamily: "'Playfair Display', serif",
                fontSize: '2rem', fontWeight: 700, color: '#2a1a0e',
                marginBottom: '2px' }}>
                Level {result.positionLevel}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif",
                fontSize: '1.3rem', color: '#c9a84c', fontWeight: 600 }}>
                {result.positionLevelName}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                color: '#8b6914', marginTop: '6px' }}>
                Score: {result.positionScore}
              </div>
            </div>
            <button
              onClick={() => {
                const text = `I just discovered my VALAM Financial Stage!\n\n🏆 Level ${result.positionLevel}: ${result.positionLevelName}\n\nDiscover yours at valamhq.com`
                if (navigator.share) {
                  navigator.share({ title: 'My VALAM Stage', text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{ padding: '8px 18px',
                background: 'linear-gradient(135deg,#f0d080,#c9a84c)',
                border: 'none', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '0.85rem', color: '#2a1a0e',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
              📤 Share
            </button>
          </div>

          {/* Position Slider */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '100%', height: '8px',
                    background: n <= result.positionLevel ? '#c9a84c' : 'rgba(201,168,76,0.2)',
                    borderRadius: n === 1 ? '4px 0 0 4px' : n === 8 ? '0 4px 4px 0' : '0',
                    borderRight: n < 8 ? '2px solid rgba(245,240,232,0.95)' : '' }} />
                  <div style={{ fontFamily: 'Inter, sans-serif',
                    fontSize: '0.65rem',
                    color: n === result.positionLevel ? '#c9a84c' : '#8b6914',
                    fontWeight: n === result.positionLevel ? 700 : 400,
                    marginTop: '4px' }}>{n}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {LEVEL_NAMES_ARR.map((name, i) => (
                <div key={name} style={{ flex: 1, textAlign: 'center',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
                  color: i + 1 === result.positionLevel ? '#2a1a0e' : 'rgba(90,62,40,0.5)',
                  fontWeight: i + 1 === result.positionLevel ? 700 : 400,
                  lineHeight: 1.2 }}>
                  {i + 1 === result.positionLevel ? name : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: Future Potential */}
        <div style={{ background: 'linear-gradient(135deg, #2a1a0e 0%, #3d2510 100%)',
          borderRadius: '20px', padding: '36px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.4)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                letterSpacing: '2px', color: '#c9a84c', fontWeight: 600,
                marginBottom: '6px' }}>FUTURE POTENTIAL</div>
              <div style={{ fontFamily: "'Playfair Display', serif",
                fontSize: '2rem', fontWeight: 700, color: '#f5f0e8',
                marginBottom: '2px' }}>
                Level {result.potentialLevel}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif",
                fontSize: '1.3rem', color: '#f0d080', fontWeight: 600 }}>
                {result.potentialLevelName}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                color: 'rgba(245,240,232,0.5)', marginTop: '6px' }}>
                Score: {result.potentialScore}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif",
                color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem',
                marginTop: '8px' }}>
                With consistent effort, you can reach this level!
              </p>
            </div>
            <button
              onClick={() => {
                const text = `My VALAM Future Potential!\n\n🚀 Level ${result.potentialLevel}: ${result.potentialLevelName}\n\nWith consistent effort I can reach this! Discover yours at valamhq.com`
                if (navigator.share) {
                  navigator.share({ title: 'My VALAM Potential', text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{ padding: '8px 18px',
                background: 'rgba(201,168,76,0.2)',
                border: '1px solid rgba(201,168,76,0.5)',
                borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '0.85rem', color: '#f0d080',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
              📤 Share
            </button>
          </div>

          {/* Potential Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '100%', height: '8px',
                    background: n <= result.potentialLevel
                      ? n <= result.positionLevel ? '#c9a84c' : 'rgba(240,208,128,0.5)'
                      : 'rgba(201,168,76,0.15)',
                    borderRadius: n === 1 ? '4px 0 0 4px' : n === 8 ? '0 4px 4px 0' : '0',
                    borderRight: n < 8 ? '2px solid rgba(42,26,14,0.8)' : '' }} />
                  <div style={{ fontFamily: 'Inter, sans-serif',
                    fontSize: '0.65rem',
                    color: n === result.potentialLevel ? '#f0d080' : 'rgba(201,168,76,0.5)',
                    fontWeight: n === result.potentialLevel ? 700 : 400,
                    marginTop: '4px' }}>{n}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {LEVEL_NAMES_ARR.map((name, i) => (
                <div key={name} style={{ flex: 1, textAlign: 'center',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.6rem',
                  color: i + 1 === result.potentialLevel
                    ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.2)',
                  fontWeight: i + 1 === result.potentialLevel ? 700 : 400,
                  lineHeight: 1.2 }}>
                  {i + 1 === result.potentialLevel ? name : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => requiresSignup
            ? router.push('/signup')
            : router.push('/dashboard')
          }
          style={{ width: '100%', padding: '16px',
            background: 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)',
            border: 'none', borderRadius: '50px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: '1.1rem', color: '#2a1a0e' }}>
          {requiresSignup ? 'Sign Up to Save →' : 'Go to Dashboard →'}
        </button>
      </div>
    </main>
  )
}
