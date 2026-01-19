"use client"

import type React from "react"
import { useState } from "react"
import { OrionLogo } from "@/components/orion-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import type { LoginFormProps } from "@/lib/types"

export function LoginForm({ onLogin, onSignUpClick, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    // Client-side validation
    if (!email.trim()) {
      setValidationError("Email is required")
      return
    }

    if (!password.trim()) {
      setValidationError("Password is required")
      return
    }

    if (!email.includes('@')) {
      setValidationError("Please enter a valid email address")
      return
    }

    onLogin({ email, password })
  }

  // Show validation error first, then API error
  const displayError = validationError || error

  return (
    <Card className="w-full max-w-md p-8 relative z-10 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 p-3 rounded-2xl bg-primary/10 glow-primary">
          <OrionLogo className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">Sign in to continue to Orion</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {displayError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10 bg-input/50"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setValidationError("") // Clear validation error on change
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="pl-10 bg-input/50"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setValidationError("") // Clear validation error on change
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full gap-2 glow-primary cursor-pointer" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSignUpClick}
            className="text-primary hover:underline font-medium cursor-pointer"
            disabled={isLoading}
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Decorative constellation dots */}
      <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-primary/60" />
      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-accent/60" />
      <div className="absolute top-1/3 -right-1 w-1 h-1 rounded-full bg-primary/40" />
    </Card>
  )
}