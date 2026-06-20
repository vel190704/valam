'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function handleReset() {

    setError('')

    if (!email.trim()) {

      setError(
        'Please enter your email.'
      )

      return
    }

    if (!emailRegex.test(email)) {

      setError(
        'Please enter a valid email.'
      )

      return
    }

    try {

      setLoading(true)

      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                `${window.location.origin}/reset-password`
            }
          )

      if (error) {

        setError(error.message)

      } else {

        setSuccess(true)

      }

    } finally {

      setLoading(false)

    }

  }

  return (

    <main className="
      min-h-screen

      bg-[#1a0f0a]

      px-6

      py-10

      flex

      items-center

      justify-center
    ">

      <div className="

        w-full

        max-w-md

        rounded-3xl

        border

        border-[#c9a84c]/30

        bg-[#25160f]

        shadow-2xl

        shadow-[#c9a84c]/10

        p-8

        sm:p-10

      ">

        {/* Logo */}

        <div className="

          text-center

          font-serif

          text-3xl

          sm:text-4xl

          font-bold

          tracking-[4px]

          text-[#c9a84c]

          mb-8

        ">

          VALAM ★

        </div>

        <h1 className="

          text-center

          text-2xl

          sm:text-3xl

          font-serif

          text-[#f5f0e8]

        ">

          Forgot Password

        </h1>

        <p className="

          text-center

          text-[#f5f0e8]/60

          text-sm

          sm:text-base

          mt-3

          leading-relaxed

        ">

          Enter the email associated with your account.

          <br />

          We&apos;ll send you a secure link to reset your password.

        </p>

        {

          success

          ?

          (

            <div className="

              mt-8

              rounded-2xl

              border

              border-green-500/20

              bg-green-500/5

              p-5

              text-center

            ">

              <p className="

                text-green-300

                font-medium

              ">

                Reset link sent successfully.

              </p>

              <p className="

                mt-2
                text-sm
                text-[#f5f0e8]/60
                leading-relaxed
              ">
                If you are a registered user, you would recieve an email with a link to create a new password
              </p>
              <button
                onClick={() =>
                  router.push('/login')
                }
                className="
                  mt-6
                  rounded-full
                  px-6
                  py-3
                  font-bold
                  text-[#2a1a0e]
                  bg-gradient-to-r
                  from-[#f0d080]
                  via-[#c9a84c]
                  to-[#a07828]
                  transition
                  hover:scale-[1.02]

                "

              >

                Back to Login

              </button>

            </div>

          )

          :

          (

            <>

              <div className="mt-8">

                <label className="

                  text-sm

                  text-[#f5f0e8]/70

                  block

                  mb-2

                ">

                  Email

                </label>

                <input

                  type="email"

                  value={email}

                  onChange={e =>
                    setEmail(
                      e.target.value
                    )
                  }

                  placeholder="you@example.com"

                  className="

                    w-full

                    rounded-2xl

                    border

                    border-[#c9a84c]/20

                    bg-[#1a0f0a]

                    px-5

                    py-4

                    text-[#f5f0e8]

                    placeholder:text-[#f5f0e8]/30

                    outline-none

                    focus:border-[#c9a84c]/60

                    transition

                  "

                />

              </div>

              {

                error && (

                  <p className="

                    mt-4

                    text-red-400

                    text-sm

                  ">

                    {error}

                  </p>

                )

              }

              <button

                onClick={handleReset}

                disabled={loading}

                className="

                  mt-8

                  w-full

                  py-4

                  rounded-full

                  font-bold

                  text-[#2a1a0e]

                  bg-gradient-to-r

                  from-[#f0d080]

                  via-[#c9a84c]

                  to-[#a07828]

                  shadow-lg

                  shadow-[#c9a84c]/20

                  transition

                  hover:scale-[1.02]

                  active:scale-[0.98]

                  disabled:opacity-50

                  disabled:hover:scale-100

                "

              >

                {

                  loading

                  ?

                  'Sending...'

                  :

                  'Send Reset Link'

                }

              </button>

              <button

                onClick={() =>
                  router.push('/login')
                }

                className="

                  mt-5

                  w-full

                  text-center

                  text-[#c9a84c]

                  text-sm

                  hover:underline

                "

              >

                Back to Login

              </button>

            </>

          )

        }

      </div>

    </main>

  )

}