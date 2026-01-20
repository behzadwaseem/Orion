"use client"

import { useEffect, useRef } from "react"

interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  twinkleSpeed: number
  twinkleOffset: number
}

interface Connection {
  from: number
  to: number
  opacity: number
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      const numStars = Math.floor((canvas.width * canvas.height) / 15000)
      starsRef.current = []
      connectionsRef.current = []

      for (let i = 0; i < numStars; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
        })
      }

      // Create constellation connections between nearby stars
      for (let i = 0; i < starsRef.current.length; i++) {
        for (let j = i + 1; j < starsRef.current.length; j++) {
          const dx = starsRef.current[i].x - starsRef.current[j].x
          const dy = starsRef.current[i].y - starsRef.current[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120 && Math.random() > 0.85) {
            connectionsRef.current.push({
              from: i,
              to: j,
              opacity: Math.random() * 0.15 + 0.05,
            })
          }
        }
      }
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      connectionsRef.current.forEach((conn) => {
        const fromStar = starsRef.current[conn.from]
        const toStar = starsRef.current[conn.to]

        ctx.beginPath()
        ctx.moveTo(fromStar.x, fromStar.y)
        ctx.lineTo(toStar.x, toStar.y)
        ctx.strokeStyle = `rgba(147, 197, 253, ${conn.opacity})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Draw stars with twinkling
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7
        const currentOpacity = star.opacity * twinkle

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(226, 232, 240, ${currentOpacity})`
        ctx.fill()

        // Add glow effect for brighter stars
        if (star.radius > 1) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147, 197, 253, ${currentOpacity * 0.2})`
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />
}
