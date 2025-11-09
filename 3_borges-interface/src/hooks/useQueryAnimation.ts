'use client'

import { useRef, useCallback, useEffect } from 'react'
import type { DebugInfo } from '@/lib/services/reconciliation'

export interface AnimationState {
  phase: 'explosion' | 'filtering' | 'synthesis' | 'crystallization'
  progress: number // 0-1
  isPlaying: boolean
}

export interface GraphNode {
  id: string
  x: number
  y: number
  z: number
  fx?: number
  fy?: number
  fz?: number
  name?: string
  type?: string
  selected?: boolean
  opacity?: number
  scale?: number
  color?: string
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  opacity?: number
  weight?: number
  color?: string
}

export interface AnimationCallbacks {
  onPhaseChange?: (phase: string) => void
  onProgressUpdate?: (progress: number) => void
  onAnimationComplete?: () => void
}

export function useQueryAnimation(
  nodes: GraphNode[],
  links: GraphLink[],
  debugInfo: DebugInfo | null,
  callbacks?: AnimationCallbacks
) {
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentPhaseRef = useRef<string>('explosion')
  const isPlayingRef = useRef<boolean>(false)
  const speedRef = useRef<number>(1.0)

  // Store original positions
  const originalPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map())

  // Initialize original positions
  useEffect(() => {
    if (nodes.length > 0) {
      const positions = new Map()
      nodes.forEach(node => {
        positions.set(node.id, { x: node.x, y: node.y, z: node.z })
      })
      originalPositionsRef.current = positions
    }
  }, [nodes])

  const getPhaseData = useCallback((phase: string) => {
    if (!debugInfo) return null

    switch (phase) {
      case 'explosion':
        return debugInfo.processing_phases.entity_selection
      case 'filtering':
        return debugInfo.processing_phases.community_analysis
      case 'synthesis':
        return debugInfo.processing_phases.relationship_mapping
      case 'crystallization':
        return debugInfo.processing_phases.text_synthesis
      default:
        return null
    }
  }, [debugInfo])

  // Explosion Phase Animation
  const animateExplosion = useCallback((progress: number) => {
    const explosionRadius = 300 + (progress * 200) // Expand from 300 to 500
    const rotationSpeed = progress * 0.1

    return nodes.map(node => {
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI

      return {
        ...node,
        fx: Math.cos(angle) * Math.cos(elevation) * explosionRadius,
        fy: Math.sin(elevation) * explosionRadius,
        fz: Math.sin(angle) * Math.cos(elevation) * explosionRadius,
        scale: 1 + (progress * 0.5), // Scale up slightly
        opacity: 0.7 + (progress * 0.3),
        color: node.selected ? '#818CF8' : '#6B7280' // Purple for potential selection
      }
    })
  }, [nodes])

  // Filtering Phase Animation
  const animateFiltering = useCallback((progress: number) => {
    const phaseData = getPhaseData('filtering')
    const selectedEntityIds = new Set(phaseData?.entities?.map(e => e.id) || [])

    return nodes.map(node => {
      const isSelected = selectedEntityIds.has(node.id)
      const targetOpacity = isSelected ? 1.0 : 0.3 * (1 - progress * 0.7)
      const targetScale = isSelected ? 1.5 : 0.8
      const glowIntensity = isSelected ? progress * 2 : 0

      // Contract selected nodes toward center
      const contractionFactor = isSelected ? progress * 0.6 : 0
      const originalPos = originalPositionsRef.current.get(node.id)

      return {
        ...node,
        fx: originalPos ? originalPos.x * (1 - contractionFactor) : node.x,
        fy: originalPos ? originalPos.y * (1 - contractionFactor) : node.y,
        fz: originalPos ? originalPos.z * (1 - contractionFactor) : node.z,
        scale: targetScale,
        opacity: targetOpacity,
        color: isSelected ? '#10B981' : '#374151', // Green for selected, gray for others
        glowIntensity
      }
    })
  }, [nodes, getPhaseData])

  // Synthesis Phase Animation
  const animateSynthesis = useCallback((progress: number) => {
    const phaseData = getPhaseData('synthesis')
    const selectedEntityIds = new Set(phaseData?.entities?.map(e => e.id) || [])

    return nodes.map(node => {
      const isSelected = selectedEntityIds.has(node.id)

      if (isSelected) {
        // Selected nodes spiral toward center
        const angle = Date.now() * 0.002 + node.id.charCodeAt(0) * 0.1
        const radius = 100 * (1 - progress)
        const height = Math.sin(progress * Math.PI * 2) * 50

        return {
          ...node,
          fx: Math.cos(angle) * radius,
          fy: height,
          fz: Math.sin(angle) * radius,
          scale: 1.2 + (Math.sin(progress * Math.PI * 4) * 0.3), // Pulsing effect
          opacity: 1.0,
          color: '#F59E0B' // Amber for synthesis
        }
      }

      return {
        ...node,
        opacity: 0.1,
        scale: 0.5,
        color: '#1F2937'
      }
    })
  }, [nodes, getPhaseData])

  // Crystallization Phase Animation
  const animateCrystallization = useCallback((progress: number) => {
    const centerX = 0, centerY = 0, centerZ = 0
    const finalRadius = 30 * (1 - progress)

    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2
      const elevation = Math.sin(angle * 3) * 0.5

      return {
        ...node,
        fx: Math.cos(angle) * finalRadius,
        fy: elevation * finalRadius,
        fz: Math.sin(angle) * finalRadius,
        scale: 1.0 + (1 - progress) * 0.5,
        opacity: progress < 0.8 ? 1.0 : 1.0 - ((progress - 0.8) / 0.2) * 0.5,
        color: `hsl(${240 + index * 20}, 70%, ${50 + progress * 30}%)` // Color transition
      }
    })
  }, [nodes])

  const getAnimatedNodes = useCallback((phase: string, progress: number) => {
    switch (phase) {
      case 'explosion':
        return animateExplosion(progress)
      case 'filtering':
        return animateFiltering(progress)
      case 'synthesis':
        return animateSynthesis(progress)
      case 'crystallization':
        return animateCrystallization(progress)
      default:
        return nodes
    }
  }, [nodes, animateExplosion, animateFiltering, animateSynthesis, animateCrystallization])

  const getAnimatedLinks = useCallback((phase: string, progress: number) => {
    const phaseData = getPhaseData(phase)
    const activeRelationships = new Set(
      phaseData?.relationships?.map(rel => `${rel.source}-${rel.target}`) || []
    )

    return links.map(link => {
      const linkKey = `${typeof link.source === 'string' ? link.source : link.source.id}-${typeof link.target === 'string' ? link.target : link.target.id}`
      const isActive = activeRelationships.has(linkKey)

      switch (phase) {
        case 'explosion':
          return {
            ...link,
            opacity: 0.1 + (progress * 0.2),
            color: '#6B7280'
          }
        case 'filtering':
          return {
            ...link,
            opacity: isActive ? 0.8 : 0.1,
            color: isActive ? '#10B981' : '#374151',
            weight: isActive ? 2 : 1
          }
        case 'synthesis':
          return {
            ...link,
            opacity: isActive ? 1.0 : 0.05,
            color: isActive ? '#F59E0B' : '#1F2937',
            weight: isActive ? 3 : 1
          }
        case 'crystallization':
          return {
            ...link,
            opacity: 0.6 + (progress * 0.4),
            color: `hsl(${300 + progress * 60}, 70%, 60%)`,
            weight: 1 + progress
          }
        default:
          return link
      }
    })
  }, [links, getPhaseData])

  const animate = useCallback(() => {
    if (!isPlayingRef.current || !debugInfo) return

    const now = Date.now()
    if (!startTimeRef.current) startTimeRef.current = now

    const elapsed = (now - startTimeRef.current) * speedRef.current
    const currentPhase = currentPhaseRef.current
    const phaseInfo = debugInfo.animation_timeline.find(p => p.phase === currentPhase)

    if (!phaseInfo) return

    const phaseProgress = Math.min(elapsed / phaseInfo.duration, 1)

    // Update animation state
    callbacks?.onProgressUpdate?.(phaseProgress)

    // Get animated positions
    const animatedNodes = getAnimatedNodes(currentPhase, phaseProgress)
    const animatedLinks = getAnimatedLinks(currentPhase, phaseProgress)

    // Apply animations to actual nodes/links (this would be called by the 3D component)

    if (phaseProgress >= 1) {
      // Move to next phase
      const currentIndex = debugInfo.animation_timeline.findIndex(p => p.phase === currentPhase)
      const nextIndex = currentIndex + 1

      if (nextIndex < debugInfo.animation_timeline.length) {
        currentPhaseRef.current = debugInfo.animation_timeline[nextIndex].phase
        startTimeRef.current = now
        callbacks?.onPhaseChange?.(currentPhaseRef.current)
      } else {
        // Animation complete
        isPlayingRef.current = false
        callbacks?.onAnimationComplete?.()
        return
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [debugInfo, callbacks, getAnimatedNodes, getAnimatedLinks])

  const play = useCallback(() => {
    if (isPlayingRef.current) return

    isPlayingRef.current = true
    startTimeRef.current = 0
    animate()
  }, [animate])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    pause()
    currentPhaseRef.current = 'explosion'
    startTimeRef.current = 0
    callbacks?.onPhaseChange?.('explosion')
    callbacks?.onProgressUpdate?.(0)
  }, [pause, callbacks])

  const seekToPhase = useCallback((phase: string) => {
    pause()
    currentPhaseRef.current = phase
    startTimeRef.current = 0
    callbacks?.onPhaseChange?.(phase)
    callbacks?.onProgressUpdate?.(0)
  }, [pause, callbacks])

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    play,
    pause,
    reset,
    seekToPhase,
    setSpeed,
    getAnimatedNodes,
    getAnimatedLinks,
    currentPhase: currentPhaseRef.current,
    isPlaying: isPlayingRef.current
  }
}