'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [joinedMonth, setJoinedMonth] = useState('')
  const [onboarded, setOnboarded] = useState(false)
  const [user, setUser] = useState<{
    email: string
    name: string
    age: number | null
  } | null>(null)
  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      if (profile) {

  setOnboarded(true)

  const joined = new Date(profile.created_at)
    .toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })

  setJoinedMonth(joined)

  setUser({
    email: session.user.email || '',
    name: profile.name || session.user.user_metadata.name || '',
    age: profile.age ?? null,
  })

} else {

  setOnboarded(false)

  setUser({
    email: session.user.email || '',
    name: session.user.user_metadata.name || '',
    age: null,
  })
}
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a0f0a] flex items-center justify-center">
        <h1 className="text-[#f5f0e8] text-2xl">
          Loading...
        </h1>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-[#1a0f0a] px-6 py-10 flex flex-col items-center">

      {/* Logo */}
      <div className=" font-serif text-3xl sm:text-4xl font-bold tracking-[4px] text-[#c9a84c] mb-10">
      {/*  VALAM ★ */}
      </div>

      {/* Card */}
      <div className="
        w-full
        max-w-lg
        rounded-3xl
        border border-[#c9a84c]/30
        bg-[#25160f]
        shadow-2xl
        shadow-[#c9a84c]/10
        p-8
      ">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="
            w-28
            h-28
            rounded-full
            border-4
            border-[#c9a84c]
            bg-[#1a0f0a]
            flex
            items-center
            justify-center
            text-4xl
            font-bold
            text-[#f5f0e8]
          ">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-5 text-3xl font-serif text-[#f5f0e8]">
            Hey, {user?.name}
          </h1>
          {onboarded ? (

  <p className="text-[#f5f0e8]/60 mt-1">
    Growing with VALAM since {joinedMonth}
  </p>

) : (

  <div className="mt-3 text-center">

    <p className="text-[#f5f0e8]/60">
      Complete your registration to save all your data.
    </p>

    <button
      onClick={() =>
        router.push('/onboarding/step1')
      }
      className="
        mt-4
        rounded-full
        bg-gradient-to-r
        from-[#f0d080]
        via-[#c9a84c]
        to-[#a07828]
        px-5
        py-2
        text-sm
        font-semibold
        text-[#2a1a0e]
        transition
        hover:scale-105
      "
    >
      Complete Registration →
    </button>
  </div>
)}
        </div>

        {/* User Details */}
        <div className="mt-10 space-y-5">
          <div className="
            rounded-2xl
            border border-[#c9a84c]/20
            px-5 py-4
          ">
            <p className="text-[#f5f0e8]/50 text-sm">
              Email
            </p>
            <p className="text-[#f5f0e8] text-lg mt-1">
              {user?.email}
            </p>
          </div>
          <div className="
            rounded-2xl
            border border-[#c9a84c]/20
            px-5 py-4
          ">
            <p className="text-[#f5f0e8]/50 text-sm">
              Name
            </p>
            <p className="text-[#f5f0e8] text-lg mt-1">
              {user?.name}
            </p>
          </div>
          {onboarded && (
  <div className="
    rounded-2xl
    border border-[#c9a84c]/20
    px-5 py-4
  ">
    <p className="text-[#f5f0e8]/50 text-sm">
      Age
    </p>
    <p className="text-[#f5f0e8] text-lg mt-1">
      {user?.age}
    </p>
  </div>
)}
        </div>
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
          mt-10
          w-full
          py-3
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
          "
        >
          Logout
        </button>
      </div>
    </main>
  )
}