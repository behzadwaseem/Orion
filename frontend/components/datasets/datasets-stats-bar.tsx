import { Card } from "@/components/ui/card"
import { FolderOpen, ImageIcon, Pencil } from "lucide-react"
import type { DatasetsStatsBarProps } from "@/lib/types"

export function DatasetsStatsBar({ stats }: DatasetsStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalDatasets}</p>
            <p className="text-sm text-muted-foreground">Total Datasets</p>
          </div>
        </div>
      </Card>
      <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalImages.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Images</p>
          </div>
        </div>
      </Card>
      <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Pencil className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalAnnotated.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Annotated</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
