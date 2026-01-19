"use client"

import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderOpen, Calendar, MoreHorizontal, Trash2, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DatasetCardProps } from "@/lib/types"

function getProgressColor(annotated: number, total: number): string {
  const percent = total > 0 ? (annotated / total) * 100 : 0
  if (percent >= 100) return "bg-green-500"
  if (percent >= 50) return "bg-primary"
  return "bg-amber-500"
}

export function DatasetCard({ dataset, onOpen, onDelete, onToggleStar }: DatasetCardProps) {
  const progressPercent = dataset.totalImages > 0 
    ? (dataset.annotatedImages / dataset.totalImages) * 100 
    : 0

  // Format date (e.g., "Jan 19, 2026")
  const updatedDate = new Date(dataset.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <Card
      className="group relative bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
      onClick={() => onOpen(dataset.id)}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar(dataset.id)
          }}
          className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
        >
          <Star
            className={cn(
              "w-4 h-4",
              dataset.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            )}
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1 hover:bg-muted rounded transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete(dataset.id)
              }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {dataset.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {dataset.description || "No description"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>
              {dataset.annotatedImages} / {dataset.totalImages} images
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                getProgressColor(dataset.annotatedImages, dataset.totalImages),
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Modified {updatedDate}</span>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      </div>
    </Card>
  )
}