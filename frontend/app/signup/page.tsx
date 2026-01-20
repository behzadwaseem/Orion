"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ConstellationBackground } from "@/components/constellation-background"
import { SignupForm } from "@/components/signup/signup-form"
import type { SignupCredentials } from "@/lib/types"
import { register } from "@/lib/api"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSignup = async (credentials: SignupCredentials) => {
    setIsLoading(true)
    setError(undefined)

    try {
      await register(credentials.email, credentials.password)
      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginClick = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ConstellationBackground />

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <SignupForm
        onSignup={handleSignup}
        onLoginClick={handleLoginClick}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}