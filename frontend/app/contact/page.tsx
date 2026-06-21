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
    <main className="
      min-h-screen
      bg-[#1a0f0a]
      px-6
      py-20
      flex
      justify-center
    ">
      <div className="
        w-full
        max-w-2xl
      ">
        <p className="
          text-[#c9a84c]
          uppercase
          tracking-[3px]
          text-sm
          text-center
        ">
           contact us
        </p>
        <h1 className="
          mt-4
          text-4xl
          font-serif
          text-[#f5f0e8]
          text-center
        ">
          Have a question or idea
          for VALAM?
        </h1>
        <p className="
          mt-5
          text-center
          text-[#f5f0e8]/60
          max-w-xl
          mx-auto
        ">
          We&apos;d love to hear from you.
          Reach out with feedback,
          partnerships or support
          requests.
        </p>
        <form
          onSubmit={handleSubmit}
          className="
            mt-12
            rounded-3xl
            border
            border-[#c9a84c]/25
            bg-[#25160f]
            p-8
            space-y-6
          "
        >
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e =>
              setName(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border
              border-[#c9a84c]/20
              bg-[#1a0f0a]
              px-5
              py-4
              text-[#f5f0e8]
              outline-none
              focus:border-[#c9a84c]
            "
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e =>
              setEmail(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border
              border-[#c9a84c]/20
              bg-[#1a0f0a]
              px-5
              py-4
              text-[#f5f0e8]
              outline-none
              focus:border-[#c9a84c]
            "
          />
          <textarea
            rows={6}
            placeholder="Message"
            value={message}
            onChange={e =>
              setMessage(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border
              border-[#c9a84c]/20
              bg-[#1a0f0a]
              px-5
              py-4
              text-[#f5f0e8]
              outline-none
              resize-none
              focus:border-[#c9a84c]
            "
          />
          {
            error &&
            (
              <p className="
                text-red-400
                text-sm
              ">
                {error}
              </p>
            )
          }
          {
            success &&
            (
              <p className="
                text-green-400
                text-sm
              ">
                Message sent successfully!
              </p>
            )
          }
          <button
            type="submit"
            disabled={loading}
            className="
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