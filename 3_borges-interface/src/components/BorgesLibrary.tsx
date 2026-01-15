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
            stroke="#0066FF"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Top hexagon */}
          <polygon
            className="hex2"
            points="100,10 125,25 125,55 100,70 75,55 75,25"
            stroke="#0066FF"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom left hexagon */}
          <polygon
            className="hex3"
            points="70,95 95,110 95,140 70,155 45,140 45,110"
            stroke="#0066FF"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom right hexagon */}
          <polygon
            className="hex4"
            points="130,95 155,110 155,140 130,155 105,140 105,110"
            stroke="#0066FF"
            strokeWidth="1"
            fill="none"
          />

          {/* Far left hexagon */}
          <polygon
            className="hex5"
            points="50,60 75,75 75,105 50,120 25,105 25,75"
            stroke="#0066FF"
            strokeWidth="0.8"
            fill="none"
          />

          {/* Far right hexagon */}
          <polygon
            className="hex5"
            points="150,60 175,75 175,105 150,120 125,105 125,75"
            stroke="#0066FF"
            strokeWidth="0.8"
            fill="none"
            style={{ animationDelay: '1s' }}
          />

          {/* Connection lines inside central hexagon - Datack Yellow */}
          <line className="book-line" x1="80" y1="65" x2="120" y2="65" stroke="#0066FF" strokeWidth="0.5" />
          <line className="book-line" x1="82" y1="75" x2="118" y2="75" stroke="#0066FF" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
          <line className="book-line" x1="84" y1="85" x2="116" y2="85" stroke="#0066FF" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
        </svg>
        <div className="text-datack-muted text-xs max-w-lg text-center">Chargement du graphe citoyen...</div>
      </div>
    </div>
  )
})
import { GraphErrorBoundary } from './GraphErrorBoundary'
import HighlightedText from './HighlightedText'
import LoadingWheel3D from './LoadingWheel3D'
import TutorialOverlay from './TutorialOverlay'
import TextChunkModal from './TextChunkModal'
import ProvenancePanel from './ProvenancePanel'
import EntityDetailModal from './EntityDetailModal'
import CommuneSelector, { CommuneSelectorMobile, type Commune } from './CommuneSelector'
import CitizenQuotesPanel from './CitizenQuotesPanel'
import CommuneFilterChips from './CommuneFilterChips'
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
  // Track if this is a first-time user (for progressive vs instant loading)
  const isFirstTimeUserRef = useRef<boolean | null>(null)
  // Initialize tutorial state - will be set correctly on client mount
  const [showTutorial, setShowTutorial] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)

  // Set tutorial state on client mount to avoid SSR/hydration issues
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('borges-tutorial-seen')
    const isFirstTime = !tutorialSeen
    isFirstTimeUserRef.current = isFirstTime

    console.log('🎓 MOUNT EFFECT - Tutorial check:', {
      tutorialSeen,
      isFirstTime,
      willShowTutorial: isFirstTime,
      willShowLoadingOverlay: !isFirstTime
    })

    if (isFirstTime) {
      console.log('🎓 Setting showTutorial = true (first-time user)')
      setShowTutorial(true)
    } else {
      console.log('🔄 Setting showLoadingOverlay = true (returning user)')
      setShowLoadingOverlay(true)
    }
    setIsClientMounted(true)
    console.log('✅ Client mounted, isClientMounted = true')
  }, [])
  const [loadingProgress, setLoadingProgress] = useState<{ step: string; current: number; total: number } | null>(null)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])
  const [searchPath, setSearchPath] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [provenanceGraphData, setProvenanceGraphData] = useState<ReconciliationGraphData | null>(null)  // MCP subgraph for progressive display
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingPhase, setCurrentProcessingPhase] = useState<string | null>(null)
  const [queryProgress, setQueryProgress] = useState(0) // Progress bar percentage (0-100)
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [queryAnswer, setQueryAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [answerPanelHeight, setAnswerPanelHeight] = useState(30) // Default 30vh on mobile
  const [desktopPanelHeight, setDesktopPanelHeight] = useState(45) // Default 45vh on desktop
  const [desktopPanelWidth, setDesktopPanelWidth] = useState(420) // Default 420px on desktop
  // Entity coloring state for interpretability
  const [coloredEntities, setColoredEntities] = useState<EntityColorInfo[]>([])
  // Query error handling state
  const [queryError, setQueryError] = useState<string | null>(null)
  const [showErrorAlert, setShowErrorAlert] = useState(false)

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

  // Commune selection for filtered/comparative analysis (Constitution Principles #2, #3)
  const [availableCommunes, setAvailableCommunes] = useState<Commune[]>([])
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(true)
  const [currentCommuneCount, setCurrentCommuneCount] = useState<number>(0)

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

  // Auto-dismiss error alert after 10 seconds (user can manually dismiss earlier)
  useEffect(() => {
    if (showErrorAlert) {
      const timeout = setTimeout(() => {
        setShowErrorAlert(false)
      }, 10000)
      return () => clearTimeout(timeout)
    }
  }, [showErrorAlert])

  // Fetch available communes on mount (Constitution Principle #2: Commune-Centric)
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        setLoadingCommunes(true)
        const communes = await lawGraphRAGService.fetchCommunes()
        // Sort communes alphabetically
        const sortedCommunes = communes.sort((a, b) => a.name.localeCompare(b.name))
        setAvailableCommunes(sortedCommunes)
        console.log(`🏛️ Loaded ${sortedCommunes.length} communes for selection`)
      } catch (error) {
        console.error('Failed to fetch communes:', error)
      } finally {
        setLoadingCommunes(false)
      }
    }
    fetchCommunes()
  }, [])

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

  // Load GraphML data for instant startup visualization (Constitution Principle - instant graph display)
  // GraphML file contains the 50 communes with their relationships
  const {
    document: graphMLDocument,
    isLoading: isGraphMLLoading,
    error: graphMLError
  } = useGraphMLData({
    url: '/data/grand-debat.graphml',
    filterOrphans: true, // Constitution Principle I: No orphan nodes
    onLoad: (doc) => {
      console.log(`📊 GraphML loaded: ${doc.nodes.length} nodes, ${doc.edges.length} edges`)
    },
    onError: (err) => {
      console.error('❌ GraphML loading error:', err)
    }
  })

  // Tutorial state now initialized synchronously above to avoid race conditions

  // Transform GraphML data to reconciliation format when loaded
  useEffect(() => {
    if (graphMLDocument && graphMLDocument.nodes.length > 0) {
      console.log('🏛️ Transforming GraphML data for visualization...')
      setCurrentProcessingPhase('🏛️ Chargement du graphe citoyen...')

      // Transform GraphML to reconciliation data format
      const transformedData = transformToReconciliationData(graphMLDocument)

      const graphData: ReconciliationGraphData = {
        nodes: transformedData.nodes.map(node => ({
          id: node.id,
          labels: node.labels,
          properties: node.properties,
          degree: typeof node.degree === 'number' ? node.degree : 1,
          centrality_score: typeof node.centrality_score === 'number' ? node.centrality_score : 0.5
        })),
        relationships: transformedData.relationships.map(rel => ({
          id: rel.id,
          type: rel.type,
          source: rel.source,
          target: rel.target,
          properties: rel.properties
        }))
      }

      // Store as base graph for subgraph queries
      baseGraphDataRef.current = graphData

      setReconciliationData(graphData)
      setProcessingStats({
        nodes: graphData.nodes.length,
        communities: 0,
        neo4jRelationships: graphData.relationships.length
      })

      console.log(`✅ Graph loaded: ${graphData.nodes.length} nodes, ${graphData.relationships.length} relationships`)

      // Wait for client mount before hiding loading (prevents race condition with tutorial check)
      // This ensures isFirstTimeUserRef.current is set before we decide to hide loading
      if (!isClientMounted) {
        console.log('⏳ GRAPHML EFFECT - Waiting for client mount before hiding loading...')
        return
      }

      console.log('🔍 GRAPHML EFFECT - Loading decision:', {
        showTutorial,
        isClientMounted,
        willHideLoading: !showTutorial
      })

      // Don't hide loading state if tutorial is still showing (first-time users)
      // This prevents the tutorial from disappearing when GraphML loads quickly
      if (!showTutorial) {
        console.log('🔓 GRAPHML EFFECT - Hiding loading (returning user path)')
        setIsLoadingGraph(false)
        setShowLoadingOverlay(false)
      } else {
        console.log('🔒 GRAPHML EFFECT - Keeping loading visible (tutorial still showing)')
      }
      setCurrentProcessingPhase(null)
    }
  }, [graphMLDocument, showTutorial, isClientMounted])

  // Handle GraphML loading errors
  useEffect(() => {
    if (graphMLError) {
      console.error('❌ GraphML loading failed:', graphMLError)
      setCurrentProcessingPhase('❌ Erreur de chargement du graphe')
      setIsLoadingGraph(false)
      setShowLoadingOverlay(false)
    }
  }, [graphMLError])

  // Background fetch: Load full graph from MCP API after GraphML displays
  // First-time users: Progressive loading with batches (see graph expand)
  // Returning users: Instant loading (full graph immediately)
  useEffect(() => {
    // Wait for client mount to ensure isFirstTimeUserRef.current is set
    // This prevents the race condition where we check user type before it's determined
    if (!isClientMounted) return

    // Only fetch once, after GraphML has loaded (prevents race condition)
    if (mcpFetchedRef.current || !graphMLDocument || isGraphMLLoading) return

    const fetchFullMCPGraph = async () => {
      mcpFetchedRef.current = true  // Mark as initiated to prevent duplicate calls

      const isFirstTime = isFirstTimeUserRef.current
      console.log('🚀 MCP FETCH - Starting fetch:', {
        isFirstTime,
        isFirstTimeUserRef: isFirstTimeUserRef.current,
        path: isFirstTime ? 'progressive' : 'instant'
      })

      try {
        if (isFirstTime) {
          // FIRST-TIME USERS: Progressive loading with batches
          console.log('🎬 MCP FETCH - First-time user: Progressive loading in batches...')

          await lawGraphRAGService.fetchFullGraphProgressive(
            (graphData, progress) => {
              // Callback fired after each batch (5, 10, 15, 20... 50 communes)
              setCurrentProcessingPhase(`🌐 Chargement ${progress.current}/${progress.total} communes...`)
              setCurrentCommuneCount(progress.current)

              console.log(`✅ Batch ${progress.current}/${progress.total}: ${graphData.nodes.length} nodes`)

              // Transform to reconciliation data format
              const enrichedData: ReconciliationGraphData = {
                nodes: graphData.nodes.map(node => ({
                  id: node.id,
                  labels: node.labels,
                  properties: node.properties as Record<string, any>,
                  degree: node.degree ?? 1,
                  centrality_score: node.centrality_score ?? 0.5
                })),
                relationships: graphData.relationships
              }

              // Update graph smoothly with new batch (replaces previous - cumulative)
              baseGraphDataRef.current = enrichedData
              setReconciliationData(enrichedData)
              setProcessingStats({
                nodes: enrichedData.nodes.length,
                communities: 0,
                neo4jRelationships: enrichedData.relationships.length
              })
            },
            5,  // Batch size: 5 communes at a time (10 batches total)
            50  // Total: 50 communes
          )

          console.log('📊 Progressive loading complete!')
        } else {
          // RETURNING USERS: Instant full graph loading
          console.log('⚡ MCP FETCH - Returning user: Loading full graph instantly...')

          const graphData = await lawGraphRAGService.fetchFullGraph()

          if (graphData && graphData.nodes.length > 0) {
            setCurrentCommuneCount(50)

            const enrichedData: ReconciliationGraphData = {
              nodes: graphData.nodes.map(node => ({
                id: node.id,
                labels: node.labels,
                properties: node.properties as Record<string, any>,
                degree: node.degree ?? 1,
                centrality_score: node.centrality_score ?? 0.5
              })),
              relationships: graphData.relationships
            }

            baseGraphDataRef.current = enrichedData
            setReconciliationData(enrichedData)
            setProcessingStats({
              nodes: enrichedData.nodes.length,
              communities: 0,
              neo4jRelationships: enrichedData.relationships.length
            })

            console.log(`⚡ Instant load complete: ${graphData.nodes.length} nodes`)
          }
        }
      } catch (error) {
        console.warn('⚠️ MCP fetch failed (GraphML still displayed):', error)
        // Don't show error - GraphML is still displayed
      } finally {
        setCurrentProcessingPhase(null)
        setShowLoadingOverlay(false)
      }
    }

    // Delay slightly to ensure GraphML renders first
    const timer = setTimeout(fetchFullMCPGraph, 500)
    return () => clearTimeout(timer)
  }, [graphMLDocument, isGraphMLLoading, isClientMounted])

  // Handler for tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false)
    // Graph is now ready (GraphML loaded during tutorial)
    setIsLoadingGraph(false)
    setShowLoadingOverlay(false)
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
    setProvenanceGraphData(null)  // Restore full graph
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

  // Track if MCP background fetch has already been initiated (prevents race condition)
  const mcpFetchedRef = useRef(false)

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
    setProvenanceGraphData(null)  // Clear previous provenance subgraph
    setDebugInfo(null)
    setQueryError(null)
    setShowErrorAlert(false)
    // DON'T clear reconciliationData - keep base graph visible for subgraph highlighting

    setIsProcessing(true)
    setProcessingStartTime(Date.now())
    setCurrentProcessingPhase('🏛️ Querying Grand Débat National...')
    setCurrentQuery(query)
    setProcessingStats({ nodes: 0, communities: 0 })
    setQueryProgress(0) // Reset progress bar

    try {
      // Single-purpose: Grand Débat National GraphRAG only (Constitution v3.0.0)
      console.log('🏛️ Querying Grand Débat National MCP API')
      setCurrentProcessingPhase('🏛️ Analyzing citizen contributions...')

      // Progress bar: increment smoothly to 95% over 120 seconds
      const progressInterval = setInterval(() => {
        setQueryProgress(prev => {
          if (prev >= 95) return 95 // Cap at 95% until query completes
          return prev + (100 / 120 / 10) // Increment by ~0.083% every 100ms
        })
      }, 100)

      // Show extended wait message after 45 seconds
      const extendedWaitTimer = setTimeout(() => {
        setCurrentProcessingPhase('🏛️ Beaucoup de citoyens se sont exprimés sur cette question... merci de patienter')
      }, 45000)

      // Create timeout promise (120 seconds - increased for large queries)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          clearInterval(progressInterval)
          clearTimeout(extendedWaitTimer)
          reject(new Error('TIMEOUT'))
        }, 120000)
      })

      // Build query params with optional commune filtering
      // Constitution Principles #2 (Commune-Centric) and #3 (Cross-Commune Analysis)
      const queryParams: { query: string; mode: 'local' | 'global'; commune_ids?: string[] } = {
        query,
        mode
      }

      // Only include commune_ids if a subset of communes is selected (not all)
      if (selectedCommunes.length > 0 && selectedCommunes.length < availableCommunes.length) {
        queryParams.commune_ids = selectedCommunes
        console.log(`🏛️ Filtering by ${selectedCommunes.length} selected communes`)
      }

      // Race between query and timeout
      const result = await Promise.race([
        lawGraphRAGService.query(queryParams),
        timeoutPromise
      ])

      // Clear the extended wait timer and progress interval since query completed
      clearTimeout(extendedWaitTimer)
      clearInterval(progressInterval)
      setQueryProgress(100) // Complete the progress bar

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

          // Set provenanceGraphData for progressive display of MCP subgraph
          // This is the community detection + multi-hop subgraph from GraphRAG
          setProvenanceGraphData({
            nodes: normalizedNodes,
            relationships: graphData.relationships
          })
          console.log(`🎯 ProvenanceGraphData set: ${normalizedNodes.length} nodes, ${graphData.relationships.length} relationships`)

          // Use memoized entity color mapping - Graph Performance Optimization (006-graph-optimization)
          const entitiesToColor = mapNodesToColorEntities(graphData.nodes)

          if (entitiesToColor.length > 0) {
            const enrichedEntities = colorService.enrichEntitiesWithColors(entitiesToColor)
            console.log(`🌈 Civic entities enriched: ${enrichedEntities.length}`)
            setColoredEntities(enrichedEntities)
          }

          // Keep searchPath for entity highlighting (used by animation effect)
          setSearchPath({
            entities: normalizedNodes.map(n => ({
              id: n.properties?.name || n.id,
              name: n.properties?.name || n.id
            })),
            relations: graphData.relationships.map(r => ({
              source: r.source,
              target: r.target,
              type: r.type
            }))
          })
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
      if (errorDetail === 'TIMEOUT') {
        errorMessage = 'La requête a dépassé le délai maximum de 45 secondes. Le serveur MCP ne répond pas.'
      } else if (errorDetail.includes('fetch') || errorDetail.includes('network') || errorDetail.includes('ECONNREFUSED')) {
        errorMessage = 'Impossible de se connecter au service Grand Débat National. Vérifiez que le serveur MCP est accessible.'
      } else if (errorDetail.includes('timeout') || errorDetail.includes('ETIMEDOUT')) {
        errorMessage = 'La requête a expiré. Le serveur MCP met trop de temps à répondre.'
      } else if (errorDetail.includes('500') || errorDetail.includes('Internal Server')) {
        errorMessage = 'Le service a rencontré une erreur interne. Veuillez réessayer plus tard.'
      } else {
        errorMessage = `Erreur: ${errorDetail}`
      }
      console.error('Civic GraphRAG error details:', errorDetail)

      // Set error state and show alert
      setQueryError(errorMessage)
      setShowErrorAlert(true)
      setColoredEntities([])
    } finally {
      setIsProcessing(false)
      setProcessingStartTime(null)
      setCurrentProcessingPhase(null)
    }
  }, [mode, selectedCommunes, availableCommunes])

  return (
    <div className="min-h-screen bg-datack-black text-datack-light">
      {/* Mobile Navigation Menu - Datack Branding */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            {/* Heretica Logo - Blue circle with serif text (mobile nav) */}
            <div className="relative flex items-center justify-center">
              <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#0066FF" strokeWidth="2" fill="none" />
              </svg>
              <span className="absolute font-heretica-serif font-semibold text-sm text-heretica-blue">H</span>
            </div>
            <span className="font-heretica-serif font-semibold text-xl text-heretica-blue tracking-wide">HERETICA</span>
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

        {/* Mobile Commune Selector - Constitution Principles #2, #3 */}
        <CommuneSelectorMobile
          communes={availableCommunes}
          selectedCommunes={selectedCommunes}
          onSelectionChange={setSelectedCommunes}
          disabled={isProcessing || loadingCommunes}
        />

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

          {/* Heretica Logo - Blue circle with serif text */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative flex items-center justify-center">
              {/* Circle element from logo */}
              <svg className="w-10 h-10 md:w-12 md:h-12" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#0066FF" strokeWidth="2" fill="none" />
              </svg>
              {/* Heretica text overlay */}
              <span className="absolute font-heretica-serif font-semibold text-xs md:text-sm text-heretica-blue tracking-wide">H</span>
            </div>
            <span className="font-heretica-serif font-semibold text-lg md:text-xl text-heretica-blue tracking-wide hidden xs:inline">HERETICA</span>
          </div>

          <div className="h-8 w-px bg-datack-border hidden sm:block" />

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg md:text-display-mobile lg:text-display text-datack-light tracking-wide font-semibold">
              Grand Débat National
            </h1>
            <p className="text-datack-gray mt-1 text-xs md:text-sm max-w-2xl hidden md:block">
              Explorer les contributions citoyennes · 50 communes de Charente-Maritime · <span className="bg-heretica-blue text-white px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">Cahiers de Doléances 2019</span>
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

                {/* Commune Selector - Constitution Principles #2, #3 */}
                <CommuneSelector
                  communes={availableCommunes}
                  selectedCommunes={selectedCommunes}
                  onSelectionChange={setSelectedCommunes}
                  disabled={isProcessing || loadingCommunes}
                  className="hidden md:block"
                />

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
                    className={`px-4 py-2 bg-heretica-blue text-white font-medium hover:opacity-80 transition-colors rounded disabled:opacity-50 min-w-touch ${isProcessing ? 'animate-pulse-brightness' : ''}`}
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

                {/* Desktop-only: Mode Toggle - Datack Inverted (black bg + yellow text) */}
                <div className="hidden md:flex gap-1 bg-datack-dark rounded-datack-sm p-1 border border-datack-border">
                  <button
                    onClick={() => setMode('local')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                      mode === 'local'
                        ? 'bg-heretica-blue text-white'
                        : 'text-datack-muted hover:text-datack-light'
                    }`}
                    title="Recherche locale par commune"
                  >
                    Local
                  </button>
                  <button
                    onClick={() => setMode('global')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                      mode === 'global'
                        ? 'bg-heretica-blue text-white'
                        : 'text-datack-muted hover:text-datack-light'
                    }`}
                    title="Recherche globale toutes communes"
                  >
                    Global
                  </button>
                </div>
              </div>

              {/* Commune Filter Chips - Constitution Principle II (Civic Provenance) */}
              <CommuneFilterChips
                selectedCommunes={selectedCommunes}
                availableCommunes={availableCommunes}
                onRemove={(communeId) => {
                  setSelectedCommunes(prev => prev.filter(id => id !== communeId))
                }}
                maxCommunes={availableCommunes.length}
              />

              {/* Mobile-only: Current settings indicator */}
              <div className="flex md:hidden items-center justify-between text-xs text-datack-muted">
                <span>
                  🏛️ {selectedCommunes.length > 0 && selectedCommunes.length < availableCommunes.length
                    ? `${selectedCommunes.length} commune${selectedCommunes.length > 1 ? 's' : ''}`
                    : 'Grand Débat National'}
                </span>
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
                  {/* Civic Contributions Animation - Documents flowing into civic assembly */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <style>{`
                        @keyframes docFloat1 {
                          0% { transform: translate(-60px, -40px) rotate(-15deg); opacity: 0; }
                          50% { opacity: 0.8; }
                          100% { transform: translate(0, 0) rotate(0deg); opacity: 0.9; }
                        }
                        @keyframes docFloat2 {
                          0% { transform: translate(60px, -40px) rotate(15deg); opacity: 0; }
                          50% { opacity: 0.7; }
                          100% { transform: translate(0, 0) rotate(0deg); opacity: 0.85; }
                        }
                        @keyframes docFloat3 {
                          0% { transform: translate(-50px, 40px) rotate(-10deg); opacity: 0; }
                          50% { opacity: 0.6; }
                          100% { transform: translate(0, 0) rotate(0deg); opacity: 0.8; }
                        }
                        @keyframes docFloat4 {
                          0% { transform: translate(50px, 40px) rotate(10deg); opacity: 0; }
                          50% { opacity: 0.5; }
                          100% { transform: translate(0, 0) rotate(0deg); opacity: 0.75; }
                        }
                        @keyframes civicPulse {
                          0%, 100% {
                            fill: #0066FF;
                            filter: drop-shadow(0 0 6px rgba(0, 102, 255, 0.4));
                          }
                          50% {
                            fill: #0066FF;
                            filter: drop-shadow(0 0 12px rgba(0, 102, 255, 0.6));
                          }
                        }
                        @keyframes gatherRing {
                          0% { stroke-dashoffset: 0; opacity: 0.3; }
                          100% { stroke-dashoffset: -440; opacity: 0.15; }
                        }
                        @keyframes textGlow {
                          0%, 100% {
                            text-shadow: 0 0 8px rgba(0, 102, 255, 0.4), 0 0 16px rgba(0, 102, 255, 0.2);
                          }
                          50% {
                            text-shadow: 0 0 16px rgba(0, 102, 255, 0.6), 0 0 24px rgba(0, 102, 255, 0.3), 0 0 32px rgba(0, 102, 255, 0.1);
                          }
                        }
                        .doc-1 { animation: docFloat1 2s ease-in-out infinite; }
                        .doc-2 { animation: docFloat2 2s ease-in-out 0.3s infinite; }
                        .doc-3 { animation: docFloat3 2s ease-in-out 0.6s infinite; }
                        .doc-4 { animation: docFloat4 2s ease-in-out 0.9s infinite; }
                        .civic-center { animation: civicPulse 2s ease-in-out infinite; }
                        .gather-ring { animation: gatherRing 3s linear infinite; }
                      `}</style>

                      {/* Gathering ring - shows documents converging */}
                      <circle
                        className="gather-ring"
                        cx="100"
                        cy="100"
                        r="70"
                        stroke="#0066FF"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="10 5"
                      />

                      {/* Floating contribution documents (cahiers) - coming from 4 directions */}
                      {/* Top-left document */}
                      <g className="doc-1">
                        <rect x="85" y="85" width="14" height="18" rx="1" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.2" opacity="0.9" />
                        <line x1="88" y1="89" x2="96" y2="89" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="88" y1="92" x2="96" y2="92" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="88" y1="95" x2="94" y2="95" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                      </g>

                      {/* Top-right document */}
                      <g className="doc-2">
                        <rect x="101" y="85" width="14" height="18" rx="1" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.2" opacity="0.85" />
                        <line x1="104" y1="89" x2="112" y2="89" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="104" y1="92" x2="112" y2="92" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="104" y1="95" x2="110" y2="95" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                      </g>

                      {/* Bottom-left document */}
                      <g className="doc-3">
                        <rect x="85" y="105" width="14" height="18" rx="1" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.2" opacity="0.8" />
                        <line x1="88" y1="109" x2="96" y2="109" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="88" y1="112" x2="96" y2="112" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="88" y1="115" x2="94" y2="115" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                      </g>

                      {/* Bottom-right document */}
                      <g className="doc-4">
                        <rect x="101" y="105" width="14" height="18" rx="1" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.2" opacity="0.75" />
                        <line x1="104" y1="109" x2="112" y2="109" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="104" y1="112" x2="112" y2="112" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                        <line x1="104" y1="115" x2="110" y2="115" stroke="#0066FF" strokeWidth="0.6" opacity="0.5" />
                      </g>

                      {/* Central civic assembly icon (simplified town hall/mairie) */}
                      <g>
                        {/* Building base */}
                        <rect x="85" y="95" width="30" height="25" rx="2" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.8" opacity="0.9" />

                        {/* Columns */}
                        <line x1="90" y1="95" x2="90" y2="120" stroke="#0066FF" strokeWidth="1.2" opacity="0.5" />
                        <line x1="100" y1="95" x2="100" y2="120" stroke="#0066FF" strokeWidth="1.2" opacity="0.5" />
                        <line x1="110" y1="95" x2="110" y2="120" stroke="#0066FF" strokeWidth="1.2" opacity="0.5" />

                        {/* Pediment (triangular roof) */}
                        <path d="M 80 95 L 100 85 L 120 95 Z" fill="#0a0a0a" stroke="#0066FF" strokeWidth="1.8" opacity="0.9" />

                        {/* Central pulsing dot (represents active consultation) */}
                        <circle className="civic-center" cx="100" cy="107" r="3" />
                      </g>

                      {/* Citizen voices/contributions indicators (small dots gathering) */}
                      <circle cx="75" cy="100" r="1.5" fill="#0066FF" opacity="0.4">
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="125" cy="100" r="1.5" fill="#0066FF" opacity="0.4">
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="0.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="100" cy="80" r="1.5" fill="#0066FF" opacity="0.4">
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="100" cy="130" r="1.5" fill="#0066FF" opacity="0.4">
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1.5s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>
                  {/* Processing text below animation */}
                  <div className="text-center mt-2">
                    <div className="inline-block px-4 py-2 bg-[#0a0a0a] rounded-lg border border-[#0066FF]/30">
                      <span className="text-[#0066FF] text-sm font-medium" style={{ animation: 'textGlow 2s ease-in-out infinite' }}>
                        Nous consultons les contributions des citoyens
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full max-w-md mx-auto mt-4 px-4">
                    <div className="h-2 bg-[#0a0a0a] rounded-full border border-[#0066FF]/30 overflow-hidden">
                      <div
                        className="h-full bg-[#0066FF] transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${queryProgress}%` }}
                      />
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-[#0066FF]/60 text-xs font-medium">
                        {Math.round(queryProgress)}%
                      </span>
                    </div>
                  </div>

                  {/* Rotating civic quotes during loading */}
                  <CitizenQuotesPanel
                    quotes={civicQuotes}
                    currentIndex={currentQuoteIndex}
                    isVisible={true}
                  />
                </div>
              )}
              <GraphErrorBoundary>
                <GraphVisualization3DForce
                  reconciliationData={reconciliationData}
                  searchPath={searchPath}
                  provenanceGraphData={provenanceGraphData}
                  debugInfo={debugInfo}
                  onNodeVisibilityChange={setVisibleNodeIds}
                  onNodeClick={handleNodeClick}
                  isProcessing={isProcessing}
                  currentProcessingPhase={currentProcessingPhase}
                  sidePanelOpen={!!selectedEntityId}
                  communeCount={currentCommuneCount}
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
                      stroke="#0066FF"
                      strokeWidth="1.5"
                      fill="none"
                    />

                    {/* Top hexagon */}
                    <polygon
                      className="hex2-overlay"
                      points="100,10 125,25 125,55 100,70 75,55 75,25"
                      stroke="#0066FF"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom left hexagon */}
                    <polygon
                      className="hex3-overlay"
                      points="70,95 95,110 95,140 70,155 45,140 45,110"
                      stroke="#0066FF"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom right hexagon */}
                    <polygon
                      className="hex4-overlay"
                      points="130,95 155,110 155,140 130,155 105,140 105,110"
                      stroke="#0066FF"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Far left hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="50,60 75,75 75,105 50,120 25,105 25,75"
                      stroke="#0066FF"
                      strokeWidth="0.8"
                      fill="none"
                    />

                    {/* Far right hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="150,60 175,75 175,105 150,120 125,105 125,75"
                      stroke="#0066FF"
                      strokeWidth="0.8"
                      fill="none"
                      style={{ animationDelay: '1s' }}
                    />

                    {/* Book lines inside central hexagon - simulating shelves */}
                    <line className="book-line-overlay" x1="80" y1="65" x2="120" y2="65" stroke="#0066FF" strokeWidth="0.5" />
                    <line className="book-line-overlay" x1="82" y1="75" x2="118" y2="75" stroke="#0066FF" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
                    <line className="book-line-overlay" x1="84" y1="85" x2="116" y2="85" stroke="#0066FF" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
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

      {/* Error Alert - Dismissible with Retry Button */}
      {showErrorAlert && queryError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg">
          <div className="bg-red-900/95 border border-red-500 rounded-datack-md p-4 shadow-datack-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {/* Error Icon */}
              <div className="flex-shrink-0 text-red-400 mt-0.5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Error Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-red-100 font-medium text-sm mb-1">Erreur de requête</h3>
                <p className="text-red-200 text-sm leading-relaxed">{queryError}</p>

                {/* Retry Button */}
                <button
                  onClick={() => {
                    setShowErrorAlert(false)
                    setQueryError(null)
                    if (currentQuery) {
                      handleSimpleQuery(currentQuery)
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-red-100 rounded-datack-sm text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réessayer
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowErrorAlert(false)
                  setQueryError(null)
                }}
                className="flex-shrink-0 text-red-300 hover:text-red-100 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer Panel - Datack Branding - Resizable on both mobile and desktop */}
      {showAnswer && (
        <div
          className="datack-panel fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto w-full overflow-hidden text-datack-light shadow-datack-lg z-30 rounded-t-2xl md:rounded-datack-md safe-area-bottom flex flex-col"
          style={{
            height: typeof window !== 'undefined' && window.innerWidth < 768 ? `${answerPanelHeight}vh` : `${desktopPanelHeight}vh`,
            maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? `${answerPanelHeight}vh` : `${desktopPanelHeight}vh`,
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${desktopPanelWidth}px` : undefined,
            minWidth: typeof window !== 'undefined' && window.innerWidth >= 768 ? '320px' : undefined,
            maxWidth: typeof window !== 'undefined' && window.innerWidth >= 768 ? '800px' : undefined
          }}
        >
          {/* Desktop horizontal resize handle - on the right edge */}
          <div
            className="hidden md:block absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-datack-yellow/20 transition-colors z-10"
            onMouseDown={(e) => {
              e.preventDefault()
              const startX = e.clientX
              const startWidth = desktopPanelWidth

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX
                const newWidth = Math.min(800, Math.max(320, startWidth + deltaX))
                setDesktopPanelWidth(newWidth)
              }

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
              }

              document.body.style.cursor = 'ew-resize'
              document.body.style.userSelect = 'none'
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
          {/* Desktop resize handle - at the top */}
          <div
            className="hidden md:flex justify-center py-1.5 cursor-ns-resize select-none hover:bg-datack-dark/50 transition-colors group"
            onMouseDown={(e) => {
              e.preventDefault()
              const startY = e.clientY
              const startHeight = desktopPanelHeight
              const viewportHeight = window.innerHeight

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const currentY = moveEvent.clientY
                const deltaY = startY - currentY
                const deltaVh = (deltaY / viewportHeight) * 100
                const newHeight = Math.min(85, Math.max(20, startHeight + deltaVh))
                setDesktopPanelHeight(newHeight)
              }

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
              }

              document.body.style.cursor = 'ns-resize'
              document.body.style.userSelect = 'none'
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          >
            <div className="w-16 h-1 bg-datack-border rounded-full group-hover:bg-datack-yellow/50 transition-colors"></div>
          </div>

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
              {/* Expand/collapse button - visible on both mobile and desktop */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                    // Desktop: toggle between 45vh and 75vh
                    setDesktopPanelHeight(desktopPanelHeight < 60 ? 75 : 45)
                  } else {
                    // Mobile: toggle between 20vh and 65vh
                    setAnswerPanelHeight(answerPanelHeight < 40 ? 65 : 20)
                  }
                }}
                className="datack-btn-ghost p-1 touch-target flex items-center justify-center"
                aria-label={desktopPanelHeight < 60 ? "Agrandir" : "Réduire"}
                title={desktopPanelHeight < 60 ? "Agrandir le panneau" : "Réduire le panneau"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {(typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopPanelHeight < 60 : answerPanelHeight < 40) ? (
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
                relationships={searchPath?.relations || []}
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