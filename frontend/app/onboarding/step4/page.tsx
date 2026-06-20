'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

const goals = [
  { id:1, value:'emergency',  icon:'🌱', title:'Build My Foundation',
    desc:'Emergency fund, insurance, basics' },
  { id:2, value:'wealth',     icon:'📈', title:'Grow My Wealth',
    desc:'Increase portfolio value' },
  { id:3, value:'wealth',     icon:'🎯', title:'Reach First ₹1 Crore',
    desc:'Milestone wealth building' },
  { id:4, value:'retirement', icon:'🔓', title:'Achieve Financial Freedom',
    desc:'Passive income > expenses' },
  { id:5, value:'retirement', icon:'🏖️', title:'Retire Comfortably',
    desc:'Peaceful retirement planning' },
  { id:6, value:'wealth',     icon:'📊', title:'Manage Investments Better',
    desc:'Optimise existing portfolio' },
]

export default function Step4() {
  const router = useRouter()
  const [selectedGoal, setSelectedGoal] = useState('')

    useEffect(() =>{
      async function precheck(){
        const{data:{session}} = await supabase.auth.getSession()
        if(!session?.user){
          return
        }
        const{data:profile} = await supabase.from('profiles').select('onboarded').eq('user_id',session.user.id).maybeSingle()
        if(profile?.onboarded){
          router.replace('/dashboard')
          return
        }
      }
      precheck()
    },[])

  function handleCalculate() {
    if (!selectedGoal) return
    sessionStorage.setItem('valam_goal', selectedGoal)
    router.push('/result')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 lg:px-8"
      style={{ background:'#1a0f0a' }}>
      <div className="w-full max-w-[520px] px-5 py-8 sm:px-10 sm:py-12"
        style={{ background:'rgba(245,240,232,0.95)', borderRadius:'20px',
          border:'1px solid rgba(201,168,76,0.3)' }}>

        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'48px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ width: i===4?'24px':'10px', height:'10px',
              borderRadius:'5px', background:'#c9a84c' }}/>
          ))}
        </div>

        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.8rem',
          color:'#2a1a0e', marginBottom:'8px', textAlign:'center' }}>
          What is your primary goal?
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", color:'#5a3e28',
          textAlign:'center', marginBottom:'32px' }}>
          We will personalise your roadmap around this
        </p>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map(goal => (
            <div key={goal.id}
              onClick={() => setSelectedGoal(goal.value)}
              style={{ padding:'20px 16px', borderRadius:'12px', cursor:'pointer',
                border: selectedGoal===goal.value
                  ? '2px solid #c9a84c' : '1.5px solid rgba(201,168,76,0.25)',
                background: selectedGoal===goal.value
                  ? 'rgba(201,168,76,0.1)' : '#fff',
                textAlign:'center', transition:'all 0.2s' }}>
              <div style={{ fontSize:'2rem', marginBottom:'8px' }}>{goal.icon}</div>
              <div style={{ fontFamily:'Inter, sans-serif', fontWeight:600,
                color:'#2a1a0e', fontSize:'0.9rem', marginBottom:'4px' }}>
                {goal.title}
              </div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:'0.8rem',
                color:'#5a3e28' }}>{goal.desc}</div>
            </div>
          ))}
        </div>

        <button onClick={handleCalculate} disabled={!selectedGoal}
          style={{ width:'100%', padding:'16px',
            background: selectedGoal
              ? 'linear-gradient(135deg,#f0d080,#c9a84c,#a07828)'
              : 'rgba(201,168,76,0.3)',
            border:'none', borderRadius:'50px',
            cursor: selectedGoal?'pointer':'not-allowed',
            fontFamily:'Inter, sans-serif', fontWeight:700,
            fontSize:'1rem', color:'#2a1a0e', marginBottom:'16px' }}>
          Calculate My Stage →
        </button>

        <div style={{ textAlign:'center' }}>
          <button onClick={() => router.push('/onboarding/step3')}
            style={{ background:'none', border:'none', cursor:'pointer',
              fontFamily:'Inter, sans-serif', color:'#8b6914', fontSize:'0.9rem' }}>
            ← Back
          </button>
        </div>
      </div>
    </main>
  )
}
