'use client';

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { DatasetsPageHeaderProps } from "@/lib/types"

export function DatasetsPageHeader({ onCreateClick }: DatasetsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">My Datasets</h1>
        <p className="text-muted-foreground mt-1">Select a dataset to continue annotating</p>
      </div>

      <Button className="gap-2 glow-primary cursor-pointer" onClick={onCreateClick}>
        <Plus className="w-4 h-4" />
        New Dataset
      </Button>
    </div>
  )
}
