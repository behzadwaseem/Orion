"use client"

import { useState, useCallback, useEffect } from "react"
import { ImageAnnotator } from "@/components/image-annotator"
import { AnnotatePageHeader } from "@/components/annotate/annotate-page-header"
import { getDataset, getImages, getAnnotations, saveAnnotations, getImageUrl } from "@/lib/api"
import type { Image, Annotation } from "@/lib/types"

interface AnnotateBox {
  id?: string
  label: string
  x: number
  y: number
  w: number
  h: number
  color?: string
}

interface AnnotateKeypoint {
  id: string
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
  x: number
  y: number
}

interface AnnotateBoundingBox {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  keypoints: AnnotateKeypoint[]
  color: string
}

interface AnnotateImageData {
  id: string
  filename: string
  url: string
  width: number
  height: number
  boxes: AnnotateBoundingBox[]
}

interface AnnotateContentProps {
  datasetId: string
}

export function AnnotateContent({ datasetId }: AnnotateContentProps) {
  const [datasetName, setDatasetName] = useState("Loading...")
  const [images, setImages] = useState<AnnotateImageData[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  // Convert simple box to full box with keypoints
  const convertToFullBox = (simpleBox: AnnotateBox): AnnotateBoundingBox => {
    const boxId = simpleBox.id || `box-${Date.now()}-${Math.random()}`
    const createKeypoints = (boxId: string, x: number, y: number, w: number, h: number): AnnotateKeypoint[] => {
      return [
        { id: `${boxId}-tl`, position: "topLeft", x, y },
        { id: `${boxId}-tr`, position: "topRight", x: x + w, y },
        { id: `${boxId}-bl`, position: "bottomLeft", x, y: y + h },
        { id: `${boxId}-br`, position: "bottomRight", x: x + w, y: y + h },
      ]
    }
    
    return {
      id: boxId,
      label: simpleBox.label,
      x: simpleBox.x,
      y: simpleBox.y,
      width: simpleBox.w,
      height: simpleBox.h,
      color: simpleBox.color || "#60a5fa",
      keypoints: createKeypoints(boxId, simpleBox.x, simpleBox.y, simpleBox.w, simpleBox.h),
    }
  }

  // Convert full box back to simple format
  const convertToSimpleBox = (fullBox: AnnotateBoundingBox): AnnotateBox => {
    return {
      id: fullBox.id,
      label: fullBox.label,
      x: fullBox.x,
      y: fullBox.y,
      w: fullBox.width,
      h: fullBox.height,
      color: fullBox.color,
    }
  }

  useEffect(() => {
    loadDatasetAndImages()
  }, [datasetId])

  async function loadDatasetAndImages() {
    setIsLoading(true)
    setError(undefined)

    try {
      const dataset = await getDataset(datasetId)
      setDatasetName(dataset.name)
      console.log("📦 Dataset loaded:", dataset.name)

      const imagesData: Image[] = await getImages(datasetId)
      console.log("🖼️ Images loaded:", imagesData.length)

      const imagesWithAnnotations = await Promise.all(
        imagesData.map(async (img) => {
          const imageUrl = getImageUrl(img.id)
          console.log("🔗 Image URL:", imageUrl, "for", img.filename)
          
          try {
            const annotations: Annotation[] = await getAnnotations(img.id)
            console.log("📝 Loaded", annotations.length, "annotations for", img.filename)
            
            // Convert simple annotations to full boxes with keypoints
            const fullBoxes = annotations.map(ann => convertToFullBox({
              id: ann.id,
              label: ann.label,
              x: ann.x,
              y: ann.y,
              w: ann.w,
              h: ann.h,
            }))
            
            return {
              id: img.id,
              filename: img.filename,
              url: imageUrl,
              width: img.width,
              height: img.height,
              boxes: fullBoxes,
            }
          } catch (err) {
            console.log("⚠️ No annotations for", img.filename)
            return {
              id: img.id,
              filename: img.filename,
              url: imageUrl,
              width: img.width,
              height: img.height,
              boxes: [],
            }
          }
        })
      )

      console.log("✅ All images loaded:", imagesWithAnnotations)
      setImages(imagesWithAnnotations)
    } catch (err: any) {
      console.error("❌ Load error:", err)
      setError(err.message || "Failed to load dataset")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImagesChange = useCallback((newImages: AnnotateImageData[]) => {
    setImages(newImages)
  }, [])

  const handleCurrentImageIndexChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  const handleSaveAnnotations = useCallback(async (imagesToSave: AnnotateImageData[]) => {
    setIsSaving(true)
    
    try {
      // Save only the current image
      const currentImg = imagesToSave[currentImageIndex]
      
      // Convert full boxes back to simple format for API
      const annotations = currentImg.boxes.map(box => convertToSimpleBox(box))
      
      console.log("💾 Saving", annotations.length, "annotations for", currentImg.filename)
      await saveAnnotations(currentImg.id, annotations.map(ann => ({
        label: ann.label,
        x: ann.x,
        y: ann.y,
        w: ann.w,
        h: ann.h,
      })))

      console.log("✅ Annotations saved")
    } catch (err: any) {
      console.error("❌ Save error:", err)
      setError(err.message || "Failed to save annotations")
    } finally {
      setIsSaving(false)
    }
  }, [currentImageIndex])

  const handleExport = useCallback((data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${datasetName}_annotations.json`
    a.click()
    URL.revokeObjectURL(url)
    console.log("✅ Export complete")
  }, [datasetName])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load dataset</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <main className="container mx-auto px-4 py-6 relative z-10">
        <AnnotatePageHeader datasetName={datasetName} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No images in this dataset yet</p>
            <p className="text-sm text-muted-foreground">Upload images from the datasets page</p>
          </div>
        </div>
      </main>
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
        onSave={handleSaveAnnotations}
        onExport={handleExport}
        isSaving={isSaving}
      />
    </main>
  )
}