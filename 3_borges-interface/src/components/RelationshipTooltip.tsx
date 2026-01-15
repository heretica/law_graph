'use client'

import { useState, useEffect } from 'react'

interface Link3DMetadata {
  id: string
  source: string
  target: string
  relation: string
  weight: number
  // GraphML enriched metadata
  graphml_weight?: number
  graphml_description?: string
  graphml_source_chunks?: string
  graphml_order?: number
  has_graphml_metadata?: boolean
  // Relationship properties for full traceability
  properties?: {
    description?: string
    traversal_order?: number
    graphml_weight?: number
    graphml_description?: string
    graphml_source_chunks?: string
    graphml_order?: number
    has_graphml_metadata?: boolean
  }
}

interface RelationshipTooltipProps {
  relationship: Link3DMetadata | null
  position: { x: number; y: number }
  visible: boolean
  sourceNodeLabel?: string
  targetNodeLabel?: string
  bookId?: string
  isLocked?: boolean
  onNavigateToSource?: (sourceChunks: string, bookId?: string) => void
  onTooltipHover?: (isHovered: boolean) => void
}

/**
 * Composant de tooltip pour les relations 3D avec traçabilité complète GraphML
 * Intégré directement dans le graphe sans UI supplémentaire
 * Principe d'interprétabilité de bout en bout : de la source textuelle à la visualisation
 */
