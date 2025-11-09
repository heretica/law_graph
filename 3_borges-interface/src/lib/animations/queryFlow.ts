import type { DebugInfo } from '@/lib/services/reconciliation'

export interface AnimationPhaseConfig {
  name: string
  duration: number
  description: string
  nodeAnimation: (progress: number, nodes: any[], debugInfo?: DebugInfo) => any[]
  linkAnimation: (progress: number, links: any[], debugInfo?: DebugInfo) => any[]
  cameraPosition?: { x: number; y: number; z: number }
  effects?: {
    particles?: boolean
    glow?: boolean
    trails?: boolean
  }
}

// Animation utility functions
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

export const easeInOutBack = (t: number): number => {
  const c1 = 1.70158
  const c2 = c1 * 1.525
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
}

// Color utilities
export const interpolateColor = (color1: string, color2: string, t: number): string => {
  // Simple RGB interpolation
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')

  const r1 = parseInt(hex1.slice(0, 2), 16)
  const g1 = parseInt(hex1.slice(2, 4), 16)
  const b1 = parseInt(hex1.slice(4, 6), 16)

  const r2 = parseInt(hex2.slice(0, 2), 16)
  const g2 = parseInt(hex2.slice(2, 4), 16)
  const b2 = parseInt(hex2.slice(4, 6), 16)

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `rgb(${r}, ${g}, ${b})`
}

// Phase 1: Explosion - Everything bursts outward
export const explosionPhase: AnimationPhaseConfig = {
  name: 'explosion',
  duration: 2000,
  description: 'Analyzing all entities and communities',
  nodeAnimation: (progress, nodes, debugInfo) => {
    const easedProgress = easeOutElastic(progress)
    const explosionRadius = 200 + (easedProgress * 400)

    return nodes.map((node, index) => {
      // Create explosion pattern
      const angle = (index / nodes.length) * Math.PI * 2 + easedProgress * 0.5
      const elevation = Math.sin(index * 0.1) * Math.PI * 0.5
      const randomOffset = Math.random() * 100

      return {
        ...node,
        fx: Math.cos(angle) * (explosionRadius + randomOffset),
        fy: Math.sin(elevation) * (explosionRadius + randomOffset),
        fz: Math.sin(angle) * (explosionRadius + randomOffset),
        scale: 0.8 + easedProgress * 0.7,
        opacity: 0.4 + easedProgress * 0.4,
        color: interpolateColor('#6B7280', '#8B5CF6', easedProgress),
        __fx: Math.cos(angle) * (explosionRadius + randomOffset),
        __fy: Math.sin(elevation) * (explosionRadius + randomOffset),
        __fz: Math.sin(angle) * (explosionRadius + randomOffset)
      }
    })
  },
  linkAnimation: (progress, links) => {
    const easedProgress = easeInOutCubic(progress)

    return links.map(link => ({
      ...link,
      opacity: 0.1 + easedProgress * 0.3,
      color: '#6B7280',
      width: 1 + easedProgress * 0.5
    }))
  },
  cameraPosition: { x: 0, y: 0, z: 800 },
  effects: {
    particles: true,
    glow: false,
    trails: false
  }
}

// Phase 2: Filtering - Select relevant entities
export const filteringPhase: AnimationPhaseConfig = {
  name: 'filtering',
  duration: 3000,
  description: 'Selecting relevant knowledge',
  nodeAnimation: (progress, nodes, debugInfo) => {
    const easedProgress = easeInOutBack(progress)
    const selectedEntityIds = new Set(
      debugInfo?.processing_phases.entity_selection.entities?.map(e => e.id) || []
    )

    return nodes.map(node => {
      const isSelected = selectedEntityIds.has(node.id)
      const pulseIntensity = isSelected ? Math.sin(progress * Math.PI * 6) * 0.3 + 0.7 : 0

      if (isSelected) {
        // Selected nodes glow and move toward center
        const contractionFactor = easedProgress * 0.6
        return {
          ...node,
          fx: node.__fx ? node.__fx * (1 - contractionFactor) : node.x * (1 - contractionFactor),
          fy: node.__fy ? node.__fy * (1 - contractionFactor) : node.y * (1 - contractionFactor),
          fz: node.__fz ? node.__fz * (1 - contractionFactor) : node.z * (1 - contractionFactor),
          scale: 1.2 + pulseIntensity,
          opacity: 0.9 + pulseIntensity * 0.1,
          color: interpolateColor('#8B5CF6', '#10B981', easedProgress),
          glowIntensity: pulseIntensity
        }
      }

      // Non-selected nodes fade and shrink
      return {
        ...node,
        scale: 0.4 * (1 - easedProgress * 0.5),
        opacity: 0.2 * (1 - easedProgress * 0.7),
        color: '#374151'
      }
    })
  },
  linkAnimation: (progress, links, debugInfo) => {
    const easedProgress = easeInOutCubic(progress)
    const activeRelationships = new Set(
      debugInfo?.processing_phases.relationship_mapping.relationships?.map(
        rel => `${rel.source}-${rel.target}`
      ) || []
    )

    return links.map(link => {
      const linkKey = `${typeof link.source === 'object' ? link.source.id : link.source}-${typeof link.target === 'object' ? link.target.id : link.target}`
      const isActive = activeRelationships.has(linkKey)

      if (isActive) {
        return {
          ...link,
          opacity: 0.7 + easedProgress * 0.3,
          color: interpolateColor('#8B5CF6', '#10B981', easedProgress),
          width: 2 + easedProgress * 2
        }
      }

      return {
        ...link,
        opacity: 0.1 * (1 - easedProgress * 0.8),
        color: '#374151',
        width: 1
      }
    })
  },
  cameraPosition: { x: 0, y: 0, z: 600 },
  effects: {
    particles: true,
    glow: true,
    trails: false
  }
}

