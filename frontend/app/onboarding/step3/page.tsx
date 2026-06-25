'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const incomeOptions = [
  { value:'<3L',     label:'Below ₹3L / year' },
  { value:'3L-5L',   label:'₹3L – ₹5L / year' },
  { value:'5L-8L',   label:'₹5L – ₹8L / year' },
  { value:'8L-12L',  label:'₹8L – ₹12L / year' },
  { value:'12L-20L', label:'₹12L – ₹20L / year' },
  { value:'20L-30L', label:'₹20L – ₹30L / year' },
  { value:'30L-50L', label:'₹30L – ₹50L / year' },
  { value:'50L+',    label:'₹50L+ / year' },
]

const savingsOptions = [
  { value:'<2',    label:'Less than 2%' },
  { value:'2-5',   label:'2% – 5%' },
  { value:'5-10',  label:'5% – 10%' },
  { value:'10-15', label:'10% – 15%' },
  { value:'15-20', label:'15% – 20%' },
  { value:'20-30', label:'20% – 30%' },
  { value:'30-40', label:'30% – 40%' },
  { value:'40+',   label:'40%+' },
]

const investmentOptions = [
  { value: '<10k',    label: 'Less than ₹10,000' },
  { value: '10k-50k', label: '₹10,000 – ₹50,000' },
  { value: '50k-1L',  label: '₹50,000 – ₹1 Lakh' },
  { value: '1L-2L',   label: '₹1 Lakh – ₹2 Lakh' },
  { value: '2L-5L',   label: '₹2 Lakh – ₹5 Lakh' },
  { value: '5L-10L',  label: '₹5 Lakh – ₹10 Lakh' },
  { value: '10L-20L', label: '₹10 Lakh – ₹20 Lakh' },
  { value: '20L-35L', label: '₹20 Lakh – ₹35 Lakh' },
  { value: '35L-50L', label: '₹35 Lakh – ₹50 Lakh' },
  { value: '50L+',    label: 'More than ₹50 Lakh' },
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

  useEffect(() => {
    async function precheck() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (profile?.onboarded) {
        router.replace('/dashboard')
        return
      }
    }
    void precheck()
  }, [router])

  function handleContinue() {
    if (!income || !savings || !investments) return
    sessionStorage.setItem('valam_income',      income)
    sessionStorage.setItem('valam_savings',     savings)
    sessionStorage.setItem('valam_investments', investments)
    router.push('/onboarding/step4')
  }

  const ready = income && savings && investments

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 lg:px-8"
      style={{ background:'#1a0f0a' }}>
      <div className="w-full max-w-[520px] px-5 py-8 sm:px-10 sm:py-12"
        style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
          border:'1px solid rgba(201,168,76,0.3)' }}>

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
          Continue→
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
