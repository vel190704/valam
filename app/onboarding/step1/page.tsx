'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Step1() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [age, setAge]   = useState('')

  useEffect(() => {
    const keysToRemove = ['valam_name','valam_age','valam_income',
      'valam_savings','valam_investments','valam_knowledge','valam_goal','valam_result']
    keysToRemove.forEach(k => sessionStorage.removeItem(k))
    localStorage.removeItem('valam_profile_id')
  }, [])

  function handleContinue() {
    if (!name.trim() || !age) return
    const ageNum = parseInt(age, 10)
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) return
    sessionStorage.setItem('valam_name', name.trim())
    sessionStorage.setItem('valam_age', age)
    router.push('/onboarding/step2')
  }

  return (
    <main style={{ minHeight:'100vh', background:'#1a0f0a',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
        padding:'48px 40px', maxWidth:'480px', width:'100%',
        border:'1px solid rgba(201,168,76,0.3)' }}>

        {/* Progress dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'48px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ width: i===1?'24px':'10px', height:'10px',
              borderRadius:'5px',
              background: i===1?'#c9a84c':'rgba(201,168,76,0.3)',
              transition:'all 0.3s' }}/>
          ))}
        </div>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem',
          color:'#2a1a0e', marginBottom:'8px', textAlign:'center' }}>
          Tell us about yourself
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", color:'#5a3e28',
          textAlign:'center', marginBottom:'40px', fontSize:'1rem' }}>
          This helps us calculate your financial stage
        </p>

        <div style={{ marginBottom:'24px' }}>
          <label style={{ fontFamily:'Inter, sans-serif', fontWeight:600,
            color:'#2a1a0e', fontSize:'0.9rem', display:'block',
            marginBottom:'8px' }}>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width:'100%', padding:'14px 16px', borderRadius:'10px',
              border:'1.5px solid rgba(201,168,76,0.4)', background:'#fff',
              fontFamily:'Inter, sans-serif', fontSize:'1rem',
              color:'#2a1a0e', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ marginBottom:'40px' }}>
          <label style={{ fontFamily:'Inter, sans-serif', fontWeight:600,
            color:'#2a1a0e', fontSize:'0.9rem', display:'block',
            marginBottom:'8px' }}>Age</label>
          <input
            type="number"
            placeholder="Your age"
            value={age}
            min={18} max={100}
            onChange={e => setAge(e.target.value)}
            style={{ width:'100%', padding:'14px 16px', borderRadius:'10px',
              border:'1.5px solid rgba(201,168,76,0.4)', background:'#fff',
              fontFamily:'Inter, sans-serif', fontSize:'1rem',
              color:'#2a1a0e', outline:'none', boxSizing:'border-box' }}
          />
          <p style={{ fontFamily:'Inter, sans-serif', fontSize:'0.8rem',
            color:'#8b6914', marginTop:'6px' }}>
            ✦ This helps us calculate your wealth velocity and financial stage
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={!name.trim() || !age}
          style={{ width:'100%', padding:'16px',
            background: name.trim() && age
              ? 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)'
              : 'rgba(201,168,76,0.3)',
            border:'none', borderRadius:'50px', cursor: name.trim() && age ? 'pointer':'not-allowed',
            fontFamily:'Inter, sans-serif', fontWeight:700,
            fontSize:'1rem', color:'#2a1a0e', marginBottom:'16px' }}>
          Continue →
        </button>

        <div style={{ textAlign:'center' }}>
          <button onClick={() => router.push('/')}
            style={{ background:'none', border:'none', cursor:'pointer',
              fontFamily:'Inter, sans-serif', color:'#8b6914',
              fontSize:'0.9rem' }}>
            ← Back to home
          </button>
        </div>
      </div>
    </main>
  )
}
