'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    async function prefill() {
      try {
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

        const BASE = process.env.NEXT_PUBLIC_BACKEND_URL
          ?? 'http://localhost:5000'
        const res = await fetch(`${BASE}/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        })
        if (!res.ok) return
        const json = await res.json() as { profile?: { name?: string; age?: number } }
        const p = json.profile
        if (p?.name) setName(p.name)
        if (p?.age)  setAge(String(p.age))
      } catch {
        // silently ignore — pre-fill is best effort
      }
    }
    void prefill()
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
    <main className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 lg:px-8"
      style={{ background:'#1a0f0a' }}>
      <div className="w-full max-w-[480px] px-5 py-8 sm:px-10 sm:py-12"
        style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
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

        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <p style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.1rem',
            color:'#8b6914', fontStyle:'italic', lineHeight:1.5, margin:0 }}>
            Time is your greatest financial asset.
          </p>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'0.95rem',
            color:'#5a3e28', marginTop:'6px', lineHeight:1.5, margin:'6px 0 0 0' }}>
            Your age helps us personalize your financial journey and future potential
          </p>
        </div>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem',
          color:'#2a1a0e', marginBottom:'8px', textAlign:'center' }}>
          Tell us about yourself
        </h2>

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
