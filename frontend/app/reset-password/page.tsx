'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {

  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [success, setSuccess] = useState(false)

  const [validRecovery, setValidRecovery]
    = useState<boolean | null>(null)

  useEffect(() => {

    async function checkRecoverySession() {

      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session) {

        setValidRecovery(true)

      } else {

        setValidRecovery(false)

      }

    }

    checkRecoverySession()

  }, [])

  async function handleUpdatePassword() {

    setError('')

    if (!password) {

      setError(
        'Please enter a password.'
      )

      return

    }

    if (password.length < 8) {

      setError(
        'Password must contain at least 8 characters.'
      )

      return

    }

    if (
      password !== confirmPassword
    ) {

      setError(
        'Passwords do not match.'
      )

      return

    }

    try {

      setLoading(true)

      const { error } =
        await supabase.auth.updateUser({

          password

        })

      if (error) {

        setError(error.message)

        return

      }

      setSuccess(true)

      setTimeout(() => {

        router.replace('/login')

      }, 2500)

    } finally {

      setLoading(false)

    }

  }

  if (
    validRecovery === null
  ) {

    return (

      <main className="
        min-h-screen

        bg-[#1a0f0a]

        flex

        items-center

        justify-center
      ">

        <p className="
          text-[#f5f0e8]
          text-xl
        ">

          Loading...

        </p>

      </main>

    )

  }

  if (
    validRecovery === false
  ) {

    return (

      <main className="
        min-h-screen

        bg-[#1a0f0a]

        px-6

        flex

        items-center

        justify-center
      ">

        <div className="

          max-w-md

          w-full

          rounded-3xl

          border

          border-[#c9a84c]/30

          bg-[#25160f]

          p-8

          text-center

        ">

          <div className="

            font-serif

            text-3xl

            text-[#c9a84c]

            font-bold

            tracking-[4px]

          ">

            VALAM ★

          </div>

          <h1 className="

            mt-8

            text-2xl

            font-serif

            text-[#f5f0e8]

          ">

            Invalid Recovery Link

          </h1>

          <p className="

            mt-4

            text-[#f5f0e8]/60

            leading-relaxed

          ">

            This password reset link is invalid
            or has expired.

          </p>

          <button

            onClick={() =>
              router.push(
                '/forgot-password'
              )
            }

            className="

              mt-8

              px-6

              py-3

              rounded-full

              font-bold

              text-[#2a1a0e]

              bg-gradient-to-r

              from-[#f0d080]

              via-[#c9a84c]

              to-[#a07828]

            "

          >

            Request New Link

          </button>

        </div>

      </main>

    )

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

          text-3xl

          font-serif

          text-[#f5f0e8]

        ">

          Reset Password

        </h1>

        {

          success

          ?

          (

            <div className="

              mt-8

              text-center

            ">

              <p className="

                text-green-400

                text-lg

                font-medium

              ">

                Password updated successfully!

              </p>

              <p className="

                mt-3

                text-[#f5f0e8]/60

              ">

                Redirecting to login...

              </p>

            </div>

          )

          :

          (

            <>

              <input

                type="password"

                placeholder="New Password"

                value={password}

                onChange={e =>
                  setPassword(
                    e.target.value
                  )
                }

                className="

                  mt-8

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

                "

              />

              <input

                type="password"

                placeholder="Confirm Password"

                value={confirmPassword}

                onChange={e =>
                  setConfirmPassword(
                    e.target.value
                  )
                }

                className="

                  mt-5

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

                "

              />

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

                onClick={
                  handleUpdatePassword
                }

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

                "

              >

                {

                  loading

                  ?

                  'Updating...'

                  :

                  'Change Password'

                }

              </button>

            </>

          )

        }

      </div>

    </main>

  )

}