// Phase 3: Synthesis - Knowledge comes together
export const synthesisPhase: AnimationPhaseConfig = {
  name: 'synthesis',
  duration: 2000,
  description: 'Synthesizing information',
  nodeAnimation: (progress, nodes, debugInfo) => {
    const easedProgress = easeInOutCubic(progress)
    const selectedEntityIds = new Set(
      debugInfo?.processing_phases.entity_selection.entities?.map(e => e.id) || []
    )

    return nodes.map((node, index) => {
      const isSelected = selectedEntityIds.has(node.id)

      if (isSelected) {
        // Selected nodes spiral inward
        const spiralProgress = easedProgress
        const angle = index * 0.5 + spiralProgress * Math.PI * 4
        const radius = 150 * (1 - spiralProgress)
        const height = Math.sin(spiralProgress * Math.PI * 3) * 50

        return {
          ...node,
          fx: Math.cos(angle) * radius,
          fy: height,
          fz: Math.sin(angle) * radius,
          scale: 1.0 + Math.sin(spiralProgress * Math.PI * 8) * 0.4,
          opacity: 1.0,
          color: interpolateColor('#10B981', '#F59E0B', spiralProgress),
          rotation: angle
        }
      }

      return {
        ...node,
        opacity: 0.05,
        scale: 0.3,
        color: '#1F2937'
      }
    })
  },
  linkAnimation: (progress, links, debugInfo) => {
    const easedProgress = easeInOutCubic(progress)
    const activeRelationships = new Set(
      debugInfo?.processing_phases.relationship_mapping.relationships?.map(
        rel => `${rel.source}-${rel.target}`
      ) || []
    )

    return links.map(link => {
      const linkKey = `${typeof link.source === 'object' ? link.source.id : link.source}-${typeof link.target === 'object' ? link.target.id : link.target}`
      const isActive = activeRelationships.has(linkKey)

      if (isActive) {
        const pulseIntensity = Math.sin(progress * Math.PI * 8) * 0.3 + 0.7

        return {
          ...link,
          opacity: pulseIntensity,
          color: interpolateColor('#10B981', '#F59E0B', easedProgress),
          width: 2 + pulseIntensity * 2
        }
      }

      return {
        ...link,
        opacity: 0.02,
        color: '#1F2937',
        width: 1
      }
    })
  },
  cameraPosition: { x: 0, y: 100, z: 400 },
  effects: {
    particles: true,
    glow: true,
    trails: true
  }
}

// Phase 4: Crystallization - Final answer forms
export const crystallizationPhase: AnimationPhaseConfig = {
  name: 'crystallization',
  duration: 1000,
  description: 'Generating answer',
  nodeAnimation: (progress, nodes) => {
    const easedProgress = easeInOutCubic(progress)
    const centerRadius = 80 * (1 - easedProgress * 0.8)

    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2
      const elevation = Math.sin(angle * 3) * 0.3

      return {
        ...node,
        fx: Math.cos(angle) * centerRadius,
        fy: elevation * centerRadius,
        fz: Math.sin(angle) * centerRadius,
        scale: 1.0 + (1 - easedProgress) * 0.3,
        opacity: easedProgress < 0.9 ? 1.0 : 1.0 - ((easedProgress - 0.9) / 0.1) * 0.3,
        color: `hsl(${240 + index * 15 + easedProgress * 60}, 80%, ${60 + easedProgress * 20}%)`
      }
    })
  },
  linkAnimation: (progress, links) => {
    const easedProgress = easeInOutCubic(progress)

    return links.map((link, index) => ({
      ...link,
      opacity: 0.6 + easedProgress * 0.4,
      color: `hsl(${280 + index * 10 + easedProgress * 80}, 70%, 60%)`,
      width: 1 + easedProgress * 2
    }))
  },
  cameraPosition: { x: 0, y: 0, z: 300 },
  effects: {
    particles: true,
    glow: true,
    trails: false
  }
}

// Main animation configuration
export const queryFlowAnimation: AnimationPhaseConfig[] = [
  explosionPhase,
  filteringPhase,
  synthesisPhase,
  crystallizationPhase
]

export const getAnimationPhase = (phaseName: string): AnimationPhaseConfig | null => {
  return queryFlowAnimation.find(phase => phase.name === phaseName) || null
}

export const getTotalAnimationDuration = (): number => {
  return queryFlowAnimation.reduce((total, phase) => total + phase.duration, 0)
}