"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ConstellationBackground } from "@/components/constellation-background"
import { LoginForm } from "@/components/login/login-form"
import type { LoginCredentials } from "@/lib/types"
import { login } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [success, setSuccess] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (registered === 'true') {
      setSuccess('Account created successfully! Please sign in.')
    }
  }, [registered])

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(undefined)
    setSuccess(undefined)

    try {
      await login(credentials.email, credentials.password)
      router.push("/datasets")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUpClick = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ConstellationBackground />

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      {success && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg backdrop-blur-sm">
          {success}
        </div>
      )}

      <LoginForm
        onLogin={handleLogin}
        onSignUpClick={handleSignUpClick}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}