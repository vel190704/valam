'use client'
import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }
    try {
      setLoading(true)
      const BASE =
        process.env
          .NEXT_PUBLIC_BACKEND_URL
        ?? 'http://localhost:5000'
      const res = await fetch(
        `${BASE}/contact`,
        {
          method:'POST',
          headers:{
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify({
              name,
              email,
              message
            })
        }
      )
      if(!res.ok){
        throw new Error()
      }
      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    }
    catch{
      setError(
        'Failed to send message.'
      )
    }
    finally{
      setLoading(false)
    }
  }
 return (
  <main
    style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      transition: 'all .3s ease',
      padding: '8rem 1rem 4rem',
    }}
    className="sm:px-6 lg:px-8 flex justify-center"
  >
    <div className="w-full max-w-2xl">

      {/* Heading */}

      <p
        style={{
          color: 'var(--gold)',
          textTransform: 'uppercase',
          letterSpacing: '.25em',
          fontWeight: 600,
          textAlign: 'center',
          fontSize: '.875rem',
        }}
      >
        CONTACT US   
      </p>

      <h1
        className="font-serif sm:text-5xl"
        style={{
          color: 'var(--text)',
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: 'clamp(2.25rem,5vw,4rem)',
          lineHeight: 1.1,
          fontWeight: 700,
        }}
      >
        Have a question or idea for VALAM?
      </h1>

      <p
        style={{
          color: 'var(--muted)',
          textAlign: 'center',
          maxWidth: '42rem',
          margin: '1.5rem auto 0',
          lineHeight: 1.8,
          fontSize: '1.125rem',
        }}
      >
        We&apos;d love to hear from you.
        Reach out with feedback,
        partnerships or support requests.
      </p>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: '3rem',

          background: 'var(--surface)',

          border:
            '1px solid var(--border)',

          borderRadius: '1.5rem',

          padding: '2rem',

          boxShadow:
            '0 8px 30px rgba(0,0,0,.06)',

          transition:
            'all .3s ease',
        }}
        className="space-y-6"
      >

        {/* Name */}

        <input

          type="text"

          placeholder="Name"

          value={name}

          onChange={e =>
            setName(
              e.target.value
            )
          }

          style={{

            width:'100%',

            background:

              'var(--bg)',

            color:

              'var(--text)',

            border:

              '1px solid var(--border)',

            borderRadius:

              '1rem',

            padding:

              '1rem 1.25rem',

            transition:

              'all .3s ease',

          }}

          className="
            outline-none
          "

        />

        {/* Email */}

        <input

          type="email"

          placeholder="Email"

          value={email}

          onChange={e =>
            setEmail(
              e.target.value
            )
          }

          style={{

            width:'100%',

            background:

              'var(--bg)',

            color:

              'var(--text)',

            border:

              '1px solid var(--border)',

            borderRadius:

              '1rem',

            padding:

              '1rem 1.25rem',

            transition:

              'all .3s ease',

          }}

          className="
            outline-none
          "

        />

        {/* Message */}

        <textarea

          rows={6}

          placeholder="Message"

          value={message}

          onChange={e =>
            setMessage(
              e.target.value
            )
          }

          style={{

            width:'100%',

            background:

              'var(--bg)',

            color:

              'var(--text)',

            border:

              '1px solid var(--border)',

            borderRadius:

              '1rem',

            padding:

              '1rem 1.25rem',

            resize:

              'none',

            transition:

              'all .3s ease',

          }}

          className="
            outline-none
          "

        />

        {/* Error */}

        {

          error &&

          (

            <p

              style={{

                color:

                  'var(--red)',

                fontSize:

                  '.9rem'

              }}

            >

              {error}

            </p>

          )

        }

        {/* Success */}

        {

          success &&

          (

            <p

              style={{

                color:

                  'var(--green)',

                fontSize:

                  '.9rem'

              }}

            >

              Message sent successfully!

            </p>

          )

        }

        {/* Button */}

        <button

          type="submit"

          disabled={loading}

          style={{

            width:

              '100%',

            padding:

              '1rem',

            borderRadius:

              '999px',

            border:

              'none',

            cursor:

              'pointer',

            fontWeight:

              700,

            fontSize:

              '1rem',

            color:

              '#2a1a0e',

            background:

              `linear-gradient(
                135deg,

                var(--gold-lt),

                var(--gold),

                var(--bronze)
              )`,

            boxShadow:

              '0 4px 24px rgba(201,168,76,.25)',

            transition:

              'all .25s ease',

          }}

          className="
            hover:scale-[1.02]
            active:scale-[0.98]
            disabled:opacity-50
          "

        >

          {

            loading

            ?

            'Sending...'

            :

            'Contact Us'

          }

        </button>

      </form>

    </div>

  </main>
)
}