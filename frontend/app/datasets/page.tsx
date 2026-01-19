"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ConstellationBackground } from "@/components/constellation-background"
import { Navbar } from "@/components/navbar"
import { DatasetsPageHeader } from "@/components/datasets/datasets-page-header"
import { DatasetsStatsBar } from "@/components/datasets/datasets-stats-bar"
import { DatasetsGrid } from "@/components/datasets/datasets-grid"
import { CreateDatasetDialog } from "@/components/datasets/create-dataset-dialog"
import { getDatasets, getImages, createDataset, deleteDataset, getCurrentUser, logout } from "@/lib/api"
import type { Dataset, DatasetWithStats, CreateDatasetInput, DatasetsStats, Image, User } from "@/lib/types"

export default function DatasetsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [datasets, setDatasets] = useState<DatasetWithStats[]>([])
  const [stats, setStats] = useState<DatasetsStats>({ totalDatasets: 0, totalImages: 0, totalAnnotated: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    loadUser()
    loadDatasetsWithStats()
  }, [])

  async function loadUser() {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (err) {
      // If not authenticated, redirect to login
      router.push('/login')
    }
  }

  async function loadDatasetsWithStats() {
    setIsLoading(true)
    setError(undefined)

    try {
      // Fetch all datasets
      const datasetsData: Dataset[] = await getDatasets()

      // Fetch images for each dataset to compute stats
      const datasetsWithStats = await Promise.all(
        datasetsData.map(async (dataset) => {
          try {
            const images: Image[] = await getImages(dataset.id)
            const totalImages = images.length
            const annotatedImages = images.filter(img => img.annotation_count > 0).length
            const reviewedImages = images.filter(img => img.reviewed_at !== null).length

            return {
              ...dataset,
              totalImages,
              annotatedImages,
              reviewedImages,
              starred: false,
              updatedAt: new Date(dataset.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
            }
          } catch {
            return {
              ...dataset,
              totalImages: 0,
              annotatedImages: 0,
              reviewedImages: 0,
              starred: false,
              updatedAt: new Date(dataset.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
            }
          }
        })
      )

      setDatasets(datasetsWithStats)

      // Compute aggregate stats
      const totalDatasets = datasetsWithStats.length
      const totalImages = datasetsWithStats.reduce((sum, d) => sum + d.totalImages, 0)
      const totalAnnotated = datasetsWithStats.reduce((sum, d) => sum + d.annotatedImages, 0)

      setStats({ totalDatasets, totalImages, totalAnnotated })
    } catch (err: any) {
      setError(err.message || "Failed to load datasets")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateDataset(input: CreateDatasetInput) {
    setIsCreating(true)
    try {
      await createDataset(input.name, input.description)
      setCreateDialogOpen(false)
      await loadDatasetsWithStats()
    } catch (err: any) {
      setError(err.message || "Failed to create dataset")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteDataset(id: string) {
    if (!confirm("Are you sure you want to delete this dataset? This will delete all images and annotations.")) {
      return
    }

    try {
      await deleteDataset(id)
      await loadDatasetsWithStats()
    } catch (err: any) {
      setError(err.message || "Failed to delete dataset")
    }
  }

  function handleToggleStar(id: string) {
    setDatasets(prev => prev.map(d => 
      d.id === id ? { ...d, starred: !d.starred } : d
    ))
  }

  function handleOpenDataset(id: string) {
    router.push(`/annotate?dataset=${id}`)
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

  return (
    <div className="min-h-screen relative">
      <ConstellationBackground />

      <Navbar 
        userEmail={user?.email} 
        onLogout={handleLogout}
      />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <DatasetsPageHeader onCreateClick={() => setCreateDialogOpen(true)} />

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <DatasetsStatsBar stats={stats} />

        <DatasetsGrid
          datasets={datasets}
          onOpenDataset={handleOpenDataset}
          onDeleteDataset={handleDeleteDataset}
          onToggleStar={handleToggleStar}
          onCreateClick={() => setCreateDialogOpen(true)}
        />

        <CreateDatasetDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreateDataset}
          isCreating={isCreating}
        />
      </div>
    </div>
  )
}