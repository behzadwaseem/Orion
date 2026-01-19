"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ConstellationBackground } from "@/components/constellation-background"
import { Navbar } from "@/components/navbar"
import { AnnotateContent } from "@/components/annotate/annotate-content"
import { getCurrentUser, logout } from "@/lib/api"
import type { User } from "@/lib/types"

function AnnotatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const datasetId = searchParams.get("dataset")
  
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (err) {
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ConstellationBackground />
        <div className="relative z-10">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!datasetId) {
    return (
      <div className="min-h-screen relative">
        <ConstellationBackground />
        
        <Navbar 
          userEmail={user?.email} 
          onLogout={handleLogout}
        />

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">No Dataset Selected</h1>
            <p className="text-muted-foreground mb-6">Please select a dataset from the datasets page.</p>
            <button
              onClick={() => router.push('/datasets')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Datasets
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <ConstellationBackground />
      
      <Navbar 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      <AnnotateContent datasetId={datasetId} />
    </div>
  )
}

export default function AnnotatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AnnotatePageContent />
    </Suspense>
  )
}