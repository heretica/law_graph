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
      className={`fixed rounded-lg text-xs shadow-2xl ${
        isLocked ? 'border-4 border-yellow-400 bg-black' : 'border-2 border-red-500 bg-black'
      }`}
      style={{
        left: Math.max(10, Math.min(position.x - 175, window.innerWidth - 360)),
        top: position.y - 20,
        transform: 'translateY(-100%)',
        width: expanded ? '400px' : '350px',
        maxHeight: expanded ? '500px' : '280px',
        transition: 'all 0.2s ease-in-out',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
      }}
      onMouseEnter={() => onTooltipHover?.(true)}
      onMouseLeave={() => onTooltipHover?.(false)}
    >
      {/* Header with relationship info */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-medium">
            🔗 Relation: {relationship.relation}
          </div>
          <div className="flex items-center gap-2">
            {isLocked && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400 text-xs">🔒 Verrouillé</span>
              </div>
            )}
            {hasGraphMLEnrichment && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-green-400 text-xs">GraphML</span>
              </div>
            )}
          </div>
        </div>

        {/* Source → Target */}
        <div className="text-gray-300 text-xs">
          <span className="text-blue-300">{sourceNodeLabel || relationship.source}</span>
          <span className="mx-2 text-gray-500">→</span>
          <span className="text-purple-300">{targetNodeLabel || relationship.target}</span>
        </div>

        {/* Confidence and weight */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="text-gray-400">
            Confiance: <span className={confidenceScore > 0.7 ? 'text-green-400' : confidenceScore > 0.5 ? 'text-yellow-400' : 'text-red-400'}>
              {(confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-gray-400">
            Poids: <span className="text-white">{graphMLWeight.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-3 space-y-3">
        {/* Description */}
        <div>
          <div className="text-gray-400 text-xs mb-1">Description</div>
          <div className="text-white text-xs leading-relaxed">
            {graphMLDescription || baseDescription || 'Relation détectée par GraphRAG'}
          </div>
        </div>

        {/* Source traceability (GraphML chunks) */}
        {sourceChunks && (
          <div>
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1 justify-between">
              <div className="flex items-center gap-1">
                📚 Source textuelle
                {bookId && <span className="text-borges-accent">({bookId})</span>}
              </div>
              {onNavigateToSource && (
                <button
                  onClick={() => onNavigateToSource(sourceChunks, bookId)}
                  className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded border border-blue-500/30 transition-all hover:bg-blue-900/50 flex items-center gap-1"
                  title="Aller à la source dans le livre"
                >
                  🔗 Source
                </button>
              )}
            </div>
            <div className="text-gray-300 text-xs leading-relaxed bg-gray-800 p-2 rounded border-l-2 border-borges-accent">
              {expanded ? sourceChunks : sourcePreview}
              {sourceChunks.length > 120 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-borges-accent hover:text-borges-accent-light ml-2 underline"
                >
                  {expanded ? 'Réduire' : 'Lire plus'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing pipeline info */}
        <div className="border-t border-gray-700 pt-2">
          <div className="text-gray-400 text-xs mb-1">Pipeline de traitement</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-blue-900 text-blue-200 px-2 py-1 rounded">
              GraphRAG
            </div>
            {hasGraphMLEnrichment && (
              <div className="bg-green-900 text-green-200 px-2 py-1 rounded">
                GraphML (#{graphMLOrder})
              </div>
            )}
            <div className="bg-purple-900 text-purple-200 px-2 py-1 rounded">
              Neo4j
            </div>
            <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded">
              3D Viz
            </div>
          </div>
        </div>

        {/* Metadata details (when expanded) */}
        {expanded && hasGraphMLEnrichment && (
          <div className="border-t border-gray-700 pt-2">
            <div className="text-gray-400 text-xs mb-2">Métadonnées GraphML</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Ordre GraphML:</span>
                <span className="text-white">{graphMLOrder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Poids GraphML:</span>
                <span className="text-white">{graphMLWeight.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ordre traversal:</span>
                <span className="text-white">{'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action hints */}
        <div className="border-t border-gray-700 pt-2 text-xs text-gray-500">
          {sourceChunks && onNavigateToSource && (
            <div>🔗 Bouton &quot;Source&quot; pour naviguer vers le texte original</div>
          )}
          {sourceChunks && !onNavigateToSource && (
            <div>💡 Double-clic pour explorer le contexte source</div>
          )}
          <div>🔒 Clic sur relation pour {isLocked ? 'déverrouiller' : 'verrouiller'} le tooltip</div>
          <div>🔍 Clic pour sélectionner les nœuds liés</div>
        </div>
      </div>
    </div>
  )
}