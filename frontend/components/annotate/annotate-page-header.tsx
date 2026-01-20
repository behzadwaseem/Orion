"use client"

import type { AnnotatePageHeaderProps } from "@/lib/types"

export function AnnotatePageHeader({ datasetName }: AnnotatePageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Annotation Studio</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Draw bounding boxes with draggable keypoints • {datasetName}
      </p>
    </div>
  )
}
