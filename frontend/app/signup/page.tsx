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
    alert("Verification email sent! Please verify your email.");
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
        {
        error && (
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
          transition hover:scale-[1.02] active:scale-[0.98]          "
          >
          {loading ? "Creating Account..." : "Create Account"}
          Create Account
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