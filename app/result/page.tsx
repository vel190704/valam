'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  calculateVALAM,
  type VALAMResult,
  type IncomeKey,
  type SavingsKey,
  type InvestmentsKey,
  type ExperienceKey,
} from '@/lib/valam'

export default function ResultPage() {
  const router = useRouter()
  const hasSaved = useRef(false)
  const [result, setResult] = useState<VALAMResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true

    const name        = sessionStorage.getItem('valam_name')
    const ageStr      = sessionStorage.getItem('valam_age')
    const income      = sessionStorage.getItem('valam_income')
    const savings     = sessionStorage.getItem('valam_savings')
    const investments = sessionStorage.getItem('valam_investments')
    const knowledge   = sessionStorage.getItem('valam_knowledge')
    const goal        = sessionStorage.getItem('valam_goal')

    if (!name || !ageStr || !income || !savings || !investments || !knowledge) {
      router.push('/onboarding/step1')
      return
    }

    const age = parseInt(ageStr, 10)
    if (isNaN(age)) { router.push('/onboarding/step1'); return }

    let valamResult: VALAMResult
    try {
      valamResult = calculateVALAM({
        age,
        income:      income as IncomeKey,
        savingsRate: savings as SavingsKey,
        investments: investments as InvestmentsKey,
        experience:  knowledge as ExperienceKey,
      })
    } catch {
      router.push('/onboarding/step1')
      return
    }

    setResult(valamResult)

    setSaving(true)
    fetch('/api/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age,
        income,
        savingsRate:    savings,
        investments,
        experience:     knowledge,
        goal:           goal ?? '',
        valamScore:     valamResult.valamScore,
        valamLevel:     valamResult.valamLevel,
        valamLevelName: valamResult.valamLevelName,
        breakdown: {
          savingsScore:     valamResult.breakdown.savingsScore,
          investmentsScore: valamResult.breakdown.investmentsScore,
          incomeScore:      valamResult.breakdown.incomeScore,
          experienceScore:  valamResult.breakdown.experienceScore,
          ageScore:         valamResult.breakdown.ageScore,
        },
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text()
          console.error('Save failed:', res.status, errText)
          throw new Error('Save failed')
        }
        const data = await res.json() as { profileId: string }
        sessionStorage.setItem('valam_result', JSON.stringify(valamResult))
        localStorage.setItem('valam_profile_id', data.profileId)
      })
      .catch(() => {
        setSaveError('Could not save your profile. Your score is still shown below.')
      })
      .finally(() => setSaving(false))
  }, [router])

  if (!result) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1a0f0a' }}>
        <div style={{ textAlign: 'center', color: '#f5f0e8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontFamily: 'Inter, sans-serif' }}>Calculating your financial stage...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a',
      padding: '60px 24px 40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem',
            color: '#f5f0e8', marginBottom: '8px' }}>Your VALAM Assessment</h1>
          <p style={{ fontFamily: "'Cormorant Garamond', serif",
            color: 'rgba(245,240,232,0.7)', fontSize: '1.1rem' }}>
            Here is where you stand today
          </p>
        </div>

        {saveError && (
          <div style={{ background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.3)', borderRadius: '12px',
            padding: '12px 20px', marginBottom: '24px',
            fontFamily: 'Inter, sans-serif', color: '#ff9999',
            fontSize: '0.9rem', textAlign: 'center' }}>
            ⚠️ {saveError}
          </div>
        )}

        <div style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '16px',
          padding: '40px', marginBottom: '24px',
          border: '1px solid rgba(201,168,76,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem', color: '#5a3e28',
              letterSpacing: '2px', marginBottom: '8px' }}>
              YOUR VALAM SCORE
            </div>
            <div style={{ fontSize: '4rem', fontWeight: 700,
              color: '#c9a84c', marginBottom: '8px' }}>
              {result.valamScore.toFixed(2)}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif",
              fontSize: '1.8rem', fontWeight: 600, color: '#2a1a0e' }}>
              Level {result.valamLevel}: {result.valamLevelName}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(90,62,40,0.2)',
            paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
              color: '#2a1a0e', marginBottom: '16px' }}>Score Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '12px' }}>
              {[
                { label: '💰 Savings Rate', value: result.breakdown.savingsScore, max: 5 },
                { label: '💎 Investments', value: result.breakdown.investmentsScore, max: 5 },
                { label: '📈 Income', value: result.breakdown.incomeScore, max: 5 },
                { label: '📚 Experience', value: result.breakdown.experienceScore, max: 4 },
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
                  {result.breakdown.ageScore} / 5
                </div>
              </div>
            </div>
          </div>
        </div>

        {saving && (
          <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif',
            color: 'rgba(245,240,232,0.5)', fontSize: '0.85rem',
            marginBottom: '16px' }}>
            Saving your profile...
          </div>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #f0d080 0%, #c9a84c 40%, #a07828 100%)',
            border: 'none', borderRadius: '50px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600,
            fontSize: '1.1rem', color: '#2a1a0e' }}>
          Go to Dashboard →
        </button>
      </div>
    </main>
  )
}
