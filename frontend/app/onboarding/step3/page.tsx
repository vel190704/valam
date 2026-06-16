'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const incomeOptions = [
  { value:'<3L',     label:'Below ₹3L / year' },
  { value:'3L-8L',   label:'₹3L – ₹8L / year' },
  { value:'8L-15L',  label:'₹8L – ₹15L / year' },
  { value:'15L-30L', label:'₹15L – ₹30L / year' },
  { value:'30L+',    label:'₹30L+ / year' },
]

const savingsOptions = [
  { value:'<5',    label:'Less than 5%' },
  { value:'5-15',  label:'5% – 15%' },
  { value:'15-25', label:'15% – 25%' },
  { value:'25-40', label:'25% – 40%' },
  { value:'40+',   label:'40% +' },
]

const investmentOptions = [
  { value:'<10k',   label:'Less than ₹10,000' },
  { value:'10k-1L', label:'₹10,000 – ₹1L' },
  { value:'1L-5L',  label:'₹1L – ₹5L' },
  { value:'5L-25L', label:'₹5L – ₹25L' },
  { value:'25L+',   label:'₹25L+' },
]

const selectStyle = {
  width:'100%', padding:'14px 16px', borderRadius:'10px',
  border:'1.5px solid rgba(201,168,76,0.4)', background:'#fff',
  fontFamily:'Inter, sans-serif', fontSize:'1rem',
  color:'#2a1a0e', outline:'none', boxSizing:'border-box' as const,
  cursor:'pointer',
}

export default function Step3() {
  const router = useRouter()
  const [income, setIncome]           = useState('')
  const [savings, setSavings]         = useState('')
  const [investments, setInvestments] = useState('')

  function handleContinue() {
    if (!income || !savings || !investments) return
    sessionStorage.setItem('valam_income',      income)
    sessionStorage.setItem('valam_savings',     savings)
    sessionStorage.setItem('valam_investments', investments)
    router.push('/onboarding/step4')
  }

  const ready = income && savings && investments

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a0f0a] px-4 py-28 sm:px-6 lg:px-8">
      <div style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
        border:'1px solid rgba(201,168,76,0.3)' }}
        className="w-full max-w-[480px] px-5 py-8 sm:px-10 sm:py-12">

        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'48px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ width: i===3?'24px':'10px', height:'10px',
              borderRadius:'5px',
              background: i<=3?'#c9a84c':'rgba(201,168,76,0.3)' }}/>
          ))}
        </div>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem',
          color:'#2a1a0e', marginBottom:'8px', textAlign:'center' }}>
          We&apos;ll tailor your financial roadmap based on your investing knowledge
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", color:'#5a3e28',
          textAlign:'center', marginBottom:'40px' }}>
          Your data is secure with us and used only to personalize your financial journey.
        </p>

        {[
          { label:'💰 Annual Income', value:income, setter:setIncome, options:incomeOptions },
          { label:'🎯 Monthly Savings Rate', value:savings, setter:setSavings, options:savingsOptions },
          { label:'💎 Current Investments', value:investments, setter:setInvestments, options:investmentOptions },
        ].map(field => (
          <div key={field.label} style={{ marginBottom:'24px' }}>
            <label style={{ fontFamily:'Inter, sans-serif', fontWeight:600,
              color:'#2a1a0e', fontSize:'0.9rem', display:'block',
              marginBottom:'8px' }}>{field.label}</label>
            <select value={field.value} onChange={e => field.setter(e.target.value)}
              style={selectStyle}>
              <option value="">Select...</option>
              {field.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        <button onClick={handleContinue} disabled={!ready}
          style={{ width:'100%', padding:'16px',
            background: ready
              ? 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)'
              : 'rgba(201,168,76,0.3)',
            border:'none', borderRadius:'50px',
            cursor: ready?'pointer':'not-allowed',
            fontFamily:'Inter, sans-serif', fontWeight:700,
            fontSize:'1rem', color:'#2a1a0e', marginBottom:'16px' }}>
          Calculate my Stage
        </button>

        <div style={{ textAlign:'center' }}>
          <button onClick={() => router.push('/onboarding/step2')}
            style={{ background:'none', border:'none', cursor:'pointer',
              fontFamily:'Inter, sans-serif', color:'#8b6914', fontSize:'0.9rem' }}>
            ← Back
          </button>
        </div>
      </div>
    </main>
  )
}
