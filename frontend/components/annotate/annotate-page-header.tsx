"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Download, Loader2 } from "lucide-react"

interface AnnotatePageHeaderProps {
  datasetName: string
  onPrelabelClick?: () => void
  onExportClick?: () => void
  isPrelabeling?: boolean
  prelabelProgress?: { processed: number; total: number }
}

export function AnnotatePageHeader({ 
  datasetName, 
  onPrelabelClick,
  onExportClick,
  isPrelabeling = false,
  prelabelProgress = { processed: 0, total: 0 }
}: AnnotatePageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Annotate</h1>
        <p className="text-muted-foreground">
          Dataset: <span className="text-foreground font-medium">{datasetName}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isPrelabeling && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              Prelabeling... {prelabelProgress.processed} / {prelabelProgress.total}
            </span>
          </div>
        )}

        {onPrelabelClick && (
          <Button
            onClick={onPrelabelClick}
            disabled={isPrelabeling}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isPrelabeling ? "Prelabeling..." : "Auto-Label with AI"}
          </Button>
        )}

        {onExportClick && (
          <Button
            onClick={onExportClick}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        )}
      </div>
    </div>
  )
}