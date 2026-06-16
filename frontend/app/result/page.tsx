'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  calculateVALAM,
  type ExperienceKey,
  type IncomeKey,
  type InvestmentsKey,
  type SavingsKey,
  type VALAMResult,
} from '@/lib/valam'
import { isLoggedIn, saveCurrentProfile } from '@/lib/backend-api'

export default function ResultPage() {
  const router = useRouter()
  const hasInitialized = useRef(false)
  const [result, setResult] = useState<VALAMResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [requiresSignup, setRequiresSignup] = useState(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function calculateAndMaybeSave() {
      const name = sessionStorage.getItem('valam_name')
      const ageStr = sessionStorage.getItem('valam_age')
      const income = sessionStorage.getItem('valam_income')
      const savings = sessionStorage.getItem('valam_savings')
      const investments = sessionStorage.getItem('valam_investments')
      const knowledge = sessionStorage.getItem('valam_knowledge')
      const goal = sessionStorage.getItem('valam_goal')

      if (!name || !ageStr || !income || !savings || !investments || !knowledge) {
        router.push('/onboarding/step1')
        return
      }

      const age = parseInt(ageStr, 10)
      if (Number.isNaN(age)) {
        router.push('/onboarding/step1')
        return
      }

      let valamResult: VALAMResult
      try {
        valamResult = calculateVALAM({
          age,
          income: income as IncomeKey,
          savingsRate: savings as SavingsKey,
          investments: investments as InvestmentsKey,
          experience: knowledge as ExperienceKey,
        })
      } catch {
        router.push('/onboarding/step1')
        return
      }

      setResult(valamResult)
      setSaveError(null)
      sessionStorage.setItem('valam_result', JSON.stringify(valamResult))

      if (!isLoggedIn()) {
        setRequiresSignup(true)
        return
      }

      setRequiresSignup(false)
      setSaving(true)

      try {
        const data = await saveCurrentProfile({
          name,
          age,
          income,
          savingsRate: savings,
          investments,
          experience: knowledge,
          goal: goal ?? 'wealth',
          valamScore: valamResult.valamScore,
          valamLevel: valamResult.valamLevel,
          valamLevelName: valamResult.valamLevelName,
          breakdown: {
            savingsScore: valamResult.breakdown.savingsScore,
            investmentsScore: valamResult.breakdown.investmentsScore,
            incomeScore: valamResult.breakdown.incomeScore,
            experienceScore: valamResult.breakdown.experienceScore,
            ageScore: valamResult.breakdown.ageScore,
          },
        })

        localStorage.setItem('valam_profile_id', data.profileId)
      } catch {
        setSaveError('Could not save your profile. Your score is still shown below.')
      } finally {
        setSaving(false)
      }
    }

    void calculateAndMaybeSave()
  }, [router])

  if (!result) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a0f0a',
        }}
      >
        <div style={{ textAlign: 'center', color: '#f5f0e8' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3rem',
              marginBottom: '16px',
              color: '#c9a84c',
              fontWeight: 700,
              letterSpacing: '4px',
            }}
          >
            VALAM
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem' }}>
            Calculating your financial stage...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a0f0a', padding: '112px 24px 60px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.5rem',
              marginBottom: '12px',
              color: '#c9a84c',
              fontWeight: 700,
              letterSpacing: '5px',
            }}
          >
            VALAM
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '2.2rem',
              color: '#f5f0e8',
              marginBottom: '8px',
            }}
          >
            Your VALAM Assessment
          </h1>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: 'rgba(245,240,232,0.7)',
              fontSize: '1.1rem',
            }}
          >
            Here is where you stand today
          </p>
        </div>

        {requiresSignup && (
          <div className="mb-6 rounded-2xl border border-[#c9a84c]/35 bg-[#25160f] p-5 text-center shadow-xl shadow-[#c9a84c]/10 sm:p-6">
            <h2 className="font-serif text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
              Save your assessment
            </h2>
            <p className="mx-auto mt-2 max-w-xl font-serif text-base leading-7 text-[#f5f0e8]/70 sm:text-lg">
              Create an account or log in to save these answers to your profile and continue into the dashboard.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="rounded-full bg-gradient-to-r from-[#f0d080] via-[#c9a84c] to-[#a07828] px-6 py-3 font-serif font-bold text-[#2a1a0e] shadow-lg shadow-[#c9a84c]/20 transition hover:scale-[1.02]"
              >
                Sign Up & Save
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="rounded-full border border-[#c9a84c]/40 px-6 py-3 font-serif font-semibold text-[#f5f0e8] transition hover:border-[#c9a84c]"
              >
                Login & Save
              </button>
            </div>
          </div>
        )}

        {saveError && (
          <div
            style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '12px',
              padding: '12px 20px',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              color: '#ff9999',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {saveError}
          </div>
        )}

        <div
          style={{
            background: 'rgba(245,240,232,0.95)',
            borderRadius: '20px',
            padding: '36px',
            marginBottom: '20px',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '0.75rem',
                  letterSpacing: '2px',
                  color: '#8b6914',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                CURRENT POSITION
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#2a1a0e',
                  marginBottom: '2px',
                }}
              >
                Level {result.valamLevel}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.3rem',
                  color: '#c9a84c',
                  fontWeight: 600,
                }}
              >
                {result.valamLevelName}
              </div>
            </div>
            <button
              onClick={() => {
                const text = `I discovered my VALAM Financial Stage.\nLevel ${result.valamLevel}: ${result.valamLevelName}`
                if (navigator.share) {
                  navigator.share({ title: 'My VALAM Stage', text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(135deg,#f0d080,#c9a84c)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#2a1a0e',
              }}
            >
              Share
            </button>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: n <= result.valamLevel ? '#c9a84c' : 'rgba(201,168,76,0.2)',
                      borderRadius: n === 1 ? '4px 0 0 4px' : n === 8 ? '0 4px 4px 0' : '0',
                      borderRight: n < 8 ? '2px solid rgba(245,240,232,0.95)' : '',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.65rem',
                      color: n === result.valamLevel ? '#c9a84c' : '#8b6914',
                      fontWeight: n === result.valamLevel ? 700 : 400,
                      marginTop: '4px',
                    }}
                  >
                    {n}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #2a1a0e 0%, #3d2510 100%)',
            borderRadius: '20px',
            padding: '36px',
            marginBottom: '24px',
            border: '1px solid rgba(201,168,76,0.4)',
          }}
        >
          <div style={{ marginBottom: '8px', color: '#c9a84c', fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 700 }}>
            FUTURE POTENTIAL
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#f5f0e8' }}>
            Level {Math.min(8, result.valamLevel + 2)}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', marginTop: '8px' }}>
            With consistent effort, you can keep progressing from here.
          </p>
        </div>

        {saving && (
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Cormorant Garamond', serif",
              color: 'rgba(245,240,232,0.4)',
              fontSize: '1rem',
              marginBottom: '16px',
            }}
          >
            Saving your profile...
          </div>
        )}

        <button
          onClick={() => router.push(requiresSignup ? '/signup' : '/dashboard')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#2a1a0e',
          }}
        >
          {requiresSignup ? 'Sign Up to Save ->' : 'Go to Dashboard ->'}
        </button>
      </div>
    </main>
  )
}
