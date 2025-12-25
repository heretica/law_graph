'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'

const GraphVisualization3DForce = dynamic(() => import('./GraphVisualization3DForce'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96 bg-datack-black">
      <div className="text-center">
        {/* Datack Civic Graph Assembly Animation */}
        <svg className="w-48 h-48 mx-auto mb-4" viewBox="0 0 200 200" fill="none">
          {/* Animated nodes connecting into civic graph structure */}
          <style>{`
            @keyframes hexAssemble1 { 0% { opacity: 0; transform: translate(-30px, -20px); } 50% { opacity: 0.6; } 100% { opacity: 0.8; transform: translate(0, 0); } }
            @keyframes hexAssemble2 { 0% { opacity: 0; transform: translate(30px, -20px); } 50% { opacity: 0.5; } 100% { opacity: 0.7; transform: translate(0, 0); } }
            @keyframes hexAssemble3 { 0% { opacity: 0; transform: translate(0, 30px); } 50% { opacity: 0.4; } 100% { opacity: 0.6; transform: translate(0, 0); } }
            @keyframes hexAssemble4 { 0% { opacity: 0; transform: translate(-20px, 20px); } 50% { opacity: 0.3; } 100% { opacity: 0.5; transform: translate(0, 0); } }
            @keyframes hexAssemble5 { 0% { opacity: 0; transform: translate(20px, 20px); } 50% { opacity: 0.2; } 100% { opacity: 0.4; transform: translate(0, 0); } }
            @keyframes bookShimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
            .hex1 { animation: hexAssemble1 2s ease-out infinite; }
            .hex2 { animation: hexAssemble2 2s ease-out 0.2s infinite; }
            .hex3 { animation: hexAssemble3 2s ease-out 0.4s infinite; }
            .hex4 { animation: hexAssemble4 2s ease-out 0.6s infinite; }
            .hex5 { animation: hexAssemble5 2s ease-out 0.8s infinite; }
            .book-line { animation: bookShimmer 3s ease-in-out infinite; }
          `}</style>

          {/* Central hexagon - main civic node - Datack Yellow */}
          <polygon
            className="hex1"
            points="100,40 130,57.5 130,92.5 100,110 70,92.5 70,57.5"
            stroke="#dbff3b"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Top hexagon */}
          <polygon
            className="hex2"
            points="100,10 125,25 125,55 100,70 75,55 75,25"
            stroke="#dbff3b"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom left hexagon */}
          <polygon
            className="hex3"
            points="70,95 95,110 95,140 70,155 45,140 45,110"
            stroke="#dbff3b"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom right hexagon */}
          <polygon
            className="hex4"
            points="130,95 155,110 155,140 130,155 105,140 105,110"
            stroke="#dbff3b"
            strokeWidth="1"
            fill="none"
          />

          {/* Far left hexagon */}
          <polygon
            className="hex5"
            points="50,60 75,75 75,105 50,120 25,105 25,75"
            stroke="#dbff3b"
            strokeWidth="0.8"
            fill="none"
          />

          {/* Far right hexagon */}
          <polygon
            className="hex5"
            points="150,60 175,75 175,105 150,120 125,105 125,75"
            stroke="#dbff3b"
            strokeWidth="0.8"
            fill="none"
            style={{ animationDelay: '1s' }}
          />

          {/* Connection lines inside central hexagon - Datack Yellow */}
          <line className="book-line" x1="80" y1="65" x2="120" y2="65" stroke="#dbff3b" strokeWidth="0.5" />
          <line className="book-line" x1="82" y1="75" x2="118" y2="75" stroke="#dbff3b" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
          <line className="book-line" x1="84" y1="85" x2="116" y2="85" stroke="#dbff3b" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
        </svg>
        <div className="text-datack-muted text-xs max-w-lg text-center">Chargement du graphe citoyen...</div>
      </div>
    </div>
  )
})
import { GraphErrorBoundary } from './GraphErrorBoundary'
import QueryInterface from './QueryInterface'
import HighlightedText from './HighlightedText'
import LoadingWheel3D from './LoadingWheel3D'
import TutorialOverlay from './TutorialOverlay'
import TextChunkModal from './TextChunkModal'
import ProvenancePanel from './ProvenancePanel'
import EntityDetailModal from './EntityDetailModal'
// CitizenExtractsPanel merged into EntityDetailModal (Feature 005-agent-orchestration)
import { lawGraphRAGService } from '@/lib/services/law-graphrag'
import type { CitizenExtract, GrandDebatEntity } from '@/types/law-graphrag'
import { colorService, type EntityColorInfo } from '@/lib/utils/colorService'
import type { TraversedRelationship } from '@/types/provenance'
import { useGraphMLData, transformToReconciliationData } from '@/hooks/useGraphMLData'


interface ReconciliationGraphData {
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, any>;
    degree: number;
    centrality_score: number;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    source: string;
    target: string;
    properties: Record<string, any>;
  }>;
}


/**
 * Composant principal de la bibliothèque de Borges
 */
