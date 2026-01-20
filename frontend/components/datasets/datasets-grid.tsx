"use client"

import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { DatasetCard } from "./dataset-card"
import type { DatasetsGridProps } from "@/lib/types"

export function DatasetsGrid({
  datasets,
  onOpenDataset,
  onDeleteDataset,
  onToggleStar,
  onUpload,
  onCreateClick,
}: DatasetsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
          onOpen={onOpenDataset}
          onDelete={onDeleteDataset}
          onToggleStar={onToggleStar}
          onUpload={onUpload}
        />
      ))}

      {/* Empty state for create */}
      <Card
        className="border-dashed border-2 border-border/50 bg-transparent hover:border-primary/50 hover:bg-card/30 transition-all cursor-pointer flex items-center justify-center min-h-[200px]"
        onClick={onCreateClick}
      >
        <div className="text-center p-5">
          <div className="mx-auto mb-3 p-3 rounded-full bg-muted/50 w-fit">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Create New Dataset</p>
        </div>
      </Card>
    </div>
  )
}