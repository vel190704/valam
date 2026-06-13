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
    <main style={{ minHeight:'100vh', background:'#1a0f0a',
      padding:'60px 24px 60px' }}>
      <div style={{ maxWidth:'800px', margin:'0 auto' }}>

        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'12px' }}>🏆</div>
          <h1 style={{ fontFamily:"'Playfair Display', serif",
            fontSize:'2.2rem', color:'#f5f0e8', marginBottom:'8px' }}>
            Your VALAM Assessment
          </h1>
          <p style={{ fontFamily:"'Cormorant Garamond', serif",
            color:'rgba(245,240,232,0.7)', fontSize:'1.1rem' }}>
            Here is where you stand today
          </p>
        </div>

        {saveError && (
          <div style={{ background:'rgba(255,80,80,0.1)',
            border:'1px solid rgba(255,80,80,0.3)', borderRadius:'12px',
            padding:'12px 20px', marginBottom:'24px',
            fontFamily:'Inter, sans-serif', color:'#ff9999',
            fontSize:'0.9rem', textAlign:'center' }}>
            ⚠️ {saveError}
          </div>
        )}

        {/* CARD 1: Financial Stage */}
        <div style={{ background:'rgba(245,240,232,0.95)',
          borderRadius:'20px', padding:'36px', marginBottom:'20px',
          border:'1px solid rgba(201,168,76,0.3)' }}>

          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-start', marginBottom:'24px' }}>
            <div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:'0.75rem',
                letterSpacing:'2px', color:'#8b6914', fontWeight:600,
                marginBottom:'6px' }}>CURRENT POSITION</div>
              <div style={{ fontFamily:"'Playfair Display', serif",
                fontSize:'2rem', fontWeight:700, color:'#2a1a0e',
                marginBottom:'2px' }}>
                Level {result.valamLevel}
              </div>
              <div style={{ fontFamily:"'Playfair Display', serif",
                fontSize:'1.3rem', color:'#c9a84c', fontWeight:600 }}>
                {result.valamLevelName}
              </div>
            </div>
            <button
              onClick={() => {
                const text = `I just discovered my VALAM Financial Stage!\n\n🏆 Level ${result.valamLevel}: ${result.valamLevelName}\n\nDiscover yours at valamhq.com`
                if (navigator.share) {
                  navigator.share({ title: 'My VALAM Stage', text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{ padding:'8px 18px',
                background:'linear-gradient(135deg,#f0d080,#c9a84c)',
                border:'none', borderRadius:'20px', cursor:'pointer',
                fontFamily:'Inter, sans-serif', fontWeight:600,
                fontSize:'0.85rem', color:'#2a1a0e',
                display:'flex', alignItems:'center', gap:'6px' }}>
              📤 Share
            </button>
          </div>

          {/* Stage Slider */}
          <div style={{ marginBottom:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              marginBottom:'8px' }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <div key={n} style={{ display:'flex', flexDirection:'column',
                  alignItems:'center', flex:1 }}>
                  <div style={{ width:'100%', height:'8px',
                    background: n <= result.valamLevel ? '#c9a84c' : 'rgba(201,168,76,0.2)',
                    borderRadius: n===1?'4px 0 0 4px': n===8?'0 4px 4px 0':'0',
                    borderRight: n < 8 ? '2px solid rgba(245,240,232,0.95)':'' }}/>
                  <div style={{ fontFamily:'Inter, sans-serif',
                    fontSize:'0.65rem', color: n === result.valamLevel
                      ? '#c9a84c':'#8b6914',
                    fontWeight: n === result.valamLevel ? 700:400,
                    marginTop:'4px' }}>{n}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              marginTop:'4px' }}>
              {['Seed','Explorer','Builder','Accelerator',
                'Achiever','Wealth Creator','Wealth Architect','Legend'].map((name, i) => (
                <div key={name} style={{ flex:1, textAlign:'center',
                  fontFamily:'Inter, sans-serif', fontSize:'0.6rem',
                  color: i+1 === result.valamLevel ? '#2a1a0e':'rgba(90,62,40,0.5)',
                  fontWeight: i+1 === result.valamLevel ? 700:400,
                  lineHeight:1.2 }}>
                  {i+1 === result.valamLevel ? name : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: Future Potential */}
        <div style={{ background:'linear-gradient(135deg, #2a1a0e 0%, #3d2510 100%)',
          borderRadius:'20px', padding:'36px', marginBottom:'24px',
          border:'1px solid rgba(201,168,76,0.4)' }}>

          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-start', marginBottom:'24px' }}>
            <div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:'0.75rem',
                letterSpacing:'2px', color:'#c9a84c', fontWeight:600,
                marginBottom:'6px' }}>FUTURE POTENTIAL</div>
              <div style={{ fontFamily:"'Playfair Display', serif",
                fontSize:'2rem', fontWeight:700, color:'#f5f0e8',
                marginBottom:'2px' }}>
                Level {Math.min(8, result.valamLevel + 2)}
              </div>
              <div style={{ fontFamily:"'Playfair Display', serif",
                fontSize:'1.3rem', color:'#f0d080', fontWeight:600 }}>
                {['','Seed','Explorer','Builder','Accelerator',
                  'Achiever','Wealth Creator','Wealth Architect','Legend'][
                  Math.min(8, result.valamLevel + 2)]}
              </div>
              <p style={{ fontFamily:"'Cormorant Garamond', serif",
                color:'rgba(245,240,232,0.6)', fontSize:'0.95rem',
                marginTop:'8px' }}>
                With consistent effort, you can reach this level!
              </p>
            </div>
            <button
              onClick={() => {
                const potentialLevel = Math.min(8, result.valamLevel + 2)
                const potentialName = ['','Seed','Explorer','Builder','Accelerator',
                  'Achiever','Wealth Creator','Wealth Architect','Legend'][potentialLevel]
                const text = `My VALAM Future Potential!\n\n🚀 Level ${potentialLevel}: ${potentialName}\n\nWith consistent effort I can reach this! Discover yours at valamhq.com`
                if (navigator.share) {
                  navigator.share({ title: 'My VALAM Potential', text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{ padding:'8px 18px',
                background:'rgba(201,168,76,0.2)',
                border:'1px solid rgba(201,168,76,0.5)',
                borderRadius:'20px', cursor:'pointer',
                fontFamily:'Inter, sans-serif', fontWeight:600,
                fontSize:'0.85rem', color:'#f0d080',
                display:'flex', alignItems:'center', gap:'6px' }}>
              📤 Share
            </button>
          </div>

          {/* Potential Slider */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              marginBottom:'8px' }}>
              {[1,2,3,4,5,6,7,8].map(n => {
                const potentialLevel = Math.min(8, result.valamLevel + 2)
                return (
                  <div key={n} style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', flex:1 }}>
                    <div style={{ width:'100%', height:'8px',
                      background: n <= potentialLevel
                        ? n <= result.valamLevel ? '#c9a84c':'rgba(240,208,128,0.5)'
                        : 'rgba(201,168,76,0.15)',
                      borderRadius: n===1?'4px 0 0 4px': n===8?'0 4px 4px 0':'0',
                      borderRight: n < 8 ? '2px solid rgba(42,26,14,0.8)':'' }}/>
                    <div style={{ fontFamily:'Inter, sans-serif',
                      fontSize:'0.65rem',
                      color: n === potentialLevel ? '#f0d080':'rgba(201,168,76,0.5)',
                      fontWeight: n === potentialLevel ? 700:400,
                      marginTop:'4px' }}>{n}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              marginTop:'4px' }}>
              {['Seed','Explorer','Builder','Accelerator',
                'Achiever','Wealth Creator','Wealth Architect','Legend'].map((name, i) => {
                const potentialLevel = Math.min(8, result.valamLevel + 2)
                return (
                  <div key={name} style={{ flex:1, textAlign:'center',
                    fontFamily:'Inter, sans-serif', fontSize:'0.6rem',
                    color: i+1 === potentialLevel
                      ? 'rgba(245,240,232,0.9)':'rgba(245,240,232,0.2)',
                    fontWeight: i+1 === potentialLevel ? 700:400,
                    lineHeight:1.2 }}>
                    {i+1 === potentialLevel ? name : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {saving && (
          <div style={{ textAlign:'center', fontFamily:'Inter, sans-serif',
            color:'rgba(245,240,232,0.4)', fontSize:'0.85rem',
            marginBottom:'16px' }}>
            Saving your profile...
          </div>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          style={{ width:'100%', padding:'16px',
            background:'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)',
            border:'none', borderRadius:'50px', cursor:'pointer',
            fontFamily:'Inter, sans-serif', fontWeight:700,
            fontSize:'1.1rem', color:'#2a1a0e' }}>
          Go to Dashboard →
        </button>
      </div>
    </main>
  )
}
