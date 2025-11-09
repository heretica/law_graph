'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  label?: string
  type?: string
  degree?: number
  centrality_score?: number
  name?: string
  color?: string
}

interface Link {
  source: string | number
  target: string | number
  type?: string
  relation?: string
}

interface ReconciliationData {
  nodes: Array<{
    id: string
    labels: string[]
    properties: Record<string, any>
    degree: number
    centrality_score: number
  }>
  relationships: Array<{
    id: string
    type: string
    source: string
    target: string
    properties: Record<string, any>
  }>
}

interface DebugEntity {
  id: string
  name: string
  type: string
  rank: number
  score: number
}

interface DebugCommunity {
  id: string
  title: string
  relevance: number
}

interface DebugRelationship {
  source: string
  target: string
  description: string
}

interface DebugInfo {
  processing_phases: {
    entity_selection: {
      entities: DebugEntity[]
      duration_ms: number
      phase: string
    }
    community_analysis: {
      communities: DebugCommunity[]
      duration_ms: number
      phase: string
    }
    relationship_mapping: {
      relationships: DebugRelationship[]
      duration_ms: number
      phase: string
    }
  }
  animation_timeline: Array<{
    phase: string
    duration: number
    description: string
    entity_count?: number
    community_count?: number
    relationship_count?: number
  }>
}

interface GraphVisualization3DForceProps {
  reconciliationData?: ReconciliationData | null
  searchPath?: any
  debugInfo?: DebugInfo | null
  onNodeVisibilityChange?: (nodeIds: string[]) => void
  isProcessing?: boolean
  currentProcessingPhase?: string | null
}

