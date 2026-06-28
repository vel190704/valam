'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VALAMResult } from '@/lib/valam'

// ── Read pending assessment from sessionStorage ───────────────────────────────
// If the user completed onboarding as a guest, bundle their full assessment  
// into the signup call so it's saved immediately on account creation.
interface AssessmentPayload {
  name: string
  age: number
  income: string
  savingsRate: string
  investments: string
  experience: string
  goal: string
  valamScore: number
  valamLevel: number
  valamLevelName: string
  //potentialScore: number
  potentialLevel: number
  potentialLevelName: string
  //wealthVelocity: number
  breakdown: {
    savingsScore: number
    investmentsScore: number
    incomeScore: number
    experienceScore: number
   // ageScore: number
  }
}
const {data:{session}} = await supabase.auth.getSession();
function getPendingAssessment(
  nameOverride: string,
  ageOverride: number
): AssessmentPayload | undefined {
  try {
    const rawResult = sessionStorage.getItem('valam_result')
    if (!rawResult) return undefined

    const parsed = JSON.parse(rawResult) as VALAMResult

    const income      = sessionStorage.getItem('valam_income') ?? ''
    const savingsRate = sessionStorage.getItem('valam_savings') ?? ''
    const investments = sessionStorage.getItem('valam_investments') ?? ''
    const experience  = sessionStorage.getItem('valam_experience') ?? 'beginner'
    const goal        = sessionStorage.getItem('valam_goal') ?? 'wealth'

    if (!income || !savingsRate || !investments) return undefined

    return {
      name:               nameOverride,
      age:                ageOverride,
      income,
      savingsRate,
      investments,
      experience,
      goal,
      valamScore:         parsed.positionScore,
      valamLevel:         parsed.positionLevel,
      valamLevelName:     parsed.positionLevelName,
      //potentialScore:     parsed.potentialScore,
      potentialLevel:     parsed.potentialLevel,
      potentialLevelName: parsed.potentialLevelName,
      //wealthVelocity:     parsed.breakdown?.wealthVelocity ?? 0,
      breakdown: {
        savingsScore:     parsed.breakdown?.savingsScore        ?? 0,
        investmentsScore: parsed.breakdown?.investmentVelocityScore ?? 0,
        incomeScore:      parsed.breakdown?.incomeScore         ?? 0,
        experienceScore:  parsed.breakdown?.experienceScore     ?? 0,
        //ageScore:         parsed.breakdown?.ageScore            ?? 0,
      },
    }
  } catch {
    return undefined
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter()
  
  const [name,                 setName]                 = useState('')
  const [age,                  setAge]                  = useState('')
  const [email,                setEmail]                = useState('')
  const [password,             setPassword]             = useState('')
  const [loading,              setLoading]              = useState(false)
  const [error,                setError]                = useState('')
  const [hasPendingAssessment, setHasPendingAssessment] = useState(false)

  // Pre-fill from sessionStorage — runs only on the client (no SSR crash)
  useEffect(() => {
    
    if(session?.user){
      router.push('/')
    }
    setName(sessionStorage.getItem('valam_name') ?? '')
    setAge(sessionStorage.getItem('valam_age') ?? '')
    setHasPendingAssessment(!!sessionStorage.getItem('valam_result'))
  }, [])

  // ── Email/password signup ──────────────────────────────────────────────────
  async function handleSignup() {
    setError('')
    if (!name.trim())     { setError('Please enter your name');     return }
    if (!age)             { setError('Please enter your age');      return }
    if (!email.trim())    { setError('Please enter your email');    return }
    if (!password)        { setError('Please enter a password');    return }
    if (password.length < 6) {
      setError('Password must be at least 6 characters'); return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), age: Number(age) },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Bundle pending assessment into the account immediately
    const assessment = getPendingAssessment(name.trim(), Number(age))
    if (assessment && data.session?.access_token) {
      try {
        const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'
        await fetch(`${BASE}/profile/save-assessment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify(assessment),
        })
      } catch {
        console.warn('Assessment save failed after signup')
      }
    }

    alert(
      'Your account was created successfully. ' +
      'Please verify your email from your inbox, then log in.'
    )
    router.push('/login')
    setLoading(false)
  }

  // ── Google OAuth signup ─────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (oauthError) setError(oauthError.message)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = {
  width: '100%',

  background: 'var(--bg)',

  color: 'var(--text)',

  border: '1px solid var(--border-md)',

  borderRadius: 12,

  padding: '12px 14px',

  fontSize: 14,

  fontFamily: 'Inter, sans-serif',

  outline: 'none',

  marginBottom: 16,

  transition: 'all .3s ease',

  boxSizing: 'border-box' as const,
}

 const labelStyle = {
  display: 'block',

  marginBottom: 8,

  marginTop: 16,

  fontSize: 13,

  fontWeight: 600,

  color: 'var(--text-sm)',

  fontFamily: 'Inter, sans-serif',
}

  // ── Render ──────────────────────────────────────────────────────────────────
 return (
  <main
    className="
      flex
      min-h-screen
      items-center
      justify-center
      px-4
      py-28
      sm:px-6
      lg:px-8
    "
    style={{
      background: 'var(--bg)',
      transition: 'all .3s ease',
    }}
  >

    <div
      className="
        w-full
        max-w-[480px]
        px-5
        py-8
        sm:px-10
        sm:py-12
      "
      style={{

        background:

          'var(--surface)',

        border:

          '1px solid var(--border)',

        borderRadius:

          20,

        boxShadow:

          '0 8px 40px rgba(0,0,0,.12)',

        transition:

          'all .3s ease',

      }}
    >

      {/* Header */}

      <div
        style={{

          textAlign:

            'center',

          marginBottom:

            28,

        }}
      >

        <div
          style={{

            fontFamily:

              'Playfair Display, serif',

            fontSize:

              '1.75rem',

            fontWeight:

              700,

            color:

              'var(--gold)',

            letterSpacing:

              '.1em',

            marginBottom:

              6,

          }}
        >

          VALAM

        </div>

        <div
          style={{

            fontSize:

              13,

            color:

              'var(--muted)',

            fontFamily:

              'Inter, sans-serif',

          }}
        >

          Create your account

        </div>

        {

          hasPendingAssessment && (

            <div

              style={{

                marginTop:

                  12,

                padding:

                  '8px 12px',

                background:

                  'rgba(201,168,76,.08)',

                border:

                  '1px solid var(--border)',

                borderRadius:

                  8,

                fontSize:

                  12,

                color:

                  'var(--gold)',

                fontFamily:

                  'Inter,sans-serif',

              }}

            >

              ✓ Your assessment will be saved automatically on signup

            </div>

          )

        }

      </div>

      {/* Error */}

      {

        error && (

          <div

            style={{

              background:

                'rgba(192,57,43,.12)',

              border:

                '1px solid rgba(192,57,43,.3)',

              borderRadius:

                10,

              padding:

                '10px 14px',

              fontSize:

                13,

              color:

                'var(--red)',

              marginBottom:

                16,

              fontFamily:

                'Inter,sans-serif',

            }}

          >

            {error}

          </div>

        )

      }

      {/* Name + Age */}

      <div
        style={{

          display:

            'grid',

          gridTemplateColumns:

            '1fr 1fr',

          gap:

            12,

          marginBottom:

            0,

        }}
      >

        <div>

          <label style={labelStyle}>

            Full Name

          </label>

          <input

            type="text"

            value={name}

            onChange={

              e =>

              setName(

                e.target.value

              )

            }

            placeholder="Your name"

            style={inputStyle}

          />

        </div>

        <div>

          <label style={labelStyle}>

            Age

          </label>

          <input

            type="number"

            value={age}

            onChange={

              e =>

              setAge(

                e.target.value

              )

            }

            placeholder="e.g. 25"

            min={18}

            max={80}

            style={inputStyle}

          />

        </div>

      </div>

      <label style={labelStyle}>

        Email

      </label>

      <input

        type="email"

        value={email}

        onChange={

          e =>

          setEmail(

            e.target.value

          )

        }

        placeholder="you@example.com"

        style={inputStyle}

      />

      <label style={labelStyle}>

        Password

      </label>

      <input

        type="password"

        value={password}

        onChange={

          e =>

          setPassword(

            e.target.value

          )

        }

        placeholder="Min 6 characters"

        style={{

          ...inputStyle,

          marginBottom:

            20,

        }}

      />

      {/* Signup */}

      <button

        onClick={handleSignup}

        disabled={loading}

        className="
          disabled:opacity-50
          disabled:cursor-not-allowed
        "

        style={{

          width:

            '100%',

          background:

            `linear-gradient(
              135deg,

              var(--gold-lt),

              var(--gold),

              var(--bronze)
            )`,

          color:

            '#fff',

          border:

            'none',

          borderRadius:

            12,

          padding:

            '13px',

          fontSize:

            15,

          fontWeight:

            700,

          fontFamily:

            'Inter,sans-serif',

          cursor:

            loading

            ?

            'not-allowed'

            :

            'pointer',

          marginBottom:

            14,

        }}

      >

        {

          loading

          ?

          'Creating account…'

          :

          'Create Account →'

        }

      </button>

      {/* Divider */}

      <div

        style={{

          display:

            'flex',

          alignItems:

            'center',

          gap:

            10,

          marginBottom:

            14,

        }}

      >

        <div

          style={{

            flex:

              1,

            height:

              1,

            background:

              'var(--border)',

          }}

        />

        <span

          style={{

            fontSize:

              11,

            color:

              'var(--muted)',

            fontFamily:

              'Inter,sans-serif',

          }}

        >

          or

        </span>

        <div

          style={{

            flex:

              1,

            height:

              1,

            background:

              'var(--border)',

          }}

        />

      </div>

      {/* Google */}

      <button

        onClick={handleGoogle}

        disabled={loading}

        className="
          disabled:opacity-50
          disabled:cursor-not-allowed
        "

        style={{

          width:

            '100%',

          background:

            'var(--bg)',

          border:

            '1px solid var(--border)',

          borderRadius:

            12,

          padding:

            '12px',

          fontSize:

            14,

          fontWeight:

            600,

          color:

            'var(--text)',

          fontFamily:

            'Inter,sans-serif',

          cursor:

            loading

            ?

            'not-allowed'

            :

            'pointer',

          display:

            'flex',

          alignItems:

            'center',

          justifyContent:

            'center',

          gap:

            10,

          marginBottom:

            20,

          transition:

            'all .3s ease',

        }}

      >

       <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>

        Continue with Google

      </button>

      {/* Login */}

      <div

        style={{

          textAlign:

            'center',

          fontSize:

            13,

          color:

            'var(--muted)',

          fontFamily:

            'Inter,sans-serif',

        }}

      >

        Already have an account?{' '}

        <a

          href="/login"

          style={{

            color:

              'var(--gold)',

            textDecoration:

              'none',

            fontWeight:

              600,

          }}

        >

          Log in

        </a>

      </div>

    </div>

  </main>
)
}