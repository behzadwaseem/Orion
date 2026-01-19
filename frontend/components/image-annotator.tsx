"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Upload,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  Palette,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImageAnnotatorProps, AnnotateImageData, AnnotateBoundingBox, AnnotateKeypoint, AnnotateExportData } from "@/lib/types"

// Local type aliases for cleaner code
type Keypoint = AnnotateKeypoint
type BoundingBox = AnnotateBoundingBox

type InteractionMode = "none" | "drawing" | "draggingBox" | "draggingKeypoint"

interface DragState {
  mode: InteractionMode
  boxId: string | null
  keypointId: string | null
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

const KEYPOINT_RADIUS = 8
const KEYPOINT_HIT_RADIUS = 12
const BOX_CORNER_RADIUS = 6
const BOX_GLOW_BLUR = 16

export function ImageAnnotator({
  images,
  currentImageIndex,
  onImagesChange,
  onCurrentImageIndexChange,
  onExport,
}: ImageAnnotatorProps) {
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set())
  const [cursorStyle, setCursorStyle] = useState<string>("crosshair")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dragState, setDragState] = useState<DragState>({
    mode: "none",
    boxId: null,
    keypointId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })
  const [drawingBox, setDrawingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current image data helper
  const currentImage = images[currentImageIndex] || null
  const boxes = currentImage?.boxes || []

  const createKeypoints = (boxId: string, x: number, y: number, width: number, height: number): Keypoint[] => {
    return [
      { id: `${boxId}-tl`, position: "topLeft", x, y },
      { id: `${boxId}-tr`, position: "topRight", x: x + width, y },
      { id: `${boxId}-bl`, position: "bottomLeft", x, y: y + height },
      { id: `${boxId}-br`, position: "bottomRight", x: x + width, y: y + height },
    ]
  }

  const updateKeypointsFromBox = (box: BoundingBox): Keypoint[] => {
    return [
      { ...box.keypoints[0], x: box.x, y: box.y },
      { ...box.keypoints[1], x: box.x + box.width, y: box.y },
      { ...box.keypoints[2], x: box.x, y: box.y + box.height },
      { ...box.keypoints[3], x: box.x + box.width, y: box.y + box.height },
    ]
  }

  const hexToRgba = (hex: string, alpha: number): string => {
    const num = Number.parseInt(hex.replace("#", ""), 16)
    const r = (num >> 16) & 0xff
    const g = (num >> 8) & 0xff
    const b = num & 0xff
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const adjustColorBrightness = (hex: string, percent: number): string => {
    const num = Number.parseInt(hex.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, ((num >> 16) & 0xff) + amt)
    const G = Math.min(255, ((num >> 8) & 0xff) + amt)
    const B = Math.min(255, (num & 0xff) + amt)
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`
  }

  const roundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (loadedImage) {
      ctx.drawImage(loadedImage, 0, 0, canvasSize.width, canvasSize.height)
    }

    // Draw constellation lines between keypoints (constellation theme)
    boxes.forEach((box) => {
      const isSelected = selectedBox === box.id
      if (isSelected) {
        ctx.save()
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = hexToRgba(box.color, 0.3)
        ctx.lineWidth = 1

        // Draw diagonal constellation lines
        ctx.beginPath()
        ctx.moveTo(box.keypoints[0].x, box.keypoints[0].y)
        ctx.lineTo(box.keypoints[3].x, box.keypoints[3].y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(box.keypoints[1].x, box.keypoints[1].y)
        ctx.lineTo(box.keypoints[2].x, box.keypoints[2].y)
        ctx.stroke()

        ctx.restore()
      }
    })

    // Draw existing bounding boxes
    boxes.forEach((box) => {
      const isSelected = selectedBox === box.id
      const boxColor = box.color
      const selectedColor = adjustColorBrightness(boxColor, 20)
      const currentColor = isSelected ? selectedColor : boxColor

      // Outer glow for selected
      if (isSelected) {
        ctx.save()
        ctx.shadowColor = currentColor
        ctx.shadowBlur = BOX_GLOW_BLUR
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = currentColor
        ctx.lineWidth = 2
        roundedRect(ctx, box.x, box.y, box.width, box.height, BOX_CORNER_RADIUS)
        ctx.stroke()
        ctx.restore()
      }

      // Fill
      const fillGradient = ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height)
      fillGradient.addColorStop(0, hexToRgba(currentColor, isSelected ? 0.08 : 0.04))
      fillGradient.addColorStop(1, hexToRgba(currentColor, isSelected ? 0.15 : 0.08))
      ctx.fillStyle = fillGradient
      roundedRect(ctx, box.x, box.y, box.width, box.height, BOX_CORNER_RADIUS)
      ctx.fill()

      // Border
      ctx.strokeStyle = currentColor
      ctx.lineWidth = isSelected ? 2 : 1.5
      ctx.setLineDash([])
      roundedRect(ctx, box.x, box.y, box.width, box.height, BOX_CORNER_RADIUS)
      ctx.stroke()

      // Draw keypoints as stars
      box.keypoints.forEach((kp) => {
        const kpRadius = isSelected ? KEYPOINT_RADIUS + 1 : KEYPOINT_RADIUS - 1

        // Outer glow
        ctx.save()
        ctx.shadowColor = currentColor
        ctx.shadowBlur = isSelected ? 12 : 6
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, kpRadius + 3, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(currentColor, 0.2)
        ctx.fill()
        ctx.restore()

        // Main circle with gradient
        const gradient = ctx.createRadialGradient(kp.x - 2, kp.y - 2, 0, kp.x, kp.y, kpRadius)
        gradient.addColorStop(0, "#ffffff")
        gradient.addColorStop(0.5, adjustColorBrightness(currentColor, 30))
        gradient.addColorStop(1, currentColor)

        ctx.beginPath()
        ctx.arc(kp.x, kp.y, kpRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner highlight (star twinkle effect)
        ctx.beginPath()
        ctx.arc(kp.x - 1, kp.y - 1, kpRadius * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.fill()

        // Crisp border
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, kpRadius, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    })

    // Drawing preview
    if (drawingBox) {
      ctx.strokeStyle = "#60a5fa"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      roundedRect(ctx, drawingBox.x, drawingBox.y, drawingBox.width, drawingBox.height, BOX_CORNER_RADIUS)
      ctx.stroke()

      const previewGradient = ctx.createLinearGradient(
        drawingBox.x,
        drawingBox.y,
        drawingBox.x + drawingBox.width,
        drawingBox.y + drawingBox.height,
      )
      previewGradient.addColorStop(0, "rgba(96, 165, 250, 0.05)")
      previewGradient.addColorStop(1, "rgba(96, 165, 250, 0.12)")
      ctx.fillStyle = previewGradient
      roundedRect(ctx, drawingBox.x, drawingBox.y, drawingBox.width, drawingBox.height, BOX_CORNER_RADIUS)
      ctx.fill()

      ctx.setLineDash([])
    }
  }, [loadedImage, canvasSize, boxes, selectedBox, drawingBox])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const imageToLoad = images[currentImageIndex]

    if (!imageToLoad) {
      setLoadedImage(null)
      return
    }

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Use original image dimensions for the canvas to preserve annotation accuracy
      // The container will handle scrolling for large images
      setCanvasSize({ width: img.width, height: img.height })
      setLoadedImage(img)
    }
    img.src = imageToLoad.src
    setSelectedBox(null)
    setExpandedBoxes(new Set())
  }, [images, currentImageIndex])

  const generateThumbnail = (img: HTMLImageElement, maxSize = 80): string => {
    const canvas = document.createElement("canvas")
    const scale = Math.min(maxSize / img.width, maxSize / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    return canvas.toDataURL("image/jpeg", 0.7)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    let loadedCount = 0
    const newImages: AnnotateImageData[] = []

    fileArray.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (!result) return

        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const imageData: AnnotateImageData = {
            id: `img-${Date.now()}-${index}`,
            name: file.name,
            src: result,
            width: img.width,
            height: img.height,
            boxes: [],
            thumbnail: generateThumbnail(img),
          }
          newImages[index] = imageData
          loadedCount++

          if (loadedCount === fileArray.length) {
            // Filter out any undefined entries and add to images
            const validImages = newImages.filter(Boolean)
            onImagesChange([...images, ...validImages])
            // Use setTimeout to ensure state update happens after images are set
            if (images.length === 0) {
              setTimeout(() => onCurrentImageIndexChange(0), 0)
            }
          }
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      onCurrentImageIndexChange(currentImageIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      onCurrentImageIndexChange(currentImageIndex + 1)
    }
  }

  const selectImage = (index: number) => {
    onCurrentImageIndexChange(index)
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    // Account for zoom when calculating mouse position
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    return { x, y }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  const findKeypointAt = (x: number, y: number): { boxId: string; keypointId: string } | null => {
    for (const box of boxes) {
      for (const kp of box.keypoints) {
        const dx = x - kp.x
        const dy = y - kp.y
        if (Math.sqrt(dx * dx + dy * dy) <= KEYPOINT_HIT_RADIUS) {
          return { boxId: box.id, keypointId: kp.id }
        }
      }
    }
    return null
  }

  const findBoxAt = (x: number, y: number): string | null => {
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i]
      const nearLeft = Math.abs(x - box.x) < 10 && y >= box.y && y <= box.y + box.height
      const nearRight = Math.abs(x - (box.x + box.width)) < 10 && y >= box.y && y <= box.y + box.height
      const nearTop = Math.abs(y - box.y) < 10 && x >= box.x && x <= box.x + box.width
      const nearBottom = Math.abs(y - (box.y + box.height)) < 10 && x >= box.x && x <= box.x + box.width

      if (nearLeft || nearRight || nearTop || nearBottom) return box.id
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    const keypointHit = findKeypointAt(pos.x, pos.y)
    if (keypointHit) {
      setSelectedBox(keypointHit.boxId)
      setDragState({
        mode: "draggingKeypoint",
        boxId: keypointHit.boxId,
        keypointId: keypointHit.keypointId,
        startX: pos.x,
        startY: pos.y,
        offsetX: 0,
        offsetY: 0,
      })
      return
    }

    const boxHit = findBoxAt(pos.x, pos.y)
    if (boxHit) {
      const box = boxes.find((b) => b.id === boxHit)!
      setSelectedBox(boxHit)
      setDragState({
        mode: "draggingBox",
        boxId: boxHit,
        keypointId: null,
        startX: pos.x,
        startY: pos.y,
        offsetX: pos.x - box.x,
        offsetY: pos.y - box.y,
      })
      return
    }

    setSelectedBox(null)
    setDragState({
      mode: "drawing",
      boxId: null,
      keypointId: null,
      startX: pos.x,
      startY: pos.y,
      offsetX: 0,
      offsetY: 0,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    if (dragState.mode === "none") {
      if (findKeypointAt(pos.x, pos.y)) {
        setCursorStyle("pointer")
      } else if (findBoxAt(pos.x, pos.y)) {
        setCursorStyle("grab")
      } else {
        setCursorStyle("crosshair")
      }
    }

    if (dragState.mode === "drawing") {
      const x = Math.min(dragState.startX, pos.x)
      const y = Math.min(dragState.startY, pos.y)
      const width = Math.abs(pos.x - dragState.startX)
      const height = Math.abs(pos.y - dragState.startY)
      setDrawingBox({ x, y, width, height })
    }

    if (dragState.mode === "draggingBox" && dragState.boxId) {
      setCursorStyle("grabbing")
      const newX = pos.x - dragState.offsetX
      const newY = pos.y - dragState.offsetY

      updateBoxes((prevBoxes) =>
        prevBoxes.map((box) => {
          if (box.id !== dragState.boxId) return box
          const updatedBox = { ...box, x: newX, y: newY }
          return { ...updatedBox, keypoints: updateKeypointsFromBox(updatedBox) }
        }),
      )
    }

    if (dragState.mode === "draggingKeypoint" && dragState.boxId && dragState.keypointId) {
      updateBoxes((prevBoxes) =>
        prevBoxes.map((box) => {
          if (box.id !== dragState.boxId) return box

          const keypoint = box.keypoints.find((kp) => kp.id === dragState.keypointId)
          if (!keypoint) return box

          let newBoxX = box.x
          let newBoxY = box.y
          let newWidth = box.width
          let newHeight = box.height

          switch (keypoint.position) {
            case "topLeft":
              newWidth = box.x + box.width - pos.x
              newHeight = box.y + box.height - pos.y
              newBoxX = pos.x
              newBoxY = pos.y
              break
            case "topRight":
              newWidth = pos.x - box.x
              newHeight = box.y + box.height - pos.y
              newBoxY = pos.y
              break
            case "bottomLeft":
              newWidth = box.x + box.width - pos.x
              newHeight = pos.y - box.y
              newBoxX = pos.x
              break
            case "bottomRight":
              newWidth = pos.x - box.x
              newHeight = pos.y - box.y
              break
          }

          if (newWidth < 20 || newHeight < 20) return box

          const updatedBox = { ...box, x: newBoxX, y: newBoxY, width: newWidth, height: newHeight }
          return { ...updatedBox, keypoints: updateKeypointsFromBox(updatedBox) }
        }),
      )
    }
  }

  const updateBoxes = (updater: (boxes: BoundingBox[]) => BoundingBox[]) => {
    onImagesChange(
      images.map((img, idx) => (idx === currentImageIndex ? { ...img, boxes: updater(img.boxes) } : img)),
    )
  }

  const handleMouseUp = () => {
    if (dragState.mode === "drawing" && drawingBox) {
      if (drawingBox.width > 10 && drawingBox.height > 10) {
        const boxId = `box-${Date.now()}`
        const newBox: BoundingBox = {
          id: boxId,
          label: `Box ${boxes.length + 1}`,
          x: drawingBox.x,
          y: drawingBox.y,
          width: drawingBox.width,
          height: drawingBox.height,
          keypoints: createKeypoints(boxId, drawingBox.x, drawingBox.y, drawingBox.width, drawingBox.height),
          color: "#60a5fa",
        }

        updateBoxes((prev) => [...prev, newBox])
        setSelectedBox(boxId)
        setExpandedBoxes((prev) => new Set([...prev, boxId]))
      }
    }

    setDrawingBox(null)
    setDragState({
      mode: "none",
      boxId: null,
      keypointId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    })
    setCursorStyle("crosshair")
  }

  const handleDeleteBox = () => {
    if (!selectedBox) return
    updateBoxes((prev) => prev.filter((box) => box.id !== selectedBox))
    setExpandedBoxes((prev) => {
      const next = new Set(prev)
      next.delete(selectedBox)
      return next
    })
    setSelectedBox(null)
  }

  const handleClearAll = () => {
    updateBoxes(() => [])
    setSelectedBox(null)
    setExpandedBoxes(new Set())
  }

  const toggleBoxExpanded = (boxId: string) => {
    setExpandedBoxes((prev) => {
      const next = new Set(prev)
      if (next.has(boxId)) {
        next.delete(boxId)
      } else {
        next.add(boxId)
      }
      return next
    })
  }

  const handleExportJSON = () => {
    const data: AnnotateExportData = {
      dataset: images.map((img) => {
        // Coordinates are now stored at original image scale, no conversion needed
        return {
          image: {
            id: img.id,
            name: img.name,
            width: img.width,
            height: img.height,
          },
          annotations: img.boxes.map((box) => ({
            id: box.id,
            label: box.label,
            bbox: {
              x: Math.round(box.x),
              y: Math.round(box.y),
              width: Math.round(box.width),
              height: Math.round(box.height),
            },
            keypoints: box.keypoints.map((kp) => ({
              position: kp.position,
              x: Math.round(kp.x),
              y: Math.round(kp.y),
              normalized_x: kp.x / img.width,
              normalized_y: kp.y / img.height,
            })),
          })),
        }
      }),
    }

    // Call the export callback provided by the parent container
    onExport(data)
  }

  const handleColorChange = (color: string) => {
    if (!selectedBox) return
    updateBoxes((prevBoxes) => prevBoxes.map((box) => (box.id === selectedBox ? { ...box, color } : box)))
    setShowColorPicker(false)
  }

  const selectedBoxData = boxes.find((box) => box.id === selectedBox)

  return (
    <div className="flex gap-4 w-full max-w-full overflow-hidden">
      <div className={cn("transition-all duration-300 ease-in-out flex-shrink-0", sidebarOpen ? "w-[200px]" : "w-0")}>
        {sidebarOpen && (
          <Card className="p-3 bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Images</h3>
              <span className="text-xs text-muted-foreground">{images.length}</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {images.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">No images uploaded yet</div>
              ) : (
                images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => selectImage(index)}
                    className={cn(
                      "w-full p-2 rounded-lg border transition-all text-left cursor-pointer",
                      index === currentImageIndex
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                        : "bg-card/50 border-border/50 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {img.thumbnail ? (
                        <img
                          src={img.thumbnail || "/placeholder.svg"}
                          alt={img.name}
                          className="w-12 h-12 object-cover rounded border border-border/50"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted/30 rounded flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{img.name}</p>
                        <p className="text-xs text-muted-foreground">{img.boxes.length} boxes</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-2 bg-transparent border-border/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3" />
              Add Images
            </Button>
          </Card>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 h-10 w-10 self-start cursor-pointer"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </Button>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6 overflow-hidden">
        <div className="space-y-4">
          <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50 overflow-hidden">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[450px] border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Upload images to start</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                  Draw bounding boxes and annotate keypoints like mapping constellations
                </p>
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2 glow-primary cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Choose Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-muted-foreground">
                    Click and drag to draw boxes • Drag corners to resize • Drag edges to move
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.25}
                        className="h-8 w-8 cursor-pointer disabled:cursor-not-allowed"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-xs font-mono px-2 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="h-8 w-8 cursor-pointer disabled:cursor-not-allowed"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomReset}
                        className="h-8 w-8 cursor-pointer"
                        title="Reset zoom"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div
                  ref={containerRef}
                  className="border border-border/50 rounded-xl bg-background/50 w-full"
                  style={{ 
                    maxHeight: "55vh", 
                    maxWidth: "100%",
                    overflowX: "auto",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      width: canvasSize.width * zoom,
                      height: canvasSize.height * zoom,
                      minWidth: canvasSize.width * zoom,
                      minHeight: canvasSize.height * zoom,
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      style={{
                        cursor: cursorStyle,
                        display: "block",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top left",
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousImage}
                    disabled={currentImageIndex === 0}
                    className="gap-2 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                    <span className="text-foreground font-medium truncate max-w-[200px]">{currentImage?.name}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="gap-2 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Annotations and Export - horizontal layout below canvas */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Annotations</h3>
              <span className="text-sm text-muted-foreground">{boxes.length} boxes</span>
            </div>

            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
              {boxes.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No bounding boxes yet. Draw on the image to create annotations.
                </div>
              ) : (
                boxes.map((box) => (
                  <div key={box.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedBox(box.id)
                        toggleBoxExpanded(box.id)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                        selectedBox === box.id
                          ? "bg-primary/10 border-primary/50 text-primary"
                          : "bg-card/50 border-border/50 hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {expandedBoxes.has(box.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div
                          className="w-3 h-3 rounded-full ring-2 ring-white/20"
                          style={{ backgroundColor: box.color }}
                        />
                        <div className="text-left">
                          <div className="font-mono text-sm font-medium">{box.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(box.width)} x {Math.round(box.height)} px
                          </div>
                        </div>
                      </div>
                    </button>

                    {expandedBoxes.has(box.id) && (
                      <div className="ml-6 pl-4 border-l-2 border-border/50 space-y-1">
                        {box.keypoints.map((kp) => (
                          <div key={kp.id} className="flex items-center gap-2 p-2 rounded text-sm bg-muted/20">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: box.color }} />
                            <span className="font-mono text-muted-foreground capitalize text-xs">
                              {kp.position.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto font-mono">
                              ({Math.round(kp.x)}, {Math.round(kp.y)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-border/50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  disabled={!selectedBox}
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Change Color
                  </span>
                  {selectedBoxData && (
                    <div
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: selectedBoxData.color }}
                    />
                  )}
                </Button>

                {showColorPicker && selectedBox && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border border-border/50 rounded-lg shadow-lg z-10">
                    <div className="grid grid-cols-4 gap-2">
                      {["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#a78bfa", "#f472b6", "#22d3ee", "#fb923c"].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                              "w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 cursor-pointer",
                              selectedBoxData?.color === color ? "border-white" : "border-transparent",
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="destructive"
                className="w-full cursor-pointer disabled:cursor-not-allowed"
                onClick={handleDeleteBox}
                disabled={!selectedBox}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>

              <Button
                variant="outline"
                className="w-full bg-transparent border-border/50 cursor-pointer disabled:cursor-not-allowed"
                onClick={handleClearAll}
                disabled={boxes.length === 0}
              >
                Clear All
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Export</h3>
              <Button
                className="w-full gap-2 glow-primary cursor-pointer disabled:cursor-not-allowed"
                onClick={handleExportJSON}
                disabled={images.length === 0}
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Exports all images with bounding boxes and keypoint coordinates for ML training
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