export default function GraphVisualization3DForce({
  reconciliationData,
  searchPath,
  debugInfo,
  onNodeVisibilityChange,
  isProcessing,
  currentProcessingPhase
}: GraphVisualization3DForceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Color mapping for different node types
  const getNodeColor = (labels: string[]) => {
    const typeColors: Record<string, string> = {
      'Personnes': '#ff4757',
      'Lieux': '#00d2d3',
      'Événements': '#5352ed',
      'Concepts': '#7bed9f',
      'Organisations': '#ffa502',
      'Livres': '#ffd700',        // Bright gold - shiniest color
      'BOOK': '#ffd700',          // Bright gold - shiniest color
      'PERSON': '#ff4757',
      'GEO': '#00d2d3',
      'EVENT': '#5352ed',
      'CONCEPT': '#7bed9f',
      'ORGANIZATION': '#ffa502'
    }

    for (const label of labels) {
      if (typeColors[label]) {
        return typeColors[label]
      }
    }
    return '#dfe4ea' // default color
  }

  // Initialize 3D Force Graph
  useEffect(() => {
    const initGraph = async () => {
      if (!containerRef.current) return

      try {
        // Dynamic import for client-side only
        const ForceGraph3D = (await import('3d-force-graph')).default

        // Initialize the graph
        const graph = new ForceGraph3D(containerRef.current)
          .graphData({ nodes: [], links: [] })
          .backgroundColor('#000000')
          .showNavInfo(true)
          .nodeAutoColorBy('group')
          .nodeRelSize(6)
          .nodeResolution(8)
          .linkDirectionalParticles(2)
          .linkDirectionalParticleSpeed(0.006)
          .nodeVal((node: any) => node.val || 1)
          .nodeColor((node: any) => node.color || '#dfe4ea')
          .nodeLabel((node: any) => node.name || node.id)
          .linkColor(() => '#ffffff')
          .linkWidth(2)
          .enablePointerInteraction(true)

        graphRef.current = graph
        setIsLoading(false)

        console.log('🎨 3D Force Graph initialized')
      } catch (error) {
        console.error('Error initializing 3D Force Graph:', error)
        setIsLoading(false)
      }
    }

    initGraph()
  }, [])

  // Dynamically add nodes and links progressively
  const addNodesProgressively = (nodes: Node[], links: Link[], onComplete?: () => void) => {
    if (!graphRef.current) return

    let currentNodeIndex = 0
    let processedLinkIndex = 0
    const addedNodeIds = new Set<string>()

    // Create a Set of valid node IDs for quick lookup
    const validNodeIds = new Set(nodes.map(n => String(n.id)))

    // Filter and validate all links once at the beginning
    const validLinks = links.filter(link => {
      if (!link || !link.source || !link.target) return false

      const sourceId = String(typeof link.source === 'string' ? link.source : link.source.toString())
      const targetId = String(typeof link.target === 'string' ? link.target : link.target.toString())

      // Check if both source and target nodes exist in our nodes array
      const sourceExists = validNodeIds.has(sourceId)
      const targetExists = validNodeIds.has(targetId)

      if (!sourceExists || !targetExists) {
        console.warn(`⚠️ Filtering out link: ${sourceId} -> ${targetId} (source exists: ${sourceExists}, target exists: ${targetExists})`)
        return false
      }
      return true
    })

    console.log(`📊 Total nodes: ${nodes.length}, Valid links: ${validLinks.length}/${links.length}`)

    // Start with fresh data to ensure we only show the selected nodes
    let progressiveNodes: Node[] = []

    const addBatch = () => {
      // Add nodes in batches of 8-12
      const nodeBatchSize = Math.min(10, nodes.length - currentNodeIndex)
      if (nodeBatchSize > 0) {
        const newNodes = nodes.slice(currentNodeIndex, currentNodeIndex + nodeBatchSize)

        // Track which nodes we've added
        newNodes.forEach(node => addedNodeIds.add(node.id))

        // Add to our progressive array instead of current graph data
        progressiveNodes = [...progressiveNodes, ...newNodes]

        try {
          graphRef.current.graphData({
            nodes: progressiveNodes,
            links: [] // No links until all nodes are added
          })
        } catch (error) {
          console.error('Error adding nodes to graph:', error)
        }

        currentNodeIndex += nodeBatchSize
        console.log(`➕ Added ${nodeBatchSize} nodes (${currentNodeIndex}/${nodes.length})`)
      }

      // Add links in batches only after ALL nodes are added
      if (currentNodeIndex >= nodes.length && processedLinkIndex < validLinks.length) {
        // Find links that can be added (both nodes exist in our added nodes)
        const availableLinks = validLinks.slice(processedLinkIndex).filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.toString()
          const targetId = typeof link.target === 'string' ? link.target : link.target.toString()
          return addedNodeIds.has(sourceId) && addedNodeIds.has(targetId)
        })

        const linkBatchSize = Math.min(15, availableLinks.length)
        if (linkBatchSize > 0) {
          const newLinks = availableLinks.slice(0, linkBatchSize)

          // Get current links from the progressive state
          const currentGraphData = graphRef.current.graphData()
          const currentLinks = currentGraphData.links || []

          try {
            graphRef.current.graphData({
              nodes: progressiveNodes,
              links: [...currentLinks, ...newLinks]
            })
          } catch (error) {
            console.error('Error adding links to graph:', error)
            // If there's an error, try to continue with the next batch
            return
          }

          processedLinkIndex += linkBatchSize
          console.log(`🔗 Added ${linkBatchSize} valid links (${processedLinkIndex}/${validLinks.length})`)
        }
      }

      // Continue until all nodes are added, then process links
      const shouldContinue = currentNodeIndex < nodes.length ||
                           (currentNodeIndex >= nodes.length && processedLinkIndex < Math.min(validLinks.length, 200))

      if (shouldContinue) {
        setTimeout(addBatch, 250) // Add next batch after 250ms
      } else {
        console.log(`✅ Graph construction complete: ${nodes.length} nodes, ${processedLinkIndex} links added`)
        if (onComplete) onComplete()
      }
    }

    addBatch()
  }

  // Load graph when reconciliation data is available
  useEffect(() => {
    if (!reconciliationData || !graphRef.current) return

    // List of problematic node IDs to exclude
    const problematicNodeIds = [
      '4:d3905797-be64-4806-a783-4a9cdb24a462:13532'
    ]

    // Create nodes with robust data validation
    const nodes: Node[] = reconciliationData.nodes
      .filter(node => {
        if (!node || !node.id) return false
        if (problematicNodeIds.includes(String(node.id))) {
          console.warn(`⚠️ Excluding problematic node: ${node.id}`)
          return false
        }
        return true
      })
      .map(node => ({
        id: String(node.id), // Ensure ID is a string
        name: node.properties?.name || node.properties?.title || String(node.id),
        group: node.labels?.[0] || 'default',
        color: getNodeColor(node.labels || []),
        val: Math.max(1, (node.degree || 0) / 5) // Size based on degree with fallback
      }))

    // Create a Set of valid node IDs for quick lookup
    const validNodeIds = new Set(nodes.map(n => n.id))

    // Create links with strict validation - only include links where both nodes exist
    const links: Link[] = reconciliationData.relationships
      .filter(rel => {
        if (!rel || !rel.source || !rel.target) return false

        const sourceId = String(rel.source)
        const targetId = String(rel.target)

        const isValid = validNodeIds.has(sourceId) && validNodeIds.has(targetId)
        if (!isValid) {
          console.warn(`⚠️ Skipping invalid link: ${sourceId} -> ${targetId}`)
        }
        return isValid
      })
      .map(rel => ({
        source: String(rel.source),
        target: String(rel.target),
        type: rel.type || 'RELATED',
        value: 1
      }))

    // If debugInfo is present, do progressive loading. Otherwise load immediately
    if (debugInfo) {
      console.log('🎬 Starting progressive GraphRAG loading...')
      // Clear the graph first
      try {
        graphRef.current.graphData({ nodes: [], links: [] })
      } catch (error) {
        console.error('Error clearing graph:', error)
      }

      // Add nodes progressively
      addNodesProgressively(nodes, links, () => {
        if (onNodeVisibilityChange) {
          onNodeVisibilityChange(nodes.map(n => n.id))
        }
      })
    } else {
      console.log('📊 Loading complete 3D Force Graph immediately...')
      // Show complete graph immediately
      try {
        graphRef.current.graphData({ nodes, links })
      } catch (error) {
        console.error('Error loading complete graph:', error)
      }

      if (onNodeVisibilityChange) {
        onNodeVisibilityChange(nodes.map(n => n.id))
      }
    }

  }, [reconciliationData, debugInfo, onNodeVisibilityChange])

  // Animate GraphRAG processing phases
  useEffect(() => {
    if (!debugInfo || !graphRef.current) return

    console.log('🎬 Starting GraphRAG animation with debug info')

    const animatePhases = async () => {
      const timeline = debugInfo.animation_timeline

      for (let i = 0; i < timeline.length; i++) {
        const phase = timeline[i]
        console.log(`🔥 Animation phase ${i + 1}: ${phase.phase} - ${phase.description}`)

        // Highlight entities during explosion phase
        if (phase.phase === 'explosion' && debugInfo.processing_phases.entity_selection.entities.length > 0) {
          const entities = debugInfo.processing_phases.entity_selection.entities

          // Find actual nodes in the graph that match entity names
          const currentData = graphRef.current.graphData()
          const graphNodes = currentData.nodes || []

          for (let j = 0; j < entities.length; j++) {
            const entity = entities[j]

            // Find matching nodes by searching for name patterns
            const matchingNodes = graphNodes.filter((node: any) => {
              const nodeName = (node.name || '').toLowerCase()
              const entityName = entity.name.toLowerCase()

              // Check for exact match or partial match
              return nodeName.includes(entityName) ||
                     entityName.includes(nodeName) ||
                     node.id.toString().toLowerCase().includes(entityName)
            })

            if (matchingNodes.length > 0) {
              console.log(`🎯 Found ${matchingNodes.length} nodes matching entity "${entity.name}"`)

              // Highlight matching nodes
              graphRef.current.nodeColor((node: any) => {
                if (matchingNodes.some(m => m.id === node.id)) {
                  return '#ffeb3b' // Bright yellow for currently processing entity
                }
                // Keep previously highlighted nodes orange
                const previousEntities = entities.slice(0, j)
                const wasPreviouslyHighlighted = previousEntities.some(prevEntity => {
                  const prevMatches = graphNodes.filter((n: any) => {
                    const nName = (n.name || '').toLowerCase()
                    const prevName = prevEntity.name.toLowerCase()
                    return nName.includes(prevName) || prevName.includes(nName) || n.id.toString().toLowerCase().includes(prevName)
                  })
                  return prevMatches.some(m => m.id === node.id)
                })

                if (wasPreviouslyHighlighted) {
                  return '#ff9800' // Orange for processed entities
                }

                return node.color || getNodeColor([node.group || 'default'])
              })
            }

            // Wait between entity highlights
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }

        // Highlight relationships during synthesis phase
        if (phase.phase === 'synthesis' && debugInfo.processing_phases.relationship_mapping.relationships.length > 0) {
          const relationships = debugInfo.processing_phases.relationship_mapping.relationships
          const currentData = graphRef.current.graphData()
          const graphNodes = currentData.nodes || []

          graphRef.current.linkColor((link: any) => {
            // Try to match relationships by entity names
            const isHighlighted = relationships.some(rel => {
              const sourceMatches = graphNodes.filter((node: any) => {
                const nodeName = (node.name || '').toLowerCase()
                const sourceName = rel.source.toLowerCase()
                return nodeName.includes(sourceName) || sourceName.includes(nodeName)
              })

              const targetMatches = graphNodes.filter((node: any) => {
                const nodeName = (node.name || '').toLowerCase()
                const targetName = rel.target.toLowerCase()
                return nodeName.includes(targetName) || targetName.includes(nodeName)
              })

              return sourceMatches.some(s => s.id === (link.source.id || link.source)) &&
                     targetMatches.some(t => t.id === (link.target.id || link.target))
            })
            return isHighlighted ? '#ff4757' : '#ffffff'
          })
        }

        // Wait for phase duration
        await new Promise(resolve => setTimeout(resolve, phase.duration))
      }

      console.log('✅ GraphRAG animation completed')
    }

    animatePhases()
  }, [debugInfo])

  // Handle search path highlighting (fallback for non-GraphRAG searches)
  useEffect(() => {
    if (!searchPath || !graphRef.current || debugInfo) return

    console.log('🎯 Highlighting search path in 3D graph')

    // Extract entity IDs from search path
    const highlightedNodeIds = searchPath.entities?.map((e: any) => e.id) || []

    // Update node colors to highlight search path
    graphRef.current
      .nodeColor((node: any) => {
        if (highlightedNodeIds.includes(node.id)) {
          return '#ffeb3b' // Yellow for highlighted nodes
        }
        return node.color || getNodeColor([node.group || 'default'])
      })

  }, [searchPath])

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-2xl mb-2">🌐</div>
            <div>Initialisation du graphe 3D...</div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />

      {/* Info overlay */}
      {reconciliationData && !isLoading && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
          <div>🌌 Graphe 3D Force</div>
          <div>📊 {reconciliationData.nodes.length} nœuds</div>
          <div>🔗 {reconciliationData.relationships.length} liens</div>
          <div className="mt-2 text-xs text-gray-400">
            Utilisez la souris pour naviguer
          </div>
        </div>
      )}

      {/* Legend */}
      {reconciliationData && !isLoading && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
          <div className="font-semibold mb-2">Légende</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs">Personnes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400 mr-2"></div>
              <span className="text-xs">Lieux</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
              <span className="text-xs">Événements</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
              <span className="text-xs">Concepts</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-xs">Organisations</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
              <span className="text-xs">Livres</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-xs">Communautés</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}