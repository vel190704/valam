'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name,setName] = useState("");
  const [age, setAge] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle =
    "w-full px-4 py-3 rounded-xl bg-transparent border border-[#c9a84c]/40 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] transition";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) console.error('Google signup error:', error.message)
  }

  const handleSignup = async () => {

    setError("");
    if(name.trim().length < 2){
      setError("Name should contain atleast 2 characters");
      return;
    }
    const ageNum = Number(age);
    if(isNaN(ageNum) || ageNum < 18 || ageNum > 100){
      setError("Age should be between 18 and 100");
      return;
    }
    if(!emailRegex.test(email)){
      setError("Enter a valid email");
      return;
    }
    if(password.length < 8){
      setError("Password should contain atleast 8 characters");
      return;
    }
    if(password !== confirmPassword){
      setError("Passwords do not match");
      return;
    }
    try{
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options:{
          data:{
            name,
            age
          }
        }
      });
      if(error){
        setError(error.message);
        return;
      }
      console.log(data);
      alert("If this email is not yet registered with us, you will recieve an verification email.");
      router.push('/login');
    }
    catch(err){
      setError("Something went wrong");
    }
    finally{
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#1a0f0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="font-serif text-3xl sm:text-4xl font-bold tracking-[4px] text-[#c9a84c] mb-8">
        VALAM ★
      </div>
      <h1 className="font-serif text-[#f5f0e8] font-bold text-4xl sm:text-5xl lg:text-6xl text-center leading-tight mb-4">
        Create your account ✨
      </h1>
      <p className="font-serif text-[#f5f0e8]/70 text-sm sm:text-base lg:text-lg text-center max-w-md leading-relaxed mb-3">
        Save your progress and continue your journey towards{" "}
        <span className="whitespace-nowrap">
          Financial Freedom.
        </span>
      </p>
      {/* Small Note */}
      <p className="text-[#c9a84c]/80 text-xs sm:text-sm text-center mb-10">
        ✨ Your onboarding progress will be saved after signup.
      </p>
      {/* Form */}
      <div className="w-full max-w-md flex flex-col gap-5">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputStyle}
          required
        />
        <input
          type="number"
          placeholder="Enter your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={inputStyle}
          required
        />
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyle}
          required
        />
        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputStyle}
          required
        />
        <input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputStyle}
          required
        />
        {error && (
          <p className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="
          w-full py-3 rounded-full font-bold text-[#2a1a0e]
          bg-gradient-to-r from-[#f0d080] via-[#c9a84c] to-[#a07828]
          shadow-lg shadow-[#c9a84c]/20
          transition hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'16px 0' }}>
          <div style={{ flex:1, height:'1px', background:'rgba(201,168,76,0.25)' }}/>
          <span style={{ fontFamily:'Inter, sans-serif', fontSize:'0.85rem', color:'#8b6914' }}>or</span>
          <div style={{ flex:1, height:'1px', background:'rgba(201,168,76,0.25)' }}/>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          style={{ width:'100%', padding:'14px',
            background:'#fff',
            border:'1.5px solid rgba(201,168,76,0.4)',
            borderRadius:'50px', cursor:'pointer',
            fontFamily:'Inter, sans-serif', fontWeight:600,
            fontSize:'1rem', color:'#2a1a0e',
            display:'flex', alignItems:'center',
            justifyContent:'center', gap:'10px' }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center text-sm text-[#f5f0e8]/60 mt-2">
          Already have an account?{" "}
          <button
            onClick={() => router.push('/login')}
            className="text-[#c9a84c] font-semibold hover:underline"
          > Login </button>
        </div>
      </div>
    </main>
  );
}
