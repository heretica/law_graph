'use client'

import { useEffect, useRef } from 'react'

interface LoadingWheel3DProps {
  size?: number
  speed?: number
  color?: string
}

export default function LoadingWheel3D({
  size = 40,
  speed = 1,
  color = '#D97706'
}: LoadingWheel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = (size - 4) / 2

    let rotation = 0
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      rotation = (elapsed * speed * 0.002) % (2 * Math.PI)

      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Create 3D-like rotating wheel effect
      const segments = 8
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments + rotation
        const segmentRadius = radius * (0.7 + 0.3 * Math.sin(angle + rotation * 2))

        // Calculate 3D depth effect
        const depth = Math.cos(angle + rotation) * 0.5 + 0.5
        const alpha = 0.3 + 0.7 * depth

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)

        // Draw segment with varying opacity for 3D effect
        ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.arc(segmentRadius * 0.6, 0, 2, 0, 2 * Math.PI)
        ctx.fill()

        ctx.restore()
      }

      // Draw center circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI)
      ctx.fill()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size, speed, color])

  return (
    <canvas
      ref={canvasRef}
      className="inline-block"
      style={{ width: size, height: size }}
    />
  )
}