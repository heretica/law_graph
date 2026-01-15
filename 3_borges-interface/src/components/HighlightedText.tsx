'use client'

import { useState, useMemo } from 'react'

interface EntityMatch {
  id: string
  type: string
  color: string
  score: number
  description?: string
}

interface RelationshipMatch {
  source: string
  target: string
  type: string
  description?: string
}

interface HighlightedTextProps {
  text: string
  entities: EntityMatch[]
  relationships?: RelationshipMatch[]
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
  relationships = [],
  className = '',
  onEntityClick,
  showTooltip = true
}: HighlightedTextProps) {
  const [hoveredEntity, setHoveredEntity] = useState<EntityMatch | null>(null)
  const [pinnedEntity, setPinnedEntity] = useState<EntityMatch | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Build relationship lookup for quick access
  const entityRelationships = useMemo(() => {
    const lookup = new Map<string, { incoming: RelationshipMatch[], outgoing: RelationshipMatch[] }>()

    relationships.forEach(rel => {
      // Outgoing from source
      if (!lookup.has(rel.source.toLowerCase())) {
        lookup.set(rel.source.toLowerCase(), { incoming: [], outgoing: [] })
      }
      lookup.get(rel.source.toLowerCase())!.outgoing.push(rel)

      // Incoming to target
      if (!lookup.has(rel.target.toLowerCase())) {
        lookup.set(rel.target.toLowerCase(), { incoming: [], outgoing: [] })
      }
      lookup.get(rel.target.toLowerCase())!.incoming.push(rel)
    })

    return lookup
  }, [relationships])

  // Get relationships for a specific entity
  const getEntityRelationships = (entityId: string) => {
    return entityRelationships.get(entityId.toLowerCase()) || { incoming: [], outgoing: [] }
  }

  // Debug logging - DISABLED to fix freeze (was executing during render phase)
  // console.log('🎨 HighlightedText render:', {
  //   text: text?.substring(0, 100) + '...',
  //   entitiesCount: entities?.length,
  //   entities: entities
  // })

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

  // Memoized entity lookup - computed once when entities change
  // Performance fix: Previously called on every line of text, now computed once per render
  const entityLookup = useMemo(() => {
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
  }, [entities])

  // Memoized regex pattern - computed once when entities change
  // Performance fix: Regex compilation is expensive, now done once per render
  const entityRegex = useMemo(() => {
    if (entityLookup.size === 0) return null

    const sortedPatterns = Array.from(entityLookup.keys()).sort((a, b) => b.length - a.length)
    const patterns = sortedPatterns.map(pattern =>
      pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )

    if (patterns.length === 0) return null
    return new RegExp(`(?:^|\\s)(${patterns.join('|')})(?=\\s|$|[.,;:!?])`, 'gi')
  }, [entityLookup])

  /**
   * Render markdown-formatted text as professional nano-reports
   * Enhanced styling for h1/h2/h3 headers, lists, and blockquotes
   */
  const renderMarkdown = (inputText: string): JSX.Element[] => {
    const lines = inputText.split('\n')
    const result: JSX.Element[] = []
    let inList = false
    let listItems: JSX.Element[] = []

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        result.push(
          <ul key={key} className="space-y-1.5 my-3 ml-1">
            {listItems}
          </ul>
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, lineIndex) => {
      // Trim line for matching but keep original for display
      const trimmedLine = line.trim()

      // Handle headers - check longer patterns first (#### before ### before ## before #)
      const h4Match = trimmedLine.match(/^####\s*(.+)$/)
      const h3Match = trimmedLine.match(/^###\s*(.+)$/)
      const h2Match = trimmedLine.match(/^##\s*(.+)$/)
      const h1Match = trimmedLine.match(/^#\s*(.+)$/)
      const listMatch = trimmedLine.match(/^[-*]\s+(.+)$/)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/)
      const blockquoteMatch = trimmedLine.match(/^>\s*(.+)$/)

      // Flush list if we hit a non-list item
      if (!listMatch && !numberedListMatch && inList) {
        flushList(`list-${lineIndex}`)
      }

      if (h4Match) {
        result.push(
          <h4 key={`h4-${lineIndex}`} className="text-sm font-semibold text-datack-light mt-4 mb-2">
            <span className="inline-block w-1 h-3 bg-datack-yellow/60 rounded-full mr-2 align-middle"></span>
            <span className="align-middle">{highlightEntitiesInLine(h4Match[1])}</span>
          </h4>
        )
      } else if (h3Match) {
        result.push(
          <h3 key={`h3-${lineIndex}`} className="text-base font-semibold text-datack-light mt-5 mb-2">
            <span className="inline-block w-1.5 h-4 bg-datack-yellow/70 rounded-full mr-2 align-middle"></span>
            <span className="align-middle">{highlightEntitiesInLine(h3Match[1])}</span>
          </h3>
        )
      } else if (h2Match) {
        result.push(
          <h2 key={`h2-${lineIndex}`} className="text-lg font-bold text-datack-light mt-6 mb-3 pb-2 border-b border-datack-yellow/30">
            <span className="inline-block w-2 h-5 bg-datack-yellow rounded-sm mr-2 align-middle"></span>
            <span className="align-middle">{highlightEntitiesInLine(h2Match[1])}</span>
          </h2>
        )
      } else if (h1Match) {
        result.push(
          <h1 key={`h1-${lineIndex}`} className="text-xl font-bold text-datack-light mt-6 mb-4 pb-3 border-b-2 border-datack-yellow">
            <span className="text-datack-yellow text-xl mr-2">◆</span>
            <span>{highlightEntitiesInLine(h1Match[1])}</span>
          </h1>
        )
      } else if (blockquoteMatch) {
        result.push(
          <blockquote key={`bq-${lineIndex}`} className="border-l-3 border-datack-yellow/50 pl-4 py-2 my-3 bg-datack-dark/30 rounded-r-md italic text-datack-gray">
            {highlightEntitiesInLine(blockquoteMatch[1])}
          </blockquote>
        )
      } else if (
        // Detect commune names: Capitalized French place names on their own line
        // Pattern: starts with capital, may have hyphens/apostrophes, no punctuation at end
        !trimmedLine.includes(':') &&
        !trimmedLine.endsWith('.') &&
        !trimmedLine.endsWith(',') &&
        trimmedLine.length > 2 &&
        trimmedLine.length < 50 &&
        /^[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'\s][A-Za-zÀ-ÿ]+)*$/.test(trimmedLine)
      ) {
        // Flush any pending list before the commune header
        flushList(`list-before-commune-${lineIndex}`)

        // Render as commune section header
        result.push(
          <div
            key={`commune-${lineIndex}`}
            className="mt-5 mb-2 font-semibold text-datack-light border-l-2 border-datack-yellow/50 pl-3 py-1 bg-datack-dark/20 rounded-r"
          >
            <span className="text-datack-yellow mr-2">🏘</span>
            {highlightEntitiesInLine(trimmedLine)}
          </div>
        )
      } else if (listMatch) {
        inList = true
        listItems.push(
          <li key={`li-${lineIndex}`} className="flex items-start gap-2 text-datack-gray">
            <span className="text-datack-yellow mt-1.5 text-xs">●</span>
            <span className="flex-1">{highlightEntitiesInLine(listMatch[1])}</span>
          </li>
        )
      } else if (numberedListMatch) {
        inList = true
        listItems.push(
          <li key={`nli-${lineIndex}`} className="flex items-start gap-2 text-datack-gray">
            <span className="text-datack-yellow font-semibold min-w-[1.5rem]">{numberedListMatch[1]}.</span>
            <span className="flex-1">{highlightEntitiesInLine(numberedListMatch[2])}</span>
          </li>
        )
      } else if (trimmedLine === '') {
        result.push(<div key={`br-${lineIndex}`} className="h-3" />)
      } else {
        result.push(
          <p key={`p-${lineIndex}`} className="text-datack-gray mb-2.5 leading-relaxed">
            {highlightEntitiesInLine(trimmedLine)}
          </p>
        )
      }
    })

    // Flush any remaining list items
    if (listItems.length > 0) {
      result.push(
        <ul key="list-final" className="space-y-1.5 my-3 ml-1">
          {listItems}
        </ul>
      )
    }

    return result
  }

  /**
   * Highlight entities in a single line of text
   * Uses memoized entityLookup and entityRegex for performance
   */
  const highlightEntitiesInLine = (inputText: string): JSX.Element[] => {
    const result: JSX.Element[] = []

    // Use memoized regex - if no entities, just render plain text
    if (!entityRegex) {
      return [<span key={0}>{renderInlineMarkdown(inputText)}</span>]
    }

    // Reset regex lastIndex to avoid issues with global flag
    const regex = new RegExp(entityRegex.source, entityRegex.flags)

    let lastIndex = 0
    let match
    let keyIndex = 0

    while ((match = regex.exec(inputText)) !== null) {
      const fullMatch = match[0]
      const entityMatch = match[1]
      const matchStart = match.index
      const entityStart = matchStart + fullMatch.indexOf(entityMatch)
      const entityEnd = entityStart + entityMatch.length

      if (entityStart > lastIndex) {
        result.push(
          <span key={keyIndex++}>
            {renderInlineMarkdown(inputText.slice(lastIndex, entityStart))}
          </span>
        )
      }

      const entity = entityLookup.get(entityMatch.toLowerCase())

      if (entity) {
        const entityColor = entity.color || getIntelligenceColor(entity.type, entity.score)

        result.push(
          <span
            key={keyIndex++}
            className="cursor-pointer transition-all duration-200 hover:opacity-80"
            style={{
              color: entityColor, // Use entity color from graph (sync with node colors)
              backgroundColor: '#0a0a0a', // Black fill
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 500
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
                setPinnedEntity(null)
                setHoveredEntity(null)
              } else {
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
        result.push(<span key={keyIndex++}>{entityMatch}</span>)
      }

      lastIndex = entityEnd
    }

    if (lastIndex < inputText.length) {
      result.push(
        <span key={keyIndex++}>
          {renderInlineMarkdown(inputText.slice(lastIndex))}
        </span>
      )
    }

    return result
  }

  /**
   * Render inline markdown (bold, italic)
   */
  const renderInlineMarkdown = (text: string): JSX.Element | string => {
    // Handle **bold** and *italic*
    const parts: JSX.Element[] = []
    let remaining = text
    let keyIdx = 0

    // Simple regex for bold
    const boldRegex = /\*\*(.+?)\*\*/g
    let lastIdx = 0
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={keyIdx++}>{text.slice(lastIdx, match.index)}</span>)
      }
      parts.push(<strong key={keyIdx++} className="font-semibold text-datack-light">{match[1]}</strong>)
      lastIdx = match.index + match[0].length
    }

    if (parts.length === 0) {
      return text
    }

    if (lastIdx < text.length) {
      parts.push(<span key={keyIdx++}>{text.slice(lastIdx)}</span>)
    }

    return <>{parts}</>
  }

  /**
   * Highlight entities in text with their graph node colors
   */
  const highlightEntities = (inputText: string): JSX.Element[] => {
    // Use markdown rendering which includes entity highlighting
    return renderMarkdown(inputText)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="text-sm leading-relaxed">
        {highlightEntities(text)}
      </div>

      {/* Entity Tooltip with Relationships - Enhanced for Provenance */}
      {showTooltip && (hoveredEntity || pinnedEntity) && (() => {
        const activeEntity = pinnedEntity || hoveredEntity
        const rels = activeEntity ? getEntityRelationships(activeEntity.id) : { incoming: [], outgoing: [] }
        const hasRelationships = rels.incoming.length > 0 || rels.outgoing.length > 0

        return (
          <div
            className="fixed z-50 bg-datack-secondary border border-datack-border rounded-datack-md text-xs shadow-datack-lg"
            style={{
              left: Math.max(10, Math.min(tooltipPosition.x - 150, window.innerWidth - 320)),
              top: tooltipPosition.y - 15,
              transform: 'translateY(-100%)',
              width: '300px',
              maxHeight: hasRelationships ? '280px' : '150px',
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
            <div className="p-3 overflow-y-auto" style={{ maxHeight: hasRelationships ? '270px' : '140px' }}>
              {/* Entity Header */}
              <div className="flex items-start gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 border border-datack-border"
                  style={{ backgroundColor: activeEntity?.color || '#dbff3b' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-datack-light font-medium break-words">{activeEntity?.id}</div>
                  <div className="text-datack-muted text-xs">
                    {activeEntity?.type} • Score: {activeEntity?.score?.toFixed(2)}
                  </div>
                </div>
                {pinnedEntity && (
                  <span className="text-xs text-datack-yellow bg-datack-yellow/10 px-1.5 py-0.5 rounded">📌</span>
                )}
              </div>

              {/* Description */}
              {activeEntity?.description && (
                <div className="text-datack-gray mb-3 text-xs leading-relaxed border-l-2 border-datack-border pl-2">
                  {activeEntity.description}
                </div>
              )}

              {/* Relationships Section */}
              {hasRelationships && (
                <div className="border-t border-datack-border pt-2 mt-2">
                  <div className="text-datack-muted text-xs font-medium mb-2 flex items-center gap-1">
                    <span>🔗</span> Connexions dans le sous-graphe
                  </div>

                  {/* Outgoing relationships */}
                  {rels.outgoing.length > 0 && (
                    <div className="mb-2">
                      <div className="text-datack-muted text-xs mb-1">→ Vers:</div>
                      <div className="space-y-1 ml-2">
                        {rels.outgoing.slice(0, 3).map((rel, i) => (
                          <div key={`out-${i}`} className="flex items-center gap-1.5 text-xs">
                            <span className="text-datack-yellow font-medium">{rel.type}</span>
                            <span className="text-datack-gray">→</span>
                            <span className="text-datack-light truncate">{rel.target}</span>
                          </div>
                        ))}
                        {rels.outgoing.length > 3 && (
                          <div className="text-datack-muted text-xs">+{rels.outgoing.length - 3} autres...</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Incoming relationships */}
                  {rels.incoming.length > 0 && (
                    <div>
                      <div className="text-datack-muted text-xs mb-1">← Depuis:</div>
                      <div className="space-y-1 ml-2">
                        {rels.incoming.slice(0, 3).map((rel, i) => (
                          <div key={`in-${i}`} className="flex items-center gap-1.5 text-xs">
                            <span className="text-datack-light truncate">{rel.source}</span>
                            <span className="text-datack-gray">→</span>
                            <span className="text-datack-yellow font-medium">{rel.type}</span>
                          </div>
                        ))}
                        {rels.incoming.length > 3 && (
                          <div className="text-datack-muted text-xs">+{rels.incoming.length - 3} autres...</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Provenance Summary - Entities & Relationships */}
      {(entities.length > 0 || relationships.length > 0) && (
        <div className="mt-4 pt-3 border-t border-datack-border space-y-3">
          {/* Graph Statistics */}
          <div className="flex items-center gap-4 text-xs text-datack-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-datack-yellow"></span>
              <span>{entities.length} entités</span>
            </div>
            {relationships.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>🔗</span>
                <span>{relationships.length} relations</span>
              </div>
            )}
          </div>

          {/* Entity Pills */}
          <div>
            <div className="text-xs text-datack-muted mb-2">Entités référencées:</div>
            <div className="flex flex-wrap gap-1.5">
              {entities.slice(0, 10).map((entity, index) => {
                const rels = getEntityRelationships(entity.id)
                const connectionCount = rels.incoming.length + rels.outgoing.length
                return (
                  <div
                    key={index}
                    className="flex items-center text-xs cursor-pointer hover:bg-datack-dark rounded-datack-sm px-2 py-1 bg-[#0a0a0a] border border-datack-border/50 transition-all hover:border-datack-yellow/50"
                    onClick={() => onEntityClick?.(entity)}
                    title={`${entity.type}: ${entity.id}${connectionCount > 0 ? ` (${connectionCount} connexions)` : ''}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                      style={{ backgroundColor: entity.color || '#dbff3b' }}
                    />
                    <span style={{ color: entity.color || '#dbff3b' }} className="font-medium truncate max-w-[120px]">
                      {entity.id}
                    </span>
                    {connectionCount > 0 && (
                      <span className="ml-1 text-datack-muted text-xs">({connectionCount})</span>
                    )}
                  </div>
                )
              })}
              {entities.length > 10 && (
                <div className="text-xs text-datack-muted px-2 py-1">
                  +{entities.length - 10} autres
                </div>
              )}
            </div>
          </div>

          {/* Relationship Types Summary */}
          {relationships.length > 0 && (
            <div>
              <div className="text-xs text-datack-muted mb-2">Types de relations:</div>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const typeCounts = new Map<string, number>()
                  relationships.forEach(rel => {
                    typeCounts.set(rel.type, (typeCounts.get(rel.type) || 0) + 1)
                  })
                  return Array.from(typeCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([type, count], i) => (
                      <div
                        key={i}
                        className="text-xs px-2 py-1 bg-datack-dark border border-datack-border rounded-datack-sm"
                      >
                        <span className="text-datack-yellow font-medium">{type}</span>
                        <span className="text-datack-muted ml-1">×{count}</span>
                      </div>
                    ))
                })()}
                {(() => {
                  const uniqueTypes = new Set(relationships.map(r => r.type))
                  return uniqueTypes.size > 6 ? (
                    <div className="text-xs text-datack-muted px-2 py-1">
                      +{uniqueTypes.size - 6} autres
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}