export default function RelationshipTooltip({
  relationship,
  position,
  visible,
  sourceNodeLabel,
  targetNodeLabel,
  bookId,
  isLocked = false,
  onNavigateToSource,
  onTooltipHover
}: RelationshipTooltipProps) {
  const [expanded, setExpanded] = useState(false)

  // Reset expanded state when relationship changes
  useEffect(() => {
    setExpanded(false)
  }, [relationship?.id])

  // Debug logging
  useEffect(() => {
    console.log('🛠️ RelationshipTooltip render:', {
      visible,
      relationship: relationship?.id,
      position,
      hasGraphML: relationship?.properties?.has_graphml_metadata || relationship?.has_graphml_metadata
    })
  }, [visible, relationship, position])

  if (!visible || !relationship) {
    console.log('🚫 RelationshipTooltip hidden:', { visible, hasRelationship: !!relationship, relationship: relationship?.id })
    return null
  }

  console.log('✅ RelationshipTooltip ABOUT TO RENDER:', {
    visible,
    relationshipId: relationship?.id,
    position,
    hasMetadata: relationship?.properties?.has_graphml_metadata || relationship?.has_graphml_metadata
  })

  // Extract metadata from relationship or properties
  const metadata = relationship.properties || relationship
  const hasGraphMLEnrichment = metadata.has_graphml_metadata || false
  const sourceChunks = metadata.graphml_source_chunks || ''
  const graphMLDescription = metadata.graphml_description || ''
  const graphMLOrder = metadata.graphml_order || 0
  const graphMLWeight = metadata.graphml_weight || 0
  const baseDescription = relationship.relation

  // Calculate confidence based on metadata richness
  const confidenceScore = hasGraphMLEnrichment ?
    Math.min(0.9, 0.4 + (sourceChunks.length > 0 ? 0.3 : 0) + (graphMLDescription.length > 0 ? 0.2 : 0)) : 0.3

  // Truncate source chunks for preview
  const sourcePreview = sourceChunks ? sourceChunks.substring(0, 120) + (sourceChunks.length > 120 ? '...' : '') : ''

  console.log('✅ RelationshipTooltip RENDERING:', {
    id: relationship.id,
    position,
    hasGraphML: metadata.has_graphml_metadata,
    description: metadata.graphml_description
  })

  return (
    <div
      className={`fixed rounded-lg text-xs shadow-lg ${
        isLocked ? 'border-2 border-datack-yellow' : 'border border-datack-border'
      }`}
      style={{
        left: Math.max(10, Math.min(position.x - 175, window.innerWidth - 360)),
        top: position.y - 20,
        transform: 'translateY(-100%)',
        width: expanded ? '400px' : '350px',
        maxHeight: expanded ? '500px' : '280px',
        transition: 'all 0.2s ease-in-out',
        zIndex: 99999,
        backgroundColor: 'var(--datack-panel)',
      }}
      onMouseEnter={() => onTooltipHover?.(true)}
      onMouseLeave={() => onTooltipHover?.(false)}
    >
      {/* Header with relationship info - Basile Minimalism */}
      <div className="p-3 border-b border-datack-border">
        <div className="flex items-center justify-between mb-2">
          <div className="text-datack-light font-medium">
            Relation: {relationship.relation}
          </div>
          <div className="flex items-center gap-2">
            {isLocked && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-datack-yellow rounded-full" />
                <span className="text-datack-yellow text-xs">Locked</span>
              </div>
            )}
            {hasGraphMLEnrichment && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-datack-muted rounded-full" />
                <span className="text-datack-light-muted text-xs">GraphML</span>
              </div>
            )}
          </div>
        </div>

        {/* Source → Target */}
        <div className="text-datack-light-muted text-xs">
          <span className="text-datack-light">{sourceNodeLabel || relationship.source}</span>
          <span className="mx-2 text-datack-muted">→</span>
          <span className="text-datack-light">{targetNodeLabel || relationship.target}</span>
        </div>

        {/* Confidence and weight */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="text-datack-muted">
            Confidence: <span className={confidenceScore > 0.7 ? 'text-datack-yellow' : 'text-datack-light-muted'}>
              {(confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-datack-muted">
            Weight: <span className="text-datack-light">{graphMLWeight.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main content - Basile Minimalism */}
      <div className="p-3 space-y-3">
        {/* Description */}
        <div>
          <div className="text-datack-muted text-xs mb-1">Description</div>
          <div className="text-datack-light text-xs leading-relaxed">
            {graphMLDescription || baseDescription || 'Relationship detected by GraphRAG'}
          </div>
        </div>

        {/* Source traceability (GraphML chunks) */}
        {sourceChunks && (
          <div>
            <div className="text-datack-muted text-xs mb-1 flex items-center gap-1 justify-between">
              <div className="flex items-center gap-1">
                Source text
                {bookId && <span className="text-datack-yellow">({bookId})</span>}
              </div>
              {onNavigateToSource && (
                <button
                  onClick={() => onNavigateToSource(sourceChunks, bookId)}
                  className="datack-btn-ghost text-xs px-2 py-1 bg-datack-black rounded border border-datack-border hover:border-datack-yellow transition-all"
                  title="Navigate to source in book"
                >
                  View Source
                </button>
              )}
            </div>
            <div className="text-datack-light-muted text-xs leading-relaxed bg-datack-black p-2 rounded border-l-2 border-datack-yellow">
              {expanded ? sourceChunks : sourcePreview}
              {sourceChunks.length > 120 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-datack-yellow hover:text-datack-light ml-2 underline"
                >
                  {expanded ? 'Collapse' : 'Read more'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing pipeline info */}
        <div className="border-t border-datack-border pt-2">
          <div className="text-datack-muted text-xs mb-1">Processing pipeline</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-datack-black text-datack-light px-2 py-1 rounded">
              GraphRAG
            </div>
            {hasGraphMLEnrichment && (
              <div className="bg-datack-black text-datack-light-muted px-2 py-1 rounded">
                GraphML (#{graphMLOrder})
              </div>
            )}
            <div className="bg-datack-black text-datack-light px-2 py-1 rounded">
              Neo4j
            </div>
            <div className="bg-datack-black text-datack-yellow px-2 py-1 rounded">
              3D Viz
            </div>
          </div>
        </div>

        {/* Metadata details (when expanded) */}
        {expanded && hasGraphMLEnrichment && (
          <div className="border-t border-datack-border pt-2">
            <div className="text-datack-muted text-xs mb-2">GraphML Metadata</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-datack-muted">GraphML Order:</span>
                <span className="text-datack-light">{graphMLOrder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-datack-muted">GraphML Weight:</span>
                <span className="text-datack-light">{graphMLWeight.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-datack-muted">Traversal Order:</span>
                <span className="text-datack-light">{'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action hints - Basile Minimalism: no emoji */}
        <div className="border-t border-datack-border pt-2 text-xs text-datack-muted">
          {sourceChunks && onNavigateToSource && (
            <div>Use &quot;View Source&quot; to navigate to original text</div>
          )}
          {sourceChunks && !onNavigateToSource && (
            <div>Double-click to explore source context</div>
          )}
          <div>Click relationship to {isLocked ? 'unlock' : 'lock'} tooltip</div>
          <div>Click to select linked nodes</div>
        </div>
      </div>
    </div>
  )
}