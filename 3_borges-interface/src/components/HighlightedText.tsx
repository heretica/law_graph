'use client'

import { useState } from 'react'

interface EntityMatch {
  id: string
  type: string
  color: string
  score: number
  description?: string
}

interface HighlightedTextProps {
  text: string
  entities: EntityMatch[]
  className?: string
  onEntityClick?: (entity: EntityMatch) => void
  showTooltip?: boolean
}

/**
 * Component that renders text with highlighted entity names using exact graph node colors
 * Enables end-to-end interpretability from RAG response to graph visualization
 */
export default function HighlightedText({
  text,
  entities,
  className = '',
  onEntityClick,
  showTooltip = true
}: HighlightedTextProps) {
  const [hoveredEntity, setHoveredEntity] = useState<EntityMatch | null>(null)
  const [pinnedEntity, setPinnedEntity] = useState<EntityMatch | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  console.log('🎨 HighlightedText render:', {
    text: text?.substring(0, 100) + '...',
    entitiesCount: entities?.length,
    entities: entities
  })

  /**
   * Get base colors for entity types (matching GraphHighlighter)
   */
  const getEntityBaseColor = (entityType: string): { r: number; g: number; b: number } => {
    const baseColors = {
      'Personnes': { r: 255, g: 107, b: 107 },
      'Lieux': { r: 78, g: 205, b: 196 },
      'Événements': { r: 69, g: 183, b: 209 },
      'Concepts': { r: 150, g: 206, b: 180 },
      'Organisations': { r: 254, g: 202, b: 87 },
      'Livres': { r: 255, g: 159, b: 243 },
      'default': { r: 168, g: 168, b: 168 }
    }
    return baseColors[entityType as keyof typeof baseColors] || baseColors.default
  }

  /**
   * Generate intelligence-based color (matching getIntelligenceColor from GraphHighlighter)
   */
  const getIntelligenceColor = (entityType: string, intelligenceScore: number): string => {
    const baseColor = getEntityBaseColor(entityType)

    // Match the GraphHighlighter logic
    const intensityMultiplier = 0.7 + (intelligenceScore * 0.6)
    const brightnessBoost = intelligenceScore * 50

    const r = Math.min(255, Math.floor(baseColor.r * intensityMultiplier + brightnessBoost))
    const g = Math.min(255, Math.floor(baseColor.g * intensityMultiplier + brightnessBoost))
    const b = Math.min(255, Math.floor(baseColor.b * intensityMultiplier + brightnessBoost))

    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * Create entity lookup for text highlighting - prioritizing meaningful words
   */
  const createEntityLookup = (): Map<string, EntityMatch> => {
    const lookup = new Map<string, EntityMatch>()

    // French stop words to exclude from matching
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'est', 'sont',
      'dans', 'sur', 'avec', 'pour', 'par', 'ce', 'cette', 'ces', 'son', 'sa', 'ses',
      'qui', 'que', 'dont', 'où', 'il', 'elle', 'ils', 'elles', 'nous', 'vous',
      'au', 'aux', 'se', 'ne', 'pas', 'plus', 'tout', 'tous', 'toute', 'toutes'
    ])

    entities.forEach(entity => {
      // Add direct entity ID (full name)
      const fullName = entity.id.toLowerCase()
      lookup.set(fullName, entity)

      // Add meaningful tokens only (avoid articles and prepositions)
      const meaningfulTokens = entity.id.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token =>
          token.length > 2 &&
          !stopWords.has(token) &&
          !/^(d|l|qu|n|m|t|s)$/.test(token) // Exclude French contractions
        )

      meaningfulTokens.forEach(token => {
        if (!lookup.has(token)) {
          lookup.set(token, entity)
        }
      })
    })

    return lookup
  }

  /**
   * Highlight entities in text with their graph node colors
   */
  const highlightEntities = (inputText: string): JSX.Element[] => {
    const entityLookup = createEntityLookup()
    const result: JSX.Element[] = []

    // Sort entities by length (longest first) for better matching
    const sortedPatterns = Array.from(entityLookup.keys()).sort((a, b) => b.length - a.length)

    // Create regex pattern that matches any entity name (case insensitive)
    // Sort patterns by length (longest first) to prioritize longer matches
    const patterns = sortedPatterns.map(pattern =>
      pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    )

    if (patterns.length === 0) {
      return [<span key={0}>{inputText}</span>]
    }

    // Use stricter word boundary matching to avoid partial matches
    const regex = new RegExp(`(?:^|\\s)(${patterns.join('|')})(?=\\s|$|[.,;:!?])`, 'gi')

    let lastIndex = 0
    let match
    let keyIndex = 0

    while ((match = regex.exec(inputText)) !== null) {
      const fullMatch = match[0]
      const entityMatch = match[1] // The captured group (actual entity)
      const matchStart = match.index
      const entityStart = matchStart + fullMatch.indexOf(entityMatch)
      const entityEnd = entityStart + entityMatch.length
      const matchEnd = regex.lastIndex

      // Add text before the match
      if (entityStart > lastIndex) {
        result.push(
          <span key={keyIndex++}>
            {inputText.slice(lastIndex, entityStart)}
          </span>
        )
      }

      // Find the entity for this match
      const entity = entityLookup.get(entityMatch.toLowerCase())

      if (entity) {
        const entityColor = entity.color || getIntelligenceColor(entity.type, entity.score)

        // Create highlighted span with exact graph colors
        result.push(
          <span
            key={keyIndex++}
            className="cursor-pointer border-b border-dotted transition-all duration-200 hover:bg-opacity-20"
            style={{
              color: entityColor,
              borderBottomColor: entityColor,
              backgroundColor: `${entityColor}15`, // 15 = ~8% opacity in hex
              padding: '1px 2px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => {
              if (showTooltip) {
                setHoveredEntity(entity)
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltipPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 8
                })
              }
            }}
            onMouseLeave={() => {
              if (!pinnedEntity || pinnedEntity.id !== entity.id) {
                setHoveredEntity(null)
              }
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (pinnedEntity?.id === entity.id) {
                // Unpin if clicking the same entity
                setPinnedEntity(null)
                setHoveredEntity(null)
              } else {
                // Pin the new entity
                setPinnedEntity(entity)
                setHoveredEntity(entity)
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltipPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 8
                })
              }
              onEntityClick?.(entity)
            }}
            title={showTooltip ? `${entity.type}: ${entity.id}` : undefined}
          >
            {entityMatch}
          </span>
        )
      } else {
        // Shouldn't happen, but fallback
        result.push(<span key={keyIndex++}>{entityMatch}</span>)
      }

      lastIndex = entityEnd
    }

    // Add remaining text
    if (lastIndex < inputText.length) {
      result.push(
        <span key={keyIndex++}>
          {inputText.slice(lastIndex)}
        </span>
      )
    }

    return result
  }

  return (
    <div className={`relative ${className}`}>
      <div className="text-sm leading-relaxed">
        {highlightEntities(text)}
      </div>

      {/* Entity Tooltip */}
      {showTooltip && (hoveredEntity || pinnedEntity) && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg text-xs shadow-lg"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 125, window.innerWidth - 260)),
            top: tooltipPosition.y - 15,
            transform: 'translateY(-100%)',
            width: '250px',
            maxHeight: '150px',
          }}
          onMouseEnter={() => {
            // Keep tooltip visible when hovering over it
          }}
          onMouseLeave={() => {
            if (!pinnedEntity) {
              setHoveredEntity(null)
            }
          }}
        >
          <div className="p-3 overflow-y-auto max-h-36">
            <div className="text-white font-medium mb-1 break-words">{(pinnedEntity || hoveredEntity)?.id}</div>
            <div className="text-gray-300 mb-1">Type: {(pinnedEntity || hoveredEntity)?.type}</div>
            <div className="text-gray-300 mb-2">Score: {(pinnedEntity || hoveredEntity)?.score?.toFixed(2)}</div>
            {(pinnedEntity || hoveredEntity)?.description && (
              <div className="text-gray-400 mb-2 text-xs leading-relaxed">
                {(pinnedEntity || hoveredEntity)?.description}
              </div>
            )}
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2 border border-gray-500 flex-shrink-0"
                style={{ backgroundColor: (pinnedEntity || hoveredEntity)?.color }}
              />
              <span className="text-gray-400 text-xs">Graph node color</span>
              {pinnedEntity && (
                <span className="ml-2 text-xs text-yellow-400">📌 Épinglé</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entity Legend */}
      {entities.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Entités référencées:</div>
          <div className="flex flex-wrap gap-2">
            {entities.slice(0, 8).map((entity, index) => {
              const entityColor = entity.color || getIntelligenceColor(entity.type, entity.score)
              return (
                <div
                  key={index}
                  className="flex items-center text-xs cursor-pointer hover:bg-gray-800 rounded px-2 py-1"
                  onClick={() => onEntityClick?.(entity)}
                  title={`${entity.type}: ${entity.id}`}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1.5 border border-gray-600"
                    style={{ backgroundColor: entityColor }}
                  />
                  <span style={{ color: entityColor }} className="font-medium">
                    {entity.id.length > 15 ? entity.id.substring(0, 15) + '...' : entity.id}
                  </span>
                </div>
              )
            })}
            {entities.length > 8 && (
              <div className="text-xs text-gray-500 px-2 py-1">
                +{entities.length - 8} autres
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}