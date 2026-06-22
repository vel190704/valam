'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CARD_BASE: React.CSSProperties = {
  padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
  border: '1.5px solid rgba(201,168,76,0.25)', background: '#fff',
  textAlign: 'left', transition: 'all 0.2s',
  fontFamily: 'Inter, sans-serif',
}

const CARD_SELECTED: React.CSSProperties = {
  ...CARD_BASE,
  border: '2px solid #c9a84c',
  background: 'rgba(201,168,76,0.1)',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontWeight: 600,
  color: '#2a1a0e', fontSize: '0.9rem', display: 'block', marginBottom: '10px',
}

interface OptionDef { value: string; label: string; desc?: string }

function OptionGroup({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: OptionDef[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {options.map(o => (
        <div key={o.value} onClick={() => onChange(o.value)}
          style={value === o.value ? CARD_SELECTED : CARD_BASE}>
          <div style={{ fontWeight: 600, color: '#2a1a0e', fontSize: '0.88rem' }}>{o.label}</div>
          {o.desc && (
            <div style={{ fontSize: '0.77rem', color: '#5a3e28', marginTop: 3 }}>{o.desc}</div>
          )}
        </div>
      ))}
    </div>
  )
}

const efOptions: OptionDef[] = [
  { value: 'none',      label: 'None',         desc: 'No emergency savings' },
  { value: '1-2months', label: '1–2 months',   desc: '1–2 months of expenses' },
  { value: '3-6months', label: '3–6 months',   desc: '3–6 months of expenses' },
  { value: '6months+',  label: '6+ months',    desc: 'Fully covered' },
]

const debtOptions: OptionDef[] = [
  { value: 'none',        label: 'None',        desc: 'No high-interest debt' },
  { value: 'some',        label: 'Some',        desc: 'Small credit card balance' },
  { value: 'significant', label: 'Significant', desc: 'Large outstanding balance' },
]

const insuranceOptions: OptionDef[] = [
  { value: 'yes', label: 'Yes', desc: 'Employer, personal, or govt' },
  { value: 'no',  label: 'No',  desc: 'No coverage currently' },
]

export default function Step3b() {
  const router = useRouter()
  const [emergencyFund,    setEmergencyFund]    = useState('')
  const [highInterestDebt, setHighInterestDebt] = useState('')
  const [healthInsurance,  setHealthInsurance]  = useState('')

  function handleContinue() {
    if (!emergencyFund || !highInterestDebt || !healthInsurance) return
    sessionStorage.setItem('valam_emergency_fund',    emergencyFund)
    sessionStorage.setItem('valam_high_interest_debt', highInterestDebt)
    sessionStorage.setItem('valam_health_insurance',   healthInsurance)
    router.push('/onboarding/step4')
  }

  const ready = emergencyFund && highInterestDebt && healthInsurance

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 lg:px-8"
      style={{ background: '#1a0f0a' }}>
      <div className="w-full max-w-[520px] px-5 py-8 sm:px-10 sm:py-12"
        style={{ background: 'rgba(245,240,232,0.95)', borderRadius: '20px',
          border: '1px solid rgba(201,168,76,0.3)' }}>

        {/* Progress dots — step 3 of 4 still active, showing extended sub-step */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '48px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: i === 3 ? '24px' : '10px', height: '10px', borderRadius: '5px',
              background: i <= 3 ? '#c9a84c' : 'rgba(201,168,76,0.3)',
            }} />
          ))}
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem',
          color: '#2a1a0e', marginBottom: '8px', textAlign: 'center' }}>
          Your financial foundations
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", color: '#5a3e28',
          textAlign: 'center', marginBottom: '36px', fontSize: '1rem' }}>
          These three questions help us identify your most important next step.
        </p>

        {/* Q1: Emergency fund */}
        <div style={{ marginBottom: '28px' }}>
          <label style={LABEL_STYLE}>💰 Do you have an emergency fund?</label>
          <OptionGroup value={emergencyFund} onChange={setEmergencyFund} options={efOptions} />
        </div>

        {/* Q2: High-interest debt */}
        <div style={{ marginBottom: '28px' }}>
          <label style={LABEL_STYLE}>
            💳 Do you carry high-interest debt?
          </label>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
            color: '#8b6914', marginBottom: '10px', marginTop: '-4px' }}>
            Credit card balances or personal loans — not home loans / vehicle EMIs
          </p>
          <OptionGroup value={highInterestDebt} onChange={setHighInterestDebt} options={debtOptions} />
        </div>

        {/* Q3: Health insurance */}
        <div style={{ marginBottom: '32px' }}>
          <label style={LABEL_STYLE}>🏥 Do you have health insurance?</label>
          <OptionGroup value={healthInsurance} onChange={setHealthInsurance} options={insuranceOptions} />
        </div>

        <button onClick={handleContinue} disabled={!ready}
          style={{ width: '100%', padding: '16px',
            background: ready
              ? 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)'
              : 'rgba(201,168,76,0.3)',
            border: 'none', borderRadius: '50px',
            cursor: ready ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: '#2a1a0e', marginBottom: '16px' }}>
          Continue →
        </button>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.push('/onboarding/step3')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', color: '#8b6914', fontSize: '0.9rem' }}>
            ← Back
          </button>
        </div>
      </div>
    </main>
  )
}
