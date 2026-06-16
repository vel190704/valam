'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const experiences = [
  { value:'beginner',     label:'Beginner',     desc:'No investments yet',
    icon:'🌱', detail:'Just starting out, keeping money in savings' },
  { value:'learning',     label:'Learning',     desc:'FDs, Mutual Funds',
    icon:'📚', detail:'Have some FDs or mutual fund investments' },
  { value:'intermediate', label:'Intermediate', desc:'Stocks, ETFs, Bonds',
    icon:'📈', detail:'Actively investing in stocks and ETFs' },
  { value:'advanced',     label:'Advanced',     desc:'Crypto, Options, Global Markets',
    icon:'🚀', detail:'Experienced with complex instruments' },
]

export default function Step2() {
  const router = useRouter()
  const [selected, setSelected] = useState('')

  function handleContinue() {
    if (!selected) return
    sessionStorage.setItem('valam_knowledge', selected)
    router.push('/onboarding/step3')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a0f0a] px-4 py-28 sm:px-6 lg:px-8">
      <div style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
        border:'1px solid rgba(201,168,76,0.3)' }}
        className="w-full max-w-[520px] px-5 py-8 sm:px-10 sm:py-12">

        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'48px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ width: i===2?'24px':'10px', height:'10px',
              borderRadius:'5px',
              background: i<=2?'#c9a84c':'rgba(201,168,76,0.3)' }}/>
          ))}
        </div>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem',
          color:'#2a1a0e', marginBottom:'8px', textAlign:'center' }}>
          Your investing experience
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", color:'#5a3e28',
          textAlign:'center', marginBottom:'32px' }}>
          Be honest — there are no wrong answers
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'32px' }}>
          {experiences.map(exp => (
            <div key={exp.value}
              onClick={() => setSelected(exp.value)}
              style={{ padding:'16px 20px', borderRadius:'12px', cursor:'pointer',
                border: selected===exp.value
                  ? '2px solid #c9a84c' : '1.5px solid rgba(201,168,76,0.25)',
                background: selected===exp.value
                  ? 'rgba(201,168,76,0.1)' : '#fff',
                display:'flex', alignItems:'center', gap:'16px',
                transition:'all 0.2s' }}>
              <span style={{ fontSize:'1.8rem' }}>{exp.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Inter, sans-serif', fontWeight:700,
                  color:'#2a1a0e', marginBottom:'2px' }}><strong>{exp.label}</strong></div>
                <div style={{ fontFamily:'Inter, sans-serif', fontSize:'0.85rem',
                  color:'#5a3e28' }}>{exp.detail}</div>
              </div>
              {selected===exp.value && (
                <span style={{ color:'#c9a84c', fontSize:'1.2rem' }}>✓</span>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleContinue} disabled={!selected}
          style={{ width:'100%', padding:'16px',
            background: selected
              ? 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)'
              : 'rgba(201,168,76,0.3)',
            border:'none', borderRadius:'50px',
            cursor: selected?'pointer':'not-allowed',
            fontFamily:'Inter, sans-serif', fontWeight:700,
            fontSize:'1rem', color:'#2a1a0e', marginBottom:'16px' }}>
          Continue →
        </button>

        <div style={{ textAlign:'center' }}>
          <button onClick={() => router.push('/onboarding/step1')}
            style={{ background:'none', border:'none', cursor:'pointer',
              fontFamily:'Inter, sans-serif', color:'#8b6914', fontSize:'0.9rem' }}>
            ← Back
          </button>
        </div>
      </div>
    </main>
  )
}
