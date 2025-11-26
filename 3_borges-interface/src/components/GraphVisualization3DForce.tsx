'use client'

import { useEffect, useRef, useState } from 'react'
import TextChunkModal from './TextChunkModal'

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
  // GraphML enriched metadata
  graphml_weight?: number
  graphml_description?: string
  graphml_source_chunks?: string
  graphml_order?: number
  has_graphml_metadata?: boolean
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
  onNodeClick?: (nodeId: string, nodeLabel: string, bookId?: string) => void
  isProcessing?: boolean
  currentProcessingPhase?: string | null
  sidePanelOpen?: boolean
}

export default function GraphVisualization3DForce({
  reconciliationData,
  searchPath,
  debugInfo,
  onNodeVisibilityChange,
  onNodeClick,
  isProcessing,
  currentProcessingPhase,
  sidePanelOpen = false
}: GraphVisualization3DForceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGraphReady, setIsGraphReady] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // TextChunkModal state
  const [isChunkModalOpen, setIsChunkModalOpen] = useState(false)
  const [chunkModalData, setChunkModalData] = useState<{
    chunkText: string
    bookId?: string
    chunkId?: string
    relationshipInfo?: {
      sourceNode: string
      targetNode: string
      relationType: string
    }
  } | null>(null)

  // Color mapping for different node types
  const typeColors: Record<string, string> = {
    'Personnes': '#ff4757',
    'Lieux': '#00d2d3',
    'Événements': '#5352ed',
    'Concepts': '#7bed9f',
    'Organisations': '#ffa502',
    'Livres': '#ffd700',        // Bright gold - shiniest color
    'Communautés': '#ff69b4',   // Pink for communities
    'BOOK': '#ffd700',          // Bright gold - shiniest color
    'PERSON': '#ff4757',
    'GEO': '#00d2d3',
    'LOCATION': '#00d2d3',
    'EVENT': '#5352ed',
    'CONCEPT': '#7bed9f',
    'ORGANIZATION': '#ffa502',
    'Community': '#ff69b4',
    'default': '#dfe4ea'
  }

  // Map entity_type from Neo4j to French display labels for legend matching
  const entityTypeToFrench: Record<string, string> = {
    'PERSON': 'Personnes',
    'GEO': 'Lieux',
    'LOCATION': 'Lieux',
    'EVENT': 'Événements',
    'CONCEPT': 'Concepts',
    'ORGANIZATION': 'Organisations',
    'Book': 'Livres',
    'Community': 'Communautés',
    // Handle malformed entity_type values (with quotes or pipes from Neo4j)
    '("PERSON': 'Personnes',
    '|"PERSON': 'Personnes',
    '("GEO': 'Lieux',
    '|"GEO': 'Lieux',
    '("EVENT': 'Événements',
    '|"EVENT': 'Événements',
    '|EVENT': 'Événements',
    '("CONCEPT': 'Concepts',
    '|"CONCEPT': 'Concepts',
    '|CONCEPT': 'Concepts',
  }

  // Get the entity type from node data, prioritizing entity_type property
  const getEntityType = (node: ReconciliationData['nodes'][0]): string => {
    // First try entity_type property (most reliable for actual type)
    if (node.properties?.entity_type) {
      const rawType = node.properties.entity_type.toString().trim()
      const mapped = entityTypeToFrench[rawType]
      if (mapped) return mapped
      // If not mapped, return as-is (might be directly usable)
      return rawType
    }
    // Check if it's a Book node by labels or ID pattern
    if (node.labels?.includes('Book') || node.labels?.includes('BOOK') ||
        String(node.id).startsWith('LIVRE_')) {
      return 'Livres'
    }
    // Check for Community
    if (node.labels?.includes('Community')) {
      return 'Communautés'
    }
    // Then try the second label (first is usually "Entity")
    if (node.labels && node.labels.length > 1) {
      const secondLabel = node.labels[1]
      const mapped = entityTypeToFrench[secondLabel]
      if (mapped) return mapped
      return secondLabel
    }
    // Fall back to first label or default
    const firstLabel = node.labels?.[0] || 'default'
    return entityTypeToFrench[firstLabel] || firstLabel
  }

  // Get color for node based on its entity type
  const getNodeColor = (node: ReconciliationData['nodes'][0]): string => {
    const entityType = getEntityType(node)
    return typeColors[entityType] || typeColors.default
  }

  // Handle source navigation to open TextChunkModal
  const handleSourceNavigation = (sourceChunks: string, bookId?: string, relationshipInfo?: { sourceNode: string, targetNode: string, relationType: string }) => {
    console.log('🔗 Opening TextChunkModal with source chunks:', {
      sourceChunks: sourceChunks.substring(0, 100) + '...',
      bookId,
      relationshipInfo
    })

    setChunkModalData({
      chunkText: sourceChunks,
      bookId: bookId || 'unknown',
      chunkId: undefined, // We don't have chunk_id in this context
      relationshipInfo
    })
    setIsChunkModalOpen(true)
  }

  // Initialize 3D Force Graph
  useEffect(() => {
    const initGraph = async () => {
      console.log('🚀 Starting 3D Graph initialization...')
      if (!containerRef.current) {
        console.error('❌ Container ref not available for 3D graph')
        return
      }

      console.log('✅ Container ref available:', containerRef.current)

      try {
        console.log('🎨 Creating new ForceGraph3D instance...')
        // Dynamic import for client-side only
        const ForceGraph3D = (await import('3d-force-graph')).default
        // Initialize the graph with design principles
        const graph = new ForceGraph3D(containerRef.current)

        // Configure graph data and background
        graph.graphData({ nodes: [], links: [] })
        graph.backgroundColor('#000000')
        graph.showNavInfo(true)

        // Configure node appearance
        graph.nodeAutoColorBy('group')
        graph.nodeRelSize(6)
        graph.nodeResolution(8)
        graph.nodeVal((node: any) => node.val || 1)
        graph.nodeColor((node: any) => node.color || '#dfe4ea')
        graph.nodeLabel((node: any) => node.name || node.id)

        // Configure link appearance
        graph.linkDirectionalParticles(2)
        graph.linkDirectionalParticleSpeed(0.006)
        graph.linkColor(() => '#ffffff')
        graph.linkWidth(2)

        // Configure interactions
        graph.enablePointerInteraction(true)
        graph.onLinkHover((link: any) => {
          console.log('🎯 Link hover detected!', link)
          setHoveredLink(link || null)
        })

        // Configure node click handler for chunk traceability
        graph.onNodeClick((node: any) => {
          if (onNodeClick && node) {
            console.log('🎯 Node clicked for chunk traceability:', node)
            const nodeLabel = node.name || node.label || node.id
            const bookId = node.bookId || node.book_id
            onNodeClick(node.id, nodeLabel, bookId)
          }
        })

        // Principe #4: Proper spacing between nodes for visibility of relationships
        // Configure forces to create book-centered topology: Books → Hubs → Sub-hubs → Periphery
        const chargeForce = graph.d3Force('charge')
        if (chargeForce) {
          chargeForce.strength((node: any) => {
            // Books have moderate repulsion but stay central
            const isBook = node.group === 'Livres' || node.group === 'BOOK' || String(node.id).startsWith('LIVRE_')
            if (isBook) return -200  // Books moderate repulsion for better balance

            // High-degree nodes (hubs) have stronger repulsion for good spreading
            const degree = node.val || 1
            if (degree > 10) return -400  // Hubs moderate separation to reduce spiral effect
            if (degree > 5) return -500  // Sub-hubs moderate separation

            // Regular nodes have moderate repulsion for natural distribution
            return -600  // Balanced repulsion to avoid excessive spiral effect
          })
        }

        const linkForce = graph.d3Force('link')
        if (linkForce) {
          linkForce
            .distance((link: any) => {
              // Balanced distances for good visibility without excessive spiral effect
              const sourceIsBook = link.source.group === 'Livres' || link.source.group === 'BOOK' || String(link.source.id).startsWith('LIVRE_')
              const targetIsBook = link.target.group === 'Livres' || link.target.group === 'BOOK' || String(link.target.id).startsWith('LIVRE_')

              if (sourceIsBook || targetIsBook) return 400  // Books to first-hop: balanced distance

              // Hub-to-hub connections: moderate spacing for good structure
              const sourceDegree = link.source.val || 1
              const targetDegree = link.target.val || 1
              if (sourceDegree > 10 && targetDegree > 10) return 500  // Hub networks well spread
              if (sourceDegree > 5 && targetDegree > 5) return 450    // Sub-hub networks

              // Regular connections: good distance for multi-hop visibility
              return 550  // Extended range without spiral artifacts
            })
            .strength(0.7)  // Stronger links to maintain structural cohesion and reduce spiral
        }

        // Add center force to keep books gravitating toward center
        const d3 = await import('d3-force')
        graph.d3Force('center', d3.forceCenter(0, 0).strength(0.1))

        // Add radial force to push non-book nodes outward in much larger layers for long-range visibility
        graph.d3Force('radial', d3.forceRadial((node: any) => {
          const isBook = node.group === 'Livres' || node.group === 'BOOK' || String(node.id).startsWith('LIVRE_')
          if (isBook) return 0  // Books stay at center

          const degree = node.val || 1
          if (degree > 10) return 400  // Hubs in middle ring (4x larger: 100 * 4)
          if (degree > 5) return 800   // Sub-hubs in outer ring (4x larger: 200 * 4)
          return 1200  // Peripheral nodes pushed far outward (4x larger: 300 * 4) for maximum range
        }, 0, 0).strength(0.05))  // Much weaker radial force to prevent rigid circular patterns

        console.log('✅ ForceGraph3D instance created successfully')
        graphRef.current = graph
        setIsLoading(false)
        setIsGraphReady(true)

        console.log('🎨 3D Force Graph initialized successfully and ready for data')
      } catch (error) {
        console.error('❌ Error initializing 3D Force Graph:', error)
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
        console.warn(`⚠️ Second filter: Filtering out link: ${sourceId} -> ${targetId} (source exists: ${sourceExists}, target exists: ${targetExists})`)
        return false
      }
      return true
    })

    console.log(`📊 Total nodes: ${nodes.length}, Valid links: ${validLinks.length}/${links.length}`)
    console.log(`🔍 Sample valid links:`, validLinks.slice(0, 3).map(l => `${l.source} -> ${l.target}`))

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
    console.log('🔄 Data loading effect triggered')
    console.log('📊 reconciliationData:', !!reconciliationData, reconciliationData ? `${reconciliationData.nodes.length} nodes, ${reconciliationData.relationships.length} relationships` : 'null')
    console.log('🎨 graphRef.current:', !!graphRef.current)
    console.log('✅ isGraphReady:', isGraphReady)

    if (!reconciliationData || !graphRef.current || !isGraphReady) {
      console.log('⏸️ Skipping data load - missing reconciliationData, graphRef, or graph not ready')
      return
    }

    // List of problematic node IDs to exclude
    const problematicNodeIds = [
      '4:d3905797-be64-4806-a783-4a9cdb24a462:13532'
    ]

    // Connected Subgraph First approach: Relations first → Connected nodes only
    // This ensures NO orphan nodes (respects design constraint #1)

    // First, create all possible links and identify connected nodes
    const allValidLinks = reconciliationData.relationships
      .filter(rel => {
        if (!rel || !rel.source || !rel.target) return false
        return true
      })
      .map(rel => ({
        source: String(rel.source),
        target: String(rel.target),
        type: rel.type || 'RELATED',
        value: 1
      }))

    // Identify all nodes that participate in at least one relationship
    const connectedNodeIds = new Set<string>()
    allValidLinks.forEach(link => {
      connectedNodeIds.add(link.source)
      connectedNodeIds.add(link.target)
    })

    console.log(`📊 Connected Subgraph First - found ${connectedNodeIds.size} connected nodes from ${allValidLinks.length} relationships`)

    // Create nodes only for those that have relationships, excluding problematic ones
    const nodes: Node[] = reconciliationData.nodes
      .filter(node => {
        if (!node || !node.id) return false
        if (problematicNodeIds.includes(String(node.id))) {
          console.warn(`⚠️ Excluding problematic node: ${node.id}`)
          return false
        }
        // CRITICAL: Only include nodes that participate in relationships
        const nodeId = String(node.id)
        return connectedNodeIds.has(nodeId)
      })
      .map(node => {
        // For GraphRAG nodes, use the label/name as the ID to match relationships
        const isGraphRAGNode = node.properties?.graphrag_node === true
        const nodeId = isGraphRAGNode
          ? (node.properties?.name || node.properties?.title || String(node.id))
          : String(node.id)

        // Principle #2: Books are the "core" entities and should be bigger
        const isBookNode = (node as any).type === 'Book' ||
                          (node.labels && node.labels.includes('Livres')) ||
                          (node.labels && node.labels.includes('BOOK')) ||
                          String(nodeId).startsWith('LIVRE_')

        const baseSize = Math.max(1, (node.degree || 0) / 5)
        const bookMultiplier = isBookNode ? 3 : 1  // Books are 3x larger

        // Get entity type for proper color matching with legend
        const entityType = getEntityType(node)

        // Extract the best available name for the node label
        // Priority: name property > title property > entity_type + short ID > short ID
        const getNodeName = (node: any, nodeId: string): string => {
          if (node.properties?.name) return node.properties.name
          if (node.properties?.title) return node.properties.title
          // Fallback: use entity_type + last 4 chars of ID if available
          const entityType = node.properties?.entity_type || node.labels?.[1] || node.labels?.[0]
          const shortId = String(node.id).slice(-4)
          if (entityType && entityType !== 'Entity') {
            return `${entityType}-${shortId}`
          }
          return `Node-${shortId}`
        }

        return {
          id: nodeId,
          name: getNodeName(node, nodeId),
          group: entityType, // Use entity type for group (used in force calculations)
          color: getNodeColor(node), // Pass full node to get color from entity_type property
          val: baseSize * bookMultiplier // Books are significantly larger
        }
      })

    // Create a Set of final valid node IDs for link filtering
    const finalValidNodeIds = new Set(nodes.map(n => n.id))

    console.log(`🔍 Final connected nodes (zero orphans):`, Array.from(finalValidNodeIds).slice(0, 5), `(showing first 5 of ${finalValidNodeIds.size})`)

    // Filter links to only connect the final selected nodes
    const links: Link[] = allValidLinks.filter(link => {
      const isValid = finalValidNodeIds.has(link.source) && finalValidNodeIds.has(link.target)
      if (!isValid) {
        console.warn(`⚠️ Final filter: Skipping link between unselected nodes: ${link.source} -> ${link.target}`)
      }
      return isValid
    })

    console.log(`🔗 Connected Subgraph guaranteed: ${links.length}/${allValidLinks.length} links connect ${nodes.length} nodes (all nodes have ≥1 relation)`)

    console.log(`🔍 Final processing results:`)
    console.log(`  • Final nodes to render: ${nodes.length}`)
    console.log(`  • Final links to render: ${links.length}`)
    console.log(`  • Sample nodes:`, nodes.slice(0, 3).map(n => ({ id: n.id, name: n.name, color: n.color })))
    console.log(`  • Sample links:`, links.slice(0, 3).map(l => ({ source: l.source, target: l.target, type: l.type })))

    // Only proceed if we have valid data to display
    if (nodes.length === 0 && links.length === 0) {
      console.warn('⚠️ No valid nodes or links found, keeping existing graph')
      return
    }

    // If debugInfo is present, do progressive loading. Otherwise load immediately
    if (debugInfo) {
      console.log('🎬 Starting progressive GraphRAG loading...')
      // Only clear the graph if we have data to replace it with
      if (nodes.length > 0) {
        try {
          console.log('🧹 Clearing graph data for progressive loading...')
          graphRef.current.graphData({ nodes: [], links: [] })
        } catch (error) {
          console.error('❌ Error clearing graph:', error)
        }

        // Add nodes progressively
        console.log('📈 Starting progressive node/link addition...')
        addNodesProgressively(nodes, links, () => {
          console.log('✅ Progressive loading completed')
          if (onNodeVisibilityChange) {
            onNodeVisibilityChange(nodes.map(n => n.id))
          }
        })
      }
    } else {
      console.log('📊 Loading complete 3D Force Graph immediately...')
      console.log('  • Graph instance available:', !!graphRef.current)
      // Show complete graph immediately
      try {
        console.log('🎯 Setting graph data immediately...')
        graphRef.current.graphData({ nodes, links })
        console.log('✅ Graph data set successfully!')
      } catch (error) {
        console.error('❌ Error loading complete graph:', error)
        console.error('Error details:', error)
      }

      if (onNodeVisibilityChange) {
        onNodeVisibilityChange(nodes.map(n => n.id))
      }
    }

  }, [reconciliationData, debugInfo, onNodeVisibilityChange, isGraphReady])

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
                if (matchingNodes.some((m: any) => m.id === node.id)) {
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
                  return prevMatches.some((m: any) => m.id === node.id)
                })

                if (wasPreviouslyHighlighted) {
                  return '#ff9800' // Orange for processed entities
                }

                return node.color || typeColors[node.group] || typeColors.default
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

              return sourceMatches.some((s: any) => s.id === (link.source.id || link.source)) &&
                     targetMatches.some((t: any) => t.id === (link.target.id || link.target))
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
        return node.color || typeColors[node.group] || typeColors.default
      })

  }, [searchPath])

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-borges-light">
          <div className="text-center">
            <div className="text-2xl mb-2 text-borges-light">Initializing...</div>
            <div className="text-borges-light-muted">Initialisation du graphe 3D...</div>
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
        <div className="absolute top-4 left-4 bg-borges-secondary border border-borges-border p-3 rounded-borges-md text-sm">
          <div className="text-borges-light font-medium">Dimensions de l&apos;échantillon</div>
          <div className="text-borges-light-muted">{reconciliationData.nodes.length} noeuds</div>
          <div className="text-borges-light-muted">{reconciliationData.relationships.length} relations</div>
          <div className="mt-2 text-xs text-borges-muted">
            Use mouse to navigate
          </div>
        </div>
      )}

      {/* Legend - hide when side panel is open to avoid clutter */}
      {reconciliationData && !isLoading && !sidePanelOpen && (
        <div className="absolute top-4 right-4 bg-borges-secondary border border-borges-border p-3 rounded-borges-md text-sm">
          <div className="font-medium text-borges-light mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#ff4757' }}></div>
              <span className="text-xs text-borges-light-muted">Personnes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#00d2d3' }}></div>
              <span className="text-xs text-borges-light-muted">Lieux</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#5352ed' }}></div>
              <span className="text-xs text-borges-light-muted">Événements</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#7bed9f' }}></div>
              <span className="text-xs text-borges-light-muted">Concepts</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#ffa502' }}></div>
              <span className="text-xs text-borges-light-muted">Organisations</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#ffd700' }}></div>
              <span className="text-xs text-borges-light-muted">Livres</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#ff69b4' }}></div>
              <span className="text-xs text-borges-light-muted">Communautés</span>
            </div>
          </div>
        </div>
      )}

      {/* Link Hover Tooltip - follows cursor */}
      {hoveredLink && (
        <div
          className="fixed bg-borges-secondary border border-borges-border p-2 rounded-borges-md text-xs z-50 w-48 max-h-40 overflow-y-auto pointer-events-none"
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`,
          }}
        >
          <div className="font-medium text-borges-light mb-1">Relation</div>

          <div className="space-y-1">
            <div>
              <span className="text-borges-muted">Description:</span>
              <span className="text-borges-light ml-1">{hoveredLink.type || hoveredLink.relation}</span>
            </div>

            <div>
              <span className="text-borges-muted">Between:</span>
              <div className="text-borges-light ml-1">
                {typeof hoveredLink.source === 'object' ? (hoveredLink.source as any)?.name || (hoveredLink.source as any)?.id || 'Unknown' : hoveredLink.source}
                <span className="text-borges-light"> → </span>
                {typeof hoveredLink.target === 'object' ? (hoveredLink.target as any)?.name || (hoveredLink.target as any)?.id || 'Unknown' : hoveredLink.target}
              </div>
            </div>

            {hoveredLink.has_graphml_metadata && (
              <>
                <div className="border-t border-borges-border pt-1 mt-2">
                  <div className="text-borges-light text-xs font-medium">GraphML Metadata</div>
                </div>

                {hoveredLink.graphml_weight && (
                  <div>
                    <span className="text-borges-muted">Weight:</span>
                    <span className="text-borges-light ml-1 font-mono">{hoveredLink.graphml_weight.toFixed(1)}</span>
                  </div>
                )}

                {hoveredLink.graphml_description && (
                  <div>
                    <span className="text-borges-muted">Description:</span>
                    <div className="text-borges-light-muted ml-1 mt-1 text-xs leading-relaxed">
                      {hoveredLink.graphml_description.length > 150
                        ? hoveredLink.graphml_description.substring(0, 150) + "..."
                        : hoveredLink.graphml_description
                      }
                    </div>
                  </div>
                )}

                {hoveredLink.graphml_source_chunks && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-borges-muted">Source:</span>
                      <button
                        onClick={() => handleSourceNavigation(
                          hoveredLink.graphml_source_chunks!,
                          'unknown', // We don't have bookId here
                          {
                            sourceNode: typeof hoveredLink.source === 'object' ? (hoveredLink.source as any)?.name || (hoveredLink.source as any)?.id || 'Unknown' : hoveredLink.source,
                            targetNode: typeof hoveredLink.target === 'object' ? (hoveredLink.target as any)?.name || (hoveredLink.target as any)?.id || 'Unknown' : hoveredLink.target,
                            relationType: hoveredLink.relation || hoveredLink.type || 'RELATED'
                          }
                        )}
                        className="borges-btn-primary text-xs"
                        title="Open full source text"
                      >
                        Read Source
                      </button>
                    </div>
                    <div className="text-borges-muted ml-1 text-xs mt-1">
                      {hoveredLink.graphml_source_chunks.substring(0, 50)}...
                    </div>
                  </div>
                )}

                {hoveredLink.graphml_order && hoveredLink.graphml_order > 0 && (
                  <div>
                    <span className="text-borges-muted">Order:</span>
                    <span className="text-borges-light ml-1">{hoveredLink.graphml_order}</span>
                  </div>
                )}
              </>
            )}

            {!hoveredLink.has_graphml_metadata && (
              <div className="text-borges-muted text-xs mt-2">
                No enriched GraphML metadata
              </div>
            )}
          </div>
        </div>
      )}

      {/* TextChunkModal for source text display */}
      {chunkModalData && (
        <TextChunkModal
          isOpen={isChunkModalOpen}
          onClose={() => {
            setIsChunkModalOpen(false)
            setChunkModalData(null)
          }}
          chunkText={chunkModalData.chunkText}
          bookId={chunkModalData.bookId}
          chunkId={chunkModalData.chunkId}
          entities={[]} // TODO: Extract entities from the relationship data
          relationshipInfo={chunkModalData.relationshipInfo}
        />
      )}
    </div>
  )
}