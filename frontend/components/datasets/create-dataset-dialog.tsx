"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { CreateDatasetDialogProps } from "@/lib/types"

export function CreateDatasetDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: CreateDatasetDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), description: description.trim() || undefined })
    setName("")
    setDescription("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setDescription("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
          <DialogDescription>
            Start a new annotation project for your ML training data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name</Label>
            <Input
              id="name"
              placeholder="e.g., Human Pose Dataset"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input/50"
              disabled={isCreating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of the dataset"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-input/50"
              disabled={isCreating}
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full gap-2 cursor-pointer"
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Dataset
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