function BorgesLibrary() {
  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false)

  // Enhanced node click handler for provenance integration
  const handleNodeClick = (nodeId: string, nodeLabel: string, bookId?: string) => {
    console.log(`🎯 Node clicked: ${nodeId} (${nodeLabel})`)
    setSelectedEntityId(nodeId)
    setSelectedEntityName(nodeLabel)

    // Entity details now shown in EntityDetailModal (merged with citizen extracts)
  }

  // Handler for entity clicks from ProvenancePanel
  const handleProvenanceEntityClick = (entityId: string, entityName: string) => {
    console.log(`📊 Entity clicked from provenance: ${entityId} (${entityName})`)
    setSelectedEntityId(entityId)
    setSelectedEntityName(entityName)
  }

  // Handler for relationship clicks from ProvenancePanel
  const handleRelationshipClick = (relationship: TraversedRelationship) => {
    console.log(`🔗 Relationship clicked:`, relationship)
    // Relationship details are shown in the tooltip on the 3D graph
    // Could optionally highlight the relationship in the graph here
  }

  // Handler for chunk clicks from ProvenancePanel
  const handleChunkClick = (chunkId: string) => {
    console.log(`📄 Chunk clicked: ${chunkId}`)
    // Open TextChunkModal with the chunk data
    // TODO: Fetch chunk details and open modal
  }

  // Close entity detail modal
  const handleCloseEntityModal = () => {
    setSelectedEntityId(null)
    setSelectedEntityName(null)
  }
  const [reconciliationData, setReconciliationData] = useState<ReconciliationGraphData | null>(null)
  const [isLoadingGraph, setIsLoadingGraph] = useState(true) // Start as true to show loading
  const [showTutorial, setShowTutorial] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false) // For returning users
  const [loadingProgress, setLoadingProgress] = useState<{ step: string; current: number; total: number } | null>(null)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])
  const [searchPath, setSearchPath] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingPhase, setCurrentProcessingPhase] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [queryAnswer, setQueryAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [answerPanelHeight, setAnswerPanelHeight] = useState(30) // Default 30vh on mobile
  // Entity coloring state for interpretability
  const [coloredEntities, setColoredEntities] = useState<EntityColorInfo[]>([])

  // TextChunkModal state for entity click navigation
  const [isEntityChunkModalOpen, setIsEntityChunkModalOpen] = useState(false)
  const [entityChunkData, setEntityChunkData] = useState<{
    entityName: string
    aggregatedChunks: string
    relatedRelationships: number
    communeId?: string
  } | null>(null)
  // Single-purpose: Grand Débat National GraphRAG only (Constitution v3.0.0 Principle VI)
  const [mode, setMode] = useState<'local' | 'global'>('global')
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [processingStats, setProcessingStats] = useState<{
    nodes: number;
    communities: number;
    neo4jRelationships?: number;
    crossBookLinks?: number;
    entityCommunityLinks?: number;
  }>({ nodes: 0, communities: 0 })

  // Provenance tracking state
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null)
  const [showProvenancePanel, setShowProvenancePanel] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null)

  // Store query result nodes for entity lookup
  const [queryResultNodes, setQueryResultNodes] = useState<any[]>([])

  // Store source chunks from query results for provenance display
  const [sourceChunks, setSourceChunks] = useState<Array<{
    chunk_id: string
    content: string
    document_id: string
    commune?: string
  }>>([])
  const [showSourceChunksPanel, setShowSourceChunksPanel] = useState(false)

  // Bi-directional highlighting state - Constitution Principle V: End-to-End Interpretability
  // When an entity is clicked in RAG answer, highlight matching text in source chunks
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null)

  // Store provenance entities for EntityDetailModal (Constitution Principle #7: Civic Provenance Chain)
  const [provenanceEntities, setProvenanceEntities] = useState<GrandDebatEntity[]>([])

  // Grand Débat National civic data exploration - Constitution v3.0.0
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const civicQuotes = [
    "« La parole citoyenne, écoutée et analysée, devient le fondement d'une démocratie vivante. »",
    "« Chaque commune porte en elle les préoccupations singulières de ses habitants. »",
    "« Le Grand Débat National : quand 50 communes de Charente-Maritime prennent la parole. »",
    "« Des Cahiers de Doléances aux graphes de connaissances : la voix des citoyens se structure. »",
    "« Explorer les contributions citoyennes, c'est comprendre les attentes d'un territoire. »"
  ]

  // Rotate quotes every 8 seconds during loading
  useEffect(() => {
    if (showLoadingOverlay || isLoadingGraph) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % civicQuotes.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [showLoadingOverlay, isLoadingGraph, civicQuotes.length])

  // Function to extract chunks related to a specific entity
  const extractEntityChunks = (entityId: string) => {
    if (!reconciliationData?.relationships) {
      console.warn('⚠️ No relationship data available for entity chunks extraction')
      return { chunks: '', count: 0 }
    }

    console.log(`🔍 Extracting chunks for entity: ${entityId}`)

    // Find all relationships involving this entity (as source or target)
    const relatedRelationships = reconciliationData.relationships.filter(rel =>
      rel.source === entityId || rel.target === entityId
    )

    console.log(`📊 Found ${relatedRelationships.length} related relationships`)

    // Extract all unique graphml_source_chunks
    const allChunks: string[] = []
    relatedRelationships.forEach(rel => {
      const chunks = rel.properties?.graphml_source_chunks
      if (chunks && typeof chunks === 'string') {
        allChunks.push(chunks)
      }
    })

    // Deduplicate and combine chunks
    const uniqueChunks = Array.from(new Set(allChunks))
    const combinedChunks = uniqueChunks.join('\n\n--- Relation connexe ---\n\n')

    console.log(`✅ Extracted ${uniqueChunks.length} unique chunks, total length: ${combinedChunks.length} chars`)

    return {
      chunks: combinedChunks,
      count: relatedRelationships.length,
      relationships: relatedRelationships
    }
  }

  // Handle entity click to show related chunks + bi-directional highlighting
  const handleEntityClick = (entity: EntityColorInfo) => {
    console.log('🎯 Entity clicked:', entity.id)

    // Toggle bi-directional highlighting - Constitution Principle V
    // If same entity clicked, clear highlight; otherwise set new highlight
    if (highlightedEntityId === entity.id) {
      setHighlightedEntityId(null)
    } else {
      setHighlightedEntityId(entity.id)
    }

    // Find the actual Neo4j node ID by matching the labels or id
    // Search in both queryResultNodes (from GraphRAG query) and reconciliationData (full graph)
    let matchingNode = queryResultNodes.find(
      node => node.labels?.includes(entity.id) || node.id === entity.id
    )

    if (!matchingNode) {
      matchingNode = reconciliationData?.nodes.find(
        node => node.labels?.includes(entity.id) || node.id === entity.id
      )
    }

    if (matchingNode) {
      console.log(`✅ Found matching node: ${matchingNode.id} (${matchingNode.labels?.[0]})`)
      setSelectedEntityId(matchingNode.id)
      setSelectedEntityName(matchingNode.labels?.[0] || matchingNode.id)
    } else {
      console.warn(`⚠️ No matching node found for entity: ${entity.id}`)
      // Still open the modal with the label as ID (will show "not found" message)
      setSelectedEntityId(entity.id)
      setSelectedEntityName(entity.id)
    }
  }

  // Helper function to highlight entity text within chunk content
  const highlightEntityInText = (text: string, entityId: string | null, entityColor: string): JSX.Element => {
    if (!entityId || !text) {
      return <>{text}</>
    }

    // Create case-insensitive regex for entity name
    const escapedEntity = entityId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedEntity})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, idx) =>
          regex.test(part) ? (
            <span
              key={idx}
              className="px-1 py-0.5 rounded transition-all duration-300"
              style={{
                backgroundColor: `${entityColor}40`,
                borderBottom: `2px solid ${entityColor}`,
                color: entityColor
              }}
            >
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    )
  }

  // Memoized node normalization - Graph Performance Optimization (006-graph-optimization)
  // Transforms raw graph nodes into normalized format with guaranteed properties
  const normalizeGraphNodes = useMemo(() => {
    return (nodes: any[]) => {
      return nodes.map(node => ({
        ...node,
        properties: node.properties as Record<string, any>,
        degree: node.degree ?? 1,
        centrality_score: node.centrality_score ?? 0.5
      }))
    }
  }, [])

  // Memoized entity color mapping - Graph Performance Optimization (006-graph-optimization)
  // Transforms graph nodes into entity color format for interpretability
  const mapNodesToColorEntities = useMemo(() => {
    return (nodes: any[]) => {
      return nodes.map((node: any, idx: number) => ({
        id: node.properties?.name || node.id,
        type: node.labels?.[0] || 'CIVIC_ENTITY',
        description: node.properties?.description,
        score: node.centrality_score || 0.5,
        order: idx
      }))
    }
  }, [])

  // Memoized query keyword matcher - Graph Performance Optimization (006-graph-optimization)
  // Filters nodes based on query keywords with O(n) complexity but memoized function
  const createQueryMatcher = useMemo(() => {
    return (query: string, nodes: any[]) => {
      const queryLower = query.toLowerCase()
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3)

      return nodes.filter(node => {
        const labels = node.labels.map((l: string) => l.toLowerCase())
        const name = (node.properties?.name || '').toLowerCase()
        const description = (node.properties?.description || '').toLowerCase()

        return queryWords.some(word =>
          labels.some((label: string) => label.includes(word)) ||
          name.includes(word) ||
          description.includes(word)
        )
      })
    }
  }, [])

  // DISABLED: GraphML static file loading - now using live MCP API data
  // The full graph is loaded from MCP API on component mount (see useEffect below)
  // This avoids race condition between GraphML and MCP data loads

  // Placeholder state for compatibility (no longer loads GraphML)
  const isGraphMLLoading = false
  const graphMLError = null

  // Check localStorage for tutorial skip on mount
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('borges-tutorial-seen')
    if (!tutorialSeen) {
      setShowTutorial(true)
    } else {
      // For returning users, show loading overlay while data loads
      setShowLoadingOverlay(true)
    }
  }, [])

  // Load full graph from MCP API on component mount
  useEffect(() => {
    const loadFullGraph = async () => {
      try {
        console.log('🏛️ Loading full Grand Débat graph from MCP API...')
        setIsLoadingGraph(true)
        setCurrentProcessingPhase('🏛️ Chargement du graphe complet depuis l\'API...')

        const graphData = await lawGraphRAGService.fetchFullGraph()

        if (graphData && graphData.nodes.length > 0) {
          console.log(`✅ Loaded ${graphData.nodes.length} nodes and ${graphData.relationships.length} relationships from MCP`)

          // Transform to reconciliation data format
          const reconciliationData: ReconciliationGraphData = {
            nodes: graphData.nodes.map(node => ({
              id: node.id,
              labels: node.labels,
              properties: node.properties as Record<string, any>,
              degree: node.degree ?? 1,
              centrality_score: node.centrality_score ?? 0.5
            })),
            relationships: graphData.relationships
          }

          // Store as base graph for subgraph queries
          baseGraphDataRef.current = reconciliationData

          setReconciliationData(reconciliationData)
          setProcessingStats({
            nodes: graphData.nodes.length,
            communities: 0,
            neo4jRelationships: graphData.relationships.length
          })

          console.log('📊 Full graph loaded and displayed')
        } else {
          console.warn('⚠️ No graph data returned from MCP')
          throw new Error('MCP returned empty graph data')
        }
      } catch (error) {
        console.error('❌ Error loading full graph from MCP:', error)
        // Show error to user
        setCurrentProcessingPhase('❌ Erreur de chargement - rechargez la page')
      } finally {
        setIsLoadingGraph(false)
        setShowLoadingOverlay(false)
        setCurrentProcessingPhase(null)
      }
    }

    loadFullGraph()
  }, [])

  // Handler for tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false)
    // If graph is still loading, show the hexagon loading animation
    if (isLoadingGraph) {
      setShowLoadingOverlay(true)
    }
  }


  // Timer effect for processing duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isProcessing && processingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - processingStartTime) / 1000))
      }, 1000)
    } else {
      setElapsedTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, processingStartTime])

  // Helper function to format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }



  const handleHighlightPath = (searchPathData: any) => {
    console.log('🎯 Received search path in BorgesLibrary:', searchPathData)
    setSearchPath(searchPathData)
  }

  const handleClearHighlight = () => {
    console.log('🧹 Clearing highlights in BorgesLibrary')
    setSearchPath(null)
  }

  const handleProcessingStart = () => {
    setIsProcessing(true)
    setProcessingStartTime(Date.now())
    setCurrentProcessingPhase('🔍 Analyse de la requête')
  }

  const handleProcessingPhaseChange = (phase: string) => {
    setCurrentProcessingPhase(phase)
  }

  const handleProcessingEnd = () => {
    setIsProcessing(false)
    setProcessingStartTime(null)
    setCurrentProcessingPhase(null)
  }

  // Store base GraphML data for restoring after queries
  const baseGraphDataRef = useRef<ReconciliationGraphData | null>(null)

  // Update base graph data when GraphML loads
  useEffect(() => {
    if (reconciliationData && reconciliationData.nodes.length > 0 && !baseGraphDataRef.current) {
      baseGraphDataRef.current = reconciliationData
      console.log('📊 Base graph data stored:', reconciliationData.nodes.length, 'nodes')
    }
  }, [reconciliationData])

  const handleSimpleQuery = useCallback(async (query: string) => {
    console.log('🔍 Processing civic query:', query)
    console.log('🏛️ Single-purpose: Grand Débat National GraphRAG')
    console.log('🔧 Current mode:', mode)

    // Clear previous query results but KEEP the base graph visible
    setQueryAnswer('')
    setShowAnswer(false)
    setSearchPath(null)
    setDebugInfo(null)
    // DON'T clear reconciliationData - keep base graph visible for subgraph highlighting

    setIsProcessing(true)
    setProcessingStartTime(Date.now())
    setCurrentProcessingPhase('🏛️ Querying Grand Débat National...')
    setCurrentQuery(query)
    setProcessingStats({ nodes: 0, communities: 0 })

    try {
      // Single-purpose: Grand Débat National GraphRAG only (Constitution v3.0.0)
      console.log('🏛️ Querying Grand Débat National MCP API')
      setCurrentProcessingPhase('🏛️ Analyzing citizen contributions...')

      const result = await lawGraphRAGService.query({ query, mode })

      if (result.success !== false) {
        setCurrentProcessingPhase('✓ Civic analysis complete')
        setQueryAnswer(result.answer || 'Aucune réponse disponible pour cette requête.')

        // Generate query ID for provenance tracking
        const tempQueryId = `civic-query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentQueryId(tempQueryId)
        setShowProvenancePanel(true)
        console.log('📊 Provenance tracking enabled for civic query:', tempQueryId)

        // Extract and store source chunks from the query result for provenance display
        const chunks = result.graphrag_data?.source_chunks || []
        console.log(`📚 Found ${chunks.length} source chunks from MCP query`)
        setSourceChunks(chunks)
        if (chunks.length > 0) {
          setShowSourceChunksPanel(true)
        }

        // Extract provenance entities for CitizenExtractsPanel (Constitution Principle #7)
        const entities = result.graphrag_data?.entities || []
        const grandDebatEntities: GrandDebatEntity[] = entities.map((e: any, idx: number) => ({
          name: e.entity_name || e.name || e.id || '',
          type: e.entity_type || e.type || 'CIVIC_ENTITY',
          description: e.description || '',
          source_commune: e.source_commune || 'Charente-Maritime',
          rank: e.rank || idx + 1
        }))
        console.log(`🏛️ Found ${grandDebatEntities.length} provenance entities`)
        setProvenanceEntities(grandDebatEntities)

        // Transform response to graph data format
        const graphData = lawGraphRAGService.transformToGraphData(result)

        // Build subgraph from base graph based on query keywords
        // MCP often returns no entities, so we search the base graph for relevant nodes
        const baseGraph = baseGraphDataRef.current

        if (graphData && graphData.nodes.length > 0) {
          // MCP returned graph data - use it directly
          console.log('🏛️ Civic graph data from MCP:', graphData.nodes.length, 'nodes,', graphData.relationships.length, 'relationships')

          setProcessingStats({
            nodes: graphData.nodes.length,
            communities: 0,
            neo4jRelationships: graphData.relationships.length
          })

          // Use memoized node normalization - Graph Performance Optimization (006-graph-optimization)
          const normalizedNodes = normalizeGraphNodes(graphData.nodes)

          setQueryResultNodes(normalizedNodes)
          setReconciliationData({
            nodes: normalizedNodes,
            relationships: graphData.relationships
          })

          // Use memoized entity color mapping - Graph Performance Optimization (006-graph-optimization)
          const entitiesToColor = mapNodesToColorEntities(graphData.nodes)

          if (entitiesToColor.length > 0) {
            const enrichedEntities = colorService.enrichEntitiesWithColors(entitiesToColor)
            console.log(`🌈 Civic entities enriched: ${enrichedEntities.length}`)
            setColoredEntities(enrichedEntities)
          }
        } else if (baseGraph && baseGraph.nodes.length > 0) {
          // MCP returned no graph data - build subgraph from base GraphML based on query
          console.log('📊 Building subgraph from base GraphML for query:', query)

          // Use memoized query matcher - Graph Performance Optimization (006-graph-optimization)
          const matchingNodes = createQueryMatcher(query, baseGraph.nodes)

          // If no direct matches, show nodes connected to commune nodes
          let subgraphNodes = matchingNodes
          if (matchingNodes.length === 0) {
            // Fallback: show COMMUNE nodes and their direct neighbors
            const communeNodes = baseGraph.nodes.filter(n =>
              n.labels.some(l => l.toUpperCase() === 'COMMUNE')
            )
            const communeIds = new Set(communeNodes.map(n => n.id))

            // Find edges connected to communes
            const communeEdges = baseGraph.relationships.filter(r =>
              communeIds.has(r.source) || communeIds.has(r.target)
            )

            // Get neighbor node IDs
            const neighborIds = new Set<string>()
            communeEdges.forEach(e => {
              neighborIds.add(e.source)
              neighborIds.add(e.target)
            })

            subgraphNodes = baseGraph.nodes.filter(n => neighborIds.has(n.id))
            console.log(`📊 Using commune-centered subgraph: ${subgraphNodes.length} nodes`)
          } else {
            console.log(`📊 Found ${matchingNodes.length} nodes matching query`)
          }

          // Get IDs of subgraph nodes
          const subgraphNodeIds = new Set(subgraphNodes.map(n => n.id))

          // Filter relationships to only those within subgraph
          const subgraphRelationships = baseGraph.relationships.filter(r =>
            subgraphNodeIds.has(r.source) && subgraphNodeIds.has(r.target)
          )

          setProcessingStats({
            nodes: subgraphNodes.length,
            communities: 0,
            neo4jRelationships: subgraphRelationships.length
          })

          setQueryResultNodes(subgraphNodes)
          setReconciliationData({
            nodes: subgraphNodes,
            relationships: subgraphRelationships
          })

          // Use memoized entity color mapping - Graph Performance Optimization (006-graph-optimization)
          const entitiesToColor = mapNodesToColorEntities(subgraphNodes)

          if (entitiesToColor.length > 0) {
            const enrichedEntities = colorService.enrichEntitiesWithColors(entitiesToColor)
            console.log(`🌈 Subgraph entities enriched: ${enrichedEntities.length}`)
            setColoredEntities(enrichedEntities)
          }

          // Create a search path for highlighting
          setSearchPath({
            entities: subgraphNodes.map(n => ({
              id: n.id,
              name: n.properties?.name || n.id
            })),
            relations: subgraphRelationships.map(r => ({
              source: r.source,
              target: r.target,
              type: r.type
            }))
          })
        } else {
          console.log('⚠️ No graph data available')
          setColoredEntities([])
        }

        // Create debug info for visualization
        const currentNodes = reconciliationData?.nodes || []
        const currentRels = reconciliationData?.relationships || []
        const civicDebugInfo = {
          processing_phases: {
            entity_selection: {
              entities: currentNodes.map((node: any, index: number) => ({
                id: node.properties?.name || node.id,
                name: node.properties?.name || node.id,
                type: node.labels?.[0] || 'CIVIC_ENTITY',
                description: node.properties?.description || '',
                rank: index + 1,
                score: node.centrality_score || 0.5,
                selected: true
              })),
              duration_ms: 500
            },
            community_analysis: { communities: [], duration_ms: 100 },
            relationship_mapping: {
              relationships: currentRels.map((rel: any) => ({
                source: rel.source,
                target: rel.target,
                description: rel.properties?.description || '',
                weight: rel.properties?.weight || 1.0
              })),
              duration_ms: 300
            },
            text_synthesis: { duration_ms: 200 }
          },
          context_stats: {
            total_time_ms: result.processing_time ? result.processing_time * 1000 : 1000,
            mode: 'grand-debat-national',
            prompt_length: query.length
          },
          animation_timeline: [
            { phase: 'explosion', duration: 500, description: 'Analyzing civic entities' },
            { phase: 'filtering', duration: 300, description: 'Mapping commune relationships' },
            { phase: 'synthesis', duration: 300, description: 'Building civic context' },
            { phase: 'crystallization', duration: 200, description: 'Generating civic answer' }
          ]
        }
        setDebugInfo(civicDebugInfo)

        setShowAnswer(true)
      } else {
        throw new Error(result.error || 'Civic GraphRAG query failed')
      }
    } catch (error) {
      console.error('Error processing civic query:', error)

      // Provide user-friendly error messages
      let errorMessage = 'Une erreur est survenue lors du traitement de votre requête.'

      const errorDetail = error instanceof Error ? error.message : 'Unknown error'
      if (errorDetail.includes('fetch') || errorDetail.includes('network') || errorDetail.includes('ECONNREFUSED')) {
        errorMessage = '🏛️ Impossible de se connecter au service Grand Débat National. Vérifiez votre connexion.'
      } else if (errorDetail.includes('timeout') || errorDetail.includes('ETIMEDOUT')) {
        errorMessage = '🏛️ La requête a expiré. Essayez une question plus simple ou réessayez plus tard.'
      } else if (errorDetail.includes('500') || errorDetail.includes('Internal Server')) {
        errorMessage = '🏛️ Le service a rencontré une erreur. Veuillez réessayer plus tard.'
      } else {
        errorMessage = `🏛️ Erreur: ${errorDetail}`
      }
      console.error('Civic GraphRAG error details:', errorDetail)

      setQueryAnswer(errorMessage)
      setShowAnswer(true)
      setColoredEntities([])
    } finally {
      setIsProcessing(false)
      setProcessingStartTime(null)
      setCurrentProcessingPhase(null)
    }
  }, [mode])

  return (
    <div className="min-h-screen bg-datack-black text-datack-light">
      {/* Mobile Navigation Menu - Datack Branding */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="4" width="32" height="32" rx="4" fill="#dbff3b" />
              <path d="M12 10h8c5.5 0 10 4.5 10 10s-4.5 10-10 10h-8V10z" fill="#0a0a0a" />
              <path d="M16 14h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4V14z" fill="#dbff3b" />
            </svg>
            <span className="text-datack-yellow font-bold text-lg">DATACK</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="touch-target flex items-center justify-center text-datack-light"
            aria-label="Fermer le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Single-purpose: Grand Débat National only - no source selection */}
        <div className="mobile-nav-item">
          <label className="text-datack-gray text-sm mb-2 block">Source de données</label>
          <div className="text-datack-light text-sm bg-datack-dark p-3 rounded-datack-sm border border-datack-yellow/30">
            🏛️ Grand Débat National 2019
            <div className="text-xs text-datack-gray mt-1">50 communes · Charente-Maritime</div>
          </div>
        </div>

        {/* Mobile Mode Toggle */}
        <div className="mobile-nav-item">
          <label className="text-datack-gray text-sm mb-2 block">Mode de recherche</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('local')}
              className={`flex-1 py-3 rounded-datack-sm text-center transition-colors ${
                mode === 'local' ? 'bg-datack-yellow text-datack-black font-medium' : 'bg-datack-dark text-datack-light'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setMode('global')}
              className={`flex-1 py-3 rounded-datack-sm text-center transition-colors ${
                mode === 'global' ? 'bg-datack-yellow text-datack-black font-medium' : 'bg-datack-dark text-datack-light'
              }`}
            >
              Global
            </button>
          </div>
        </div>
      </div>

      {/* Header - Datack Branding (Feature 005-agent-orchestration) */}
      <header className={`p-4 md:p-6 border-b border-datack-border relative transition-all duration-300 ${selectedEntityId ? 'md:mr-[450px]' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="mobile-nav-toggle md:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Datack Logo - Yellow accent on dark */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 40 40" fill="none">
              {/* Datack D logo - modernist geometric */}
              <rect x="4" y="4" width="32" height="32" rx="4" fill="#dbff3b" />
              <path d="M12 10h8c5.5 0 10 4.5 10 10s-4.5 10-10 10h-8V10z" fill="#0a0a0a" />
              <path d="M16 14h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4V14z" fill="#dbff3b" />
            </svg>
            <span className="text-datack-yellow font-bold text-lg md:text-xl tracking-tight hidden sm:block">DATACK</span>
          </div>

          <div className="h-8 w-px bg-datack-border hidden sm:block" />

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg md:text-display-mobile lg:text-display text-datack-light tracking-wide font-semibold">
              Grand Débat National
            </h1>
            <p className="text-datack-gray mt-1 text-xs md:text-sm max-w-2xl hidden md:block">
              Explorer les contributions citoyennes · 50 communes de Charente-Maritime · <span className="text-datack-yellow">Cahiers de Doléances 2019</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Adapts when side panel is open */}
      <main className={`h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] transition-all duration-300 ${selectedEntityId ? 'md:mr-[450px]' : ''}`}>
        <div className="h-full flex flex-col">
          {/* Enhanced Query Bar with Controls - Datack Branding */}
          <div className="p-3 md:p-4 bg-datack-secondary border-b border-datack-border">
            <div className="max-w-6xl mx-auto space-y-2 md:space-y-3">
              {/* Main Search Row - Responsive */}
              <div className="responsive-search">
                {/* Desktop-only: Data source indicator (single-purpose) */}
                <div className="hidden md:flex gap-2 items-center">
                  <div className="text-datack-light text-sm bg-datack-dark px-3 py-2 rounded-datack-sm border border-datack-border">
                    🏛️ Grand Débat National
                  </div>
                </div>

                {/* Search Input - Full width on mobile */}
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    placeholder="Quelles sont les préoccupations des citoyens sur les impôts ?"
                    disabled={isProcessing}
                    id="search-input"
                    className="datack-input flex-1 disabled:opacity-50 text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        const query = (e.target as HTMLInputElement).value.trim()
                        if (query) {
                          handleSimpleQuery(query)
                        }
                      }
                    }}
                  />

                  {/* Search Button - Datack Yellow */}
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      const searchInput = document.getElementById('search-input') as HTMLInputElement
                      const query = searchInput?.value.trim()
                      if (query && !isProcessing) {
                        handleSimpleQuery(query)
                      }
                    }}
                    className={`datack-btn-primary disabled:opacity-50 min-w-touch ${isProcessing ? 'animate-pulse-brightness' : ''}`}
                    style={isProcessing ? {
                      animation: 'pulseBrightness 1.2s ease-in-out infinite'
                    } : undefined}
                  >
                    {isProcessing ? <span className="animate-yellow-white-glow">...</span> : <span className="hidden sm:inline">Recherche</span>}
                    <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>

                {/* Desktop-only: Mode Toggle - Datack Yellow Active */}
                <div className="hidden md:flex gap-1 bg-datack-dark rounded-datack-sm p-1 border border-datack-border">
                  <button
                    onClick={() => setMode('local')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded-datack-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === 'local'
                        ? 'bg-datack-yellow text-datack-black'
                        : 'text-datack-muted hover:text-datack-light'
                    }`}
                    title="Recherche locale par commune"
                  >
                    Local
                  </button>
                  <button
                    onClick={() => setMode('global')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded-datack-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === 'global'
                        ? 'bg-datack-yellow text-datack-black'
                        : 'text-datack-muted hover:text-datack-light'
                    }`}
                    title="Recherche globale toutes communes"
                  >
                    Global
                  </button>
                </div>
              </div>

              {/* Mobile-only: Current settings indicator */}
              <div className="flex md:hidden items-center justify-between text-xs text-datack-muted">
                <span>🏛️ Grand Débat National</span>
                <span>{mode === 'local' ? 'Local' : 'Global'}</span>
              </div>
            </div>
          </div>

          {/* 3D Force Graph Visualization with Provenance Panel */}
          <div className="flex-1 flex bg-datack-black relative">
            {/* Main Graph Container */}
            <div className="flex-1 bg-datack-black relative">
              {/* Hexagonal Processing Indicator - Similar to startup animation */}
              {/* Positioned inside graph container to avoid viewport-relative shifts */}
              {/* Only shows during query processing, NOT during initial graph loading */}
              {isProcessing && !isLoadingGraph && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
                  {/* Hexagon Assembly Animation - LARGER and MORE VISIBLE with blue glow */}
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <style>{`
                        @keyframes hexBlueWhite1 {
                          0%, 100% { stroke: #3b82f6; opacity: 0.6; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4)); }
                          50% { stroke: #ffffff; opacity: 1; filter: drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 35px rgba(59, 130, 246, 0.8)); }
                        }
                        @keyframes hexBlueWhite2 {
                          0%, 100% { stroke: #3b82f6; opacity: 0.4; }
                          50% { stroke: #ffffff; opacity: 0.9; }
                        }
                        @keyframes hexBlueWhite3 {
                          0%, 100% { stroke: #3b82f6; opacity: 0.3; }
                          50% { stroke: #ffffff; opacity: 0.85; }
                        }
                        @keyframes shelfBlueWhite {
                          0%, 100% { stroke: #3b82f6; opacity: 0.3; }
                          50% { stroke: #ffffff; opacity: 1; }
                        }
                        @keyframes rotateHex { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .proc-hex-main { animation: hexBlueWhite1 1.5s ease-in-out infinite; }
                        .proc-hex-top { animation: hexBlueWhite2 1.5s ease-in-out 0.1s infinite; }
                        .proc-hex-bl { animation: hexBlueWhite3 1.5s ease-in-out 0.2s infinite; }
                        .proc-hex-br { animation: hexBlueWhite3 1.5s ease-in-out 0.3s infinite; }
                        .proc-shelf { animation: shelfBlueWhite 1s ease-in-out infinite; }
                        .proc-rotate { animation: rotateHex 8s linear infinite; transform-origin: center; }
                      `}</style>

                      {/* Rotating outer ring */}
                      <g className="proc-rotate">
                        <circle cx="100" cy="75" r="70" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="8 4" />
                      </g>

                      {/* Central hexagon - LARGER stroke */}
                      <polygon
                        className="proc-hex-main"
                        points="100,35 135,55 135,95 100,115 65,95 65,55"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        fill="rgba(59, 130, 246, 0.1)"
                      />

                      {/* Book shelves inside - brighter */}
                      <line className="proc-shelf" x1="75" y1="60" x2="125" y2="60" stroke="#60a5fa" strokeWidth="2" style={{ animationDelay: '0s' }} />
                      <line className="proc-shelf" x1="78" y1="72" x2="122" y2="72" stroke="#60a5fa" strokeWidth="2" style={{ animationDelay: '0.15s' }} />
                      <line className="proc-shelf" x1="80" y1="84" x2="120" y2="84" stroke="#60a5fa" strokeWidth="2" style={{ animationDelay: '0.3s' }} />
                      <line className="proc-shelf" x1="83" y1="96" x2="117" y2="96" stroke="#60a5fa" strokeWidth="2" style={{ animationDelay: '0.45s' }} />

                      {/* Top hexagon */}
                      <polygon
                        className="proc-hex-top"
                        points="100,10 125,24 125,52 100,66 75,52 75,24"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        fill="none"
                      />

                      {/* Bottom left hexagon */}
                      <polygon
                        className="proc-hex-bl"
                        points="65,95 90,109 90,137 65,151 40,137 40,109"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        fill="none"
                      />

                      {/* Bottom right hexagon */}
                      <polygon
                        className="proc-hex-br"
                        points="135,95 160,109 160,137 135,151 110,137 110,109"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                  {/* Processing text below hexagon */}
                  <div className="text-center mt-2 text-blue-400 text-sm font-medium animate-pulse">
                    Exploration en cours...
                  </div>
                </div>
              )}
              <GraphErrorBoundary>
                <GraphVisualization3DForce
                  reconciliationData={reconciliationData}
                  searchPath={searchPath}
                  debugInfo={debugInfo}
                  onNodeVisibilityChange={setVisibleNodeIds}
                  onNodeClick={handleNodeClick}
                  isProcessing={isProcessing}
                  currentProcessingPhase={currentProcessingPhase}
                  sidePanelOpen={!!selectedEntityId}
              />

            {/* Interactive Tutorial Overlay */}
            {showTutorial && (
              <TutorialOverlay
                onComplete={handleTutorialComplete}
                isDataLoading={isLoadingGraph}
              />
            )}

            {/* Loading Overlay for returning users (tutorial already seen) */}
            {showLoadingOverlay && !showTutorial && (
              <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center max-w-2xl px-8">
                  {/* Hexagon Library Assembly Animation - Datack Yellow */}
                  <svg className="w-32 h-32 mx-auto mb-6" viewBox="0 0 200 200" fill="none">
                    <style>{`
                      @keyframes hexAssemble1 { 0% { opacity: 0; transform: translate(-30px, -20px); } 50% { opacity: 0.6; } 100% { opacity: 0.8; transform: translate(0, 0); } }
                      @keyframes hexAssemble2 { 0% { opacity: 0; transform: translate(30px, -20px); } 50% { opacity: 0.5; } 100% { opacity: 0.7; transform: translate(0, 0); } }
                      @keyframes hexAssemble3 { 0% { opacity: 0; transform: translate(0, 30px); } 50% { opacity: 0.4; } 100% { opacity: 0.6; transform: translate(0, 0); } }
                      @keyframes hexAssemble4 { 0% { opacity: 0; transform: translate(-20px, 20px); } 50% { opacity: 0.3; } 100% { opacity: 0.5; transform: translate(0, 0); } }
                      @keyframes hexAssemble5 { 0% { opacity: 0; transform: translate(20px, 20px); } 50% { opacity: 0.2; } 100% { opacity: 0.4; transform: translate(0, 0); } }
                      @keyframes bookShimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
                      .hex1-overlay { animation: hexAssemble1 2s ease-out infinite; }
                      .hex2-overlay { animation: hexAssemble2 2s ease-out 0.2s infinite; }
                      .hex3-overlay { animation: hexAssemble3 2s ease-out 0.4s infinite; }
                      .hex4-overlay { animation: hexAssemble4 2s ease-out 0.6s infinite; }
                      .hex5-overlay { animation: hexAssemble5 2s ease-out 0.8s infinite; }
                      .book-line-overlay { animation: bookShimmer 3s ease-in-out infinite; }
                    `}</style>

                    {/* Central hexagon - main library cell */}
                    <polygon
                      className="hex1-overlay"
                      points="100,40 130,57.5 130,92.5 100,110 70,92.5 70,57.5"
                      stroke="#dbff3b"
                      strokeWidth="1.5"
                      fill="none"
                    />

                    {/* Top hexagon */}
                    <polygon
                      className="hex2-overlay"
                      points="100,10 125,25 125,55 100,70 75,55 75,25"
                      stroke="#dbff3b"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom left hexagon */}
                    <polygon
                      className="hex3-overlay"
                      points="70,95 95,110 95,140 70,155 45,140 45,110"
                      stroke="#dbff3b"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom right hexagon */}
                    <polygon
                      className="hex4-overlay"
                      points="130,95 155,110 155,140 130,155 105,140 105,110"
                      stroke="#dbff3b"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Far left hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="50,60 75,75 75,105 50,120 25,105 25,75"
                      stroke="#dbff3b"
                      strokeWidth="0.8"
                      fill="none"
                    />

                    {/* Far right hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="150,60 175,75 175,105 150,120 125,105 125,75"
                      stroke="#dbff3b"
                      strokeWidth="0.8"
                      fill="none"
                      style={{ animationDelay: '1s' }}
                    />

                    {/* Book lines inside central hexagon - simulating shelves */}
                    <line className="book-line-overlay" x1="80" y1="65" x2="120" y2="65" stroke="#dbff3b" strokeWidth="0.5" />
                    <line className="book-line-overlay" x1="82" y1="75" x2="118" y2="75" stroke="#dbff3b" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
                    <line className="book-line-overlay" x1="84" y1="85" x2="116" y2="85" stroke="#dbff3b" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
                  </svg>

                  {/* Project concept introduction */}
                  <h2 className="text-xl font-semibold text-gray-800 mb-3 tracking-wide">Grand Débat National</h2>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Explorer les contributions citoyennes des Cahiers de Doléances 2019.
                    Ce graphe de connaissances révèle les thèmes, préoccupations et propositions
                    exprimés par les citoyens de <span className="text-gray-800 font-medium">50 communes de Charente-Maritime</span>.
                  </p>

                  {/* Loading progress indicator */}
                  {isGraphMLLoading && (
                    <div className="mb-4 text-datack-yellow text-sm font-medium animate-pulse">
                      <span>Chargement du graphe civique...</span>
                    </div>
                  )}
                  {loadingProgress && !isGraphMLLoading && (
                    <div className="mb-4 text-gray-800 text-sm font-medium">
                      {loadingProgress.step === 'nodes' && (
                        <span>Exploration des contributions... {loadingProgress.current}/{loadingProgress.total}</span>
                      )}
                      {loadingProgress.step === 'relations' && (
                        <span>Tissage des connexions civiques... {loadingProgress.current}/{loadingProgress.total}</span>
                      )}
                      {loadingProgress.step === 'building' && (
                        <span>Construction du graphe citoyen... {loadingProgress.current} entités</span>
                      )}
                    </div>
                  )}

                  {/* Rotating civic quote with fade animation */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div
                      key={currentQuoteIndex}
                      className="text-gray-500 text-xs italic max-w-lg mx-auto transition-opacity duration-1000 animate-fade-in"
                    >
                      {civicQuotes[currentQuoteIndex]}
                    </div>
                    <div className="text-gray-400 text-xs mt-2">— Grand Débat National 2019</div>
                  </div>
                </div>
              </div>
            )}

            {/* GraphML error display removed - now using MCP API */}
            </GraphErrorBoundary>
            </div>

          </div>
        </div>
      </main>

      {/* Entity Detail Modal */}
      {selectedEntityId && (
        <EntityDetailModal
          entityId={selectedEntityId}
          entityName={selectedEntityName || undefined}
          reconciliationData={reconciliationData}
          onClose={handleCloseEntityModal}
          ragSourceChunks={sourceChunks}
          currentQuery={currentQuery}
        />
      )}

      {/* Citizen Extracts now merged into EntityDetailModal - Constitution Principle #7 */}

      {/* Answer Panel - Datack Branding - Resizable bottom sheet on mobile, side panel on desktop */}
      {showAnswer && (
        <div
          className="datack-panel fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto w-full md:w-[400px] md:max-h-[45vh] overflow-hidden text-datack-light shadow-datack-lg z-30 rounded-t-2xl md:rounded-datack-md safe-area-bottom flex flex-col"
          style={{
            height: typeof window !== 'undefined' && window.innerWidth < 768 ? `${answerPanelHeight}vh` : undefined,
            maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? `${answerPanelHeight}vh` : undefined
          }}
        >
          {/* Mobile drag handle - draggable to resize */}
          <div
            className="md:hidden flex justify-center py-2 cursor-ns-resize touch-none select-none"
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY
              const startHeight = answerPanelHeight
              const viewportHeight = window.innerHeight

              const handleTouchMove = (moveEvent: TouchEvent) => {
                const currentY = moveEvent.touches[0].clientY
                const deltaY = startY - currentY
                const deltaVh = (deltaY / viewportHeight) * 100
                const newHeight = Math.min(80, Math.max(15, startHeight + deltaVh))
                setAnswerPanelHeight(newHeight)
              }

              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove)
                document.removeEventListener('touchend', handleTouchEnd)
              }

              document.addEventListener('touchmove', handleTouchMove)
              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            <div className="w-12 h-1.5 bg-datack-border rounded-full"></div>
          </div>
          <div className="flex justify-between items-start mb-2 md:mb-3 px-1">
            <h3 className="text-sm md:text-h3 text-datack-light font-medium">Réponse citoyenne</h3>
            <div className="flex items-center gap-1">
              {/* Mobile expand/collapse button */}
              <button
                onClick={() => setAnswerPanelHeight(answerPanelHeight < 40 ? 65 : 20)}
                className="md:hidden datack-btn-ghost p-1 touch-target flex items-center justify-center"
                aria-label={answerPanelHeight < 40 ? "Développer" : "Réduire"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {answerPanelHeight < 40 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => setShowAnswer(false)}
                className="datack-btn-ghost text-lg touch-target flex items-center justify-center"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="text-xs text-datack-muted mb-1 hidden md:block">Réponse:</div>
            <div className="flex-1 overflow-y-auto pr-2">
              <HighlightedText
                text={queryAnswer}
                entities={coloredEntities}
                className="text-sm text-datack-light leading-relaxed break-words"
                onEntityClick={handleEntityClick}
                showTooltip={true}
              />
            </div>
            {/* Show sources button - opens EntityDetailModal with RAG chunks */}
            {sourceChunks.length > 0 && (
              <div className="pt-2 mt-2 border-t border-datack-border flex-shrink-0">
                <button
                  onClick={() => {
                    // Open EntityDetailModal in "sources only" mode by using a special entity ID
                    setSelectedEntityId('__rag_sources__')
                    setSelectedEntityName('Sources citoyennes')
                  }}
                  className="w-full py-2 px-3 text-sm bg-datack-yellow/10 hover:bg-datack-yellow/20 border border-datack-yellow/30 rounded-datack-sm text-datack-light flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-datack-yellow">📜</span>
                  Voir les {sourceChunks.length} sources citoyennes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Chunks Panel - REMOVED: Now merged into EntityDetailModal (Feature 005-agent-orchestration) */}
      {/* Constitution Principle V: End-to-End Interpretability - chunks shown via entity modal */}

      {/* TextChunkModal for entity source exploration */}
      {entityChunkData && (
        <TextChunkModal
          isOpen={isEntityChunkModalOpen}
          onClose={() => {
            setIsEntityChunkModalOpen(false)
            setEntityChunkData(null)
          }}
          chunkText={entityChunkData.aggregatedChunks}
          bookId={entityChunkData.communeId}
          entities={coloredEntities.filter(e => e.id === entityChunkData.entityName)}
          relationshipInfo={{
            sourceNode: entityChunkData.entityName,
            targetNode: `${entityChunkData.relatedRelationships} relations`,
            relationType: 'ENTITY_CONTEXT'
          }}
        />
      )}
    </div>
  )
}

export default BorgesLibrary;