"use client"

import type React from "react"
import { useState } from "react"
import { OrionLogo } from "@/components/orion-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import type { SignupFormProps } from "@/lib/types"

export function SignupForm({ onSignup, onLoginClick, isLoading, error }: SignupFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    // Client-side validation
    if (!email.trim()) {
      setValidationError("Email is required")
      return
    }

    if (!email.includes('@')) {
      setValidationError("Please enter a valid email address")
      return
    }

    if (!password.trim()) {
      setValidationError("Password is required")
      return
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters")
      return
    }

    if (password.length > 72) {
      setValidationError("Password cannot be longer than 72 characters")
      return
    }

    if (!confirmPassword.trim()) {
      setValidationError("Please confirm your password")
      return
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    onSignup({ email, password })
  }

  const displayError = validationError || error

  return (
    <Card className="w-full max-w-md p-8 relative z-10 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 p-3 rounded-2xl bg-primary/10 glow-primary">
          <OrionLogo className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Create Account</h1>
        <p className="text-muted-foreground mt-2 text-center">Start annotating your datasets</p>
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
                setValidationError("")
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
              placeholder="At least 8 characters"
              className="pl-10 bg-input/50"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setValidationError("")
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              className="pl-10 bg-input/50"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setValidationError("")
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Password must be 8-72 characters
        </div>

        <Button type="submit" className="w-full gap-2 glow-primary cursor-pointer" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-primary hover:underline font-medium cursor-pointer"
            disabled={isLoading}
          >
            Sign in
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