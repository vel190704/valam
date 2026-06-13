'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-[#1a0f0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="font-serif text-3xl sm:text-4xl font-bold tracking-[4px] text-[#c9a84c] mb-8">
        VALAM ★
      </div>

      <h1 className="font-serif text-[#f5f0e8] font-bold text-4xl sm:text-5xl lg:text-6xl text-center leading-tight mb-4">
        Welcome back 👋
      </h1>

      <p className="font-serif text-[#f5f0e8]/70 text-sm sm:text-base lg:text-lg text-center max-w-md leading-relaxed mb-10">
        Continue your Journey towards{" "}
        <span className="whitespace-nowrap">
          Financial Freedom!
        </span>
      </p>

      {/* Form */}
      <div className="w-full max-w-md flex flex-col gap-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-transparent border border-[#c9a84c]/40 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] transition"
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-transparent border border-[#c9a84c]/40 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] transition"
        />
        <button className="self-end text-sm text-[#c9a84c] hover:underline">
          Forgot Password?
        </button>
        <button
          className="
          w-full py-3 rounded-full font-bold text-[#2a1a0e]
          bg-gradient-to-r from-[#f0d080] via-[#c9a84c] to-[#a07828]
          shadow-lg shadow-[#c9a84c]/20
          transition hover:scale-[1.02] active:scale-[0.98]
          "
        >
          Login
        </button>
        <div className="text-center text-sm text-[#f5f0e8]/60 mt-2">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push('/signup')}
            className="text-[#c9a84c] font-semibold hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}