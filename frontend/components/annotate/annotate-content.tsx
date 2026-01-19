"use client"

import { useState, useCallback } from "react"
import { ImageAnnotator } from "@/components/image-annotator"
import { AnnotatePageHeader } from "@/components/annotate/annotate-page-header"
import type { AnnotateImageData, AnnotateExportData } from "@/lib/types"

interface AnnotateContentProps {
  datasetId: string
}

export function AnnotateContent({ datasetId }: AnnotateContentProps) {
  // TODO: Replace with API call to fetch dataset info and existing images/annotations
  const datasetName = "Dataset"
  
  // State for images and annotations - will be populated from backend
  const [images, setImages] = useState<AnnotateImageData[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isLoading] = useState(false)
  const [error] = useState<string | undefined>(undefined)

  const handleImagesChange = useCallback((newImages: AnnotateImageData[]) => {
    setImages(newImages)
  }, [])

  const handleCurrentImageIndexChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  const handleSaveAnnotations = useCallback(async (imagesToSave: AnnotateImageData[]) => {
    console.log("Saving annotations:", imagesToSave)
  }, [])

  const handleExport = useCallback((data: AnnotateExportData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "annotations.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load dataset</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 relative z-10 max-w-full overflow-hidden">
      <AnnotatePageHeader datasetName={datasetName} />

      <ImageAnnotator
        images={images}
        currentImageIndex={currentImageIndex}
        onImagesChange={handleImagesChange}
        onCurrentImageIndexChange={handleCurrentImageIndexChange}
        onExport={handleExport}
      />
    </main>
  )
}