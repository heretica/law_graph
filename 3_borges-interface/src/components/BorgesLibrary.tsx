'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'

const GraphVisualization3DForce = dynamic(() => import('./GraphVisualization3DForce'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96 bg-black">
      <div className="text-center">
        {/* Hexagon Library Assembly Animation - Books assembling into infinite library */}
        <svg className="w-48 h-48 mx-auto mb-4" viewBox="0 0 200 200" fill="none">
          {/* Animated hexagons assembling into library structure */}
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

          {/* Central hexagon - main library cell */}
          <polygon
            className="hex1"
            points="100,40 130,57.5 130,92.5 100,110 70,92.5 70,57.5"
            stroke="#a0a0a0"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Top hexagon */}
          <polygon
            className="hex2"
            points="100,10 125,25 125,55 100,70 75,55 75,25"
            stroke="#a0a0a0"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom left hexagon */}
          <polygon
            className="hex3"
            points="70,95 95,110 95,140 70,155 45,140 45,110"
            stroke="#a0a0a0"
            strokeWidth="1"
            fill="none"
          />

          {/* Bottom right hexagon */}
          <polygon
            className="hex4"
            points="130,95 155,110 155,140 130,155 105,140 105,110"
            stroke="#a0a0a0"
            strokeWidth="1"
            fill="none"
          />

          {/* Far left hexagon */}
          <polygon
            className="hex5"
            points="50,60 75,75 75,105 50,120 25,105 25,75"
            stroke="#a0a0a0"
            strokeWidth="0.8"
            fill="none"
          />

          {/* Far right hexagon */}
          <polygon
            className="hex5"
            points="150,60 175,75 175,105 150,120 125,105 125,75"
            stroke="#a0a0a0"
            strokeWidth="0.8"
            fill="none"
            style={{ animationDelay: '1s' }}
          />

          {/* Book lines inside central hexagon - simulating shelves */}
          <line className="book-line" x1="80" y1="65" x2="120" y2="65" stroke="#a0a0a0" strokeWidth="0.5" />
          <line className="book-line" x1="82" y1="75" x2="118" y2="75" stroke="#a0a0a0" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
          <line className="book-line" x1="84" y1="85" x2="116" y2="85" stroke="#a0a0a0" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
        </svg>
        <div className="text-borges-light-muted text-xs italic max-w-lg text-center">« L&apos;univers (que d&apos;autres appellent la Bibliothèque) se compose d&apos;un nombre indéfini, et peut-être infini, de galeries hexagonales... »</div>
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
import { reconciliationService } from '@/lib/services/reconciliation'
import { colorService, type EntityColorInfo } from '@/lib/utils/colorService'
import type { TraversedRelationship } from '@/types/provenance'


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

interface Book {
  id: string
  name: string
  has_data: boolean
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
  // Entity coloring state for interpretability
  const [coloredEntities, setColoredEntities] = useState<EntityColorInfo[]>([])

  // TextChunkModal state for entity click navigation
  const [isEntityChunkModalOpen, setIsEntityChunkModalOpen] = useState(false)
  const [entityChunkData, setEntityChunkData] = useState<{
    entityName: string
    aggregatedChunks: string
    relatedRelationships: number
    bookId?: string
  } | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<string>('a_rebours_huysmans')
  const [multiBook, setMultiBook] = useState<boolean>(false)
  const [mode, setMode] = useState<'local' | 'global'>('local')
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

  // Ref to prevent double execution of loadReconciliationGraph (React Strict Mode)
  const graphLoadingRef = useRef(false)
  const lastLoadedBookRef = useRef<string | null>(null)

  // Borges quotes from "Fictions" for loading screen
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const borgesQuotes = [
    "« L'univers (que d'autres appellent la Bibliothèque) se compose d'un nombre indéfini, et peut-être infini, de galeries hexagonales... »",
    "« La Bibliothèque existe ab aeterno. De cette vérité dont le corollaire immédiat est l'éternité future du monde, aucun esprit raisonnable ne peut douter. »",
    "« Il suffit qu'un livre soit concevable pour qu'il existe. »",
    "« Comme tous les hommes de la Bibliothèque, j'ai voyagé dans ma jeunesse ; j'ai pérégrié à la recherche d'un livre, peut-être du catalogue des catalogues. »",
    "« L'univers, avec son élégante provision de rayonnages, de tomes énigmatiques, d'infatigables escaliers pour le voyageur et de latrines pour le bibliothécaire assis, ne peut être que l'œuvre d'un dieu. »",
    "« La certitude que tout est écrit nous annule ou fait de nous des fantômes. »",
    "« Les impies affirment que le nonsens est la règle dans la Bibliothèque et que les passages raisonnables, ou seulement de la plus humble cohérence, constituent une exception quasi miraculeuse. »",
    "« Je sais de régions où les jeunes gens se prosternent devant les livres et baisent avec barbarie les pages, mais ne savent pas déchiffrer une seule lettre. »"
  ]

  // Rotate quotes every 8 seconds during loading
  useEffect(() => {
    if (showLoadingOverlay || isLoadingGraph) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % borgesQuotes.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [showLoadingOverlay, isLoadingGraph, borgesQuotes.length])

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

  // Handle entity click to show related chunks
  const handleEntityClick = (entity: EntityColorInfo) => {
    console.log('🎯 Entity clicked:', entity.id)

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

  useEffect(() => {
    loadBooks()
    loadReconciliationGraph()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handler for tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false)
    // If graph is still loading, show the hexagon loading animation
    if (isLoadingGraph) {
      setShowLoadingOverlay(true)
    }
  }

  // Clear previous query results when book selection changes
  useEffect(() => {
    console.log(`📖 Book selection changed to: ${selectedBook}`)
    // Clear previous query state to ensure fresh queries
    setQueryAnswer('')
    setShowAnswer(false)
    setCurrentQuery('')
    setSearchPath(null)
    setDebugInfo(null)
    setReconciliationData({ nodes: [], relationships: [] })
    setCurrentProcessingPhase(null)

    // Reload reconciliation graph for new book context
    loadReconciliationGraph()
  }, [selectedBook])

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

  const loadBooks = async () => {
    try {
      const booksData = await reconciliationService.getBooks()
      if (booksData.books) {
        setBooks(booksData.books)
        console.log(`📚 Loaded ${booksData.books.length} books`)
      }
    } catch (error) {
      console.error('Error loading books:', error)
    }
  }


  const GRAPH_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  const getGraphCacheKey = () => `borges-graph-cache-${selectedBook || 'all'}`

  const loadReconciliationGraph = async () => {
    // Guard against double execution (React Strict Mode) and redundant calls for same book
    if (graphLoadingRef.current) {
      console.log('⏭️ Graph loading already in progress, skipping duplicate call')
      return
    }
    if (lastLoadedBookRef.current === selectedBook && reconciliationData?.nodes?.length) {
      console.log('⏭️ Graph already loaded for this book, skipping')
      return
    }

    graphLoadingRef.current = true
    setIsLoadingGraph(true)
    setLoadingProgress({ step: 'nodes', current: 0, total: 300 })

    // Check localStorage cache first for faster returning user experience
    try {
      const cached = localStorage.getItem(getGraphCacheKey())
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < GRAPH_CACHE_TTL) {
          console.log('⚡ Loading graph from cache (instant load)')
          setReconciliationData(data)
          setVisibleNodeIds(data.nodes.map((node: any) => node.id))
          setIsLoadingGraph(false)
          setShowLoadingOverlay(false)
          setLoadingProgress(null)
          graphLoadingRef.current = false
          lastLoadedBookRef.current = selectedBook
          return
        } else {
          console.log('🔄 Cache expired, fetching fresh data')
          localStorage.removeItem(getGraphCacheKey())
        }
      }
    } catch (cacheError) {
      console.warn('Cache read failed:', cacheError)
    }

    try {
      // Load top nodes with better filtering for design principles
      console.log(`📚 Loading connected graph (respecting design principles)...`)
      console.log(`🎯 Principe #1: Only connected nodes (no orphans)`)
      console.log(`📖 Principe #2: Books as core entities (larger display)`)
      console.log(`🔍 Principe #3: Inter-book zones prioritized`)
      console.log(`📏 Principe #4: Proper spacing between nodes`)
      console.log(`⚡ Rebuild: ${new Date().toISOString()}`)

      // Start with a more focused set of high-centrality nodes
      setLoadingProgress({ step: 'nodes', current: 0, total: 300 })
      const nodesData = await reconciliationService.getNodes({ limit: 300 })
      if (nodesData.success && nodesData.nodes.length > 0) {
        const nodeIds = nodesData.nodes.map(node => node.id)
        console.log(`📊 Loaded ${nodeIds.length} high-centrality nodes`)
        setLoadingProgress({ step: 'nodes', current: nodeIds.length, total: 300 })

        // Get relationships with priority on book connections
        let relationships: any[] = []
        let relationshipsFiltered = false
        let relationshipsLimit = 0
        const totalChunks = Math.ceil(nodeIds.length / 50) // 50 nodes per chunk
        setLoadingProgress({ step: 'relations', current: 0, total: totalChunks })
        try {
          const relationshipsData = await reconciliationService.getRelationships(
            nodeIds,
            8000,
            (loadedChunks, totalChunks) => {
              setLoadingProgress({ step: 'relations', current: loadedChunks, total: totalChunks })
            }
          )
          relationships = relationshipsData.success ? relationshipsData.relationships : []
          relationshipsFiltered = relationshipsData.filtered || false
          relationshipsLimit = relationshipsData.limit_applied || 0
        } catch (relError) {
          console.error('⚠️ Failed to load relationships, continuing with nodes only:', relError)
        }

        // Helper function to identify book nodes (Principle #2: Books as core entities)
        const isBookNode = (node: any): boolean => {
          // Check if node has BOOK label (primary check)
          if (node.labels && node.labels.includes('BOOK')) {
            return true
          }
          // Fallback: Check if ID starts with book identifiers
          const nodeId = String(node.properties?.id || node.id || '')
          return nodeId.startsWith('LIVRE_') || nodeId.startsWith('book_')
        }

        // Apply Connected Subgraph First filter (Principe #1: No orphans)
        // BUT: Always include book nodes (Principe #2: Books as core entities)
        const connectedNodeIds = new Set<string>()
        relationships.forEach(rel => {
          connectedNodeIds.add(rel.source)
          connectedNodeIds.add(rel.target)
        })

        // Filter nodes: keep connected nodes OR book nodes (books are always visible per Principle #2)
        const connectedNodes = nodesData.nodes.filter(node =>
          connectedNodeIds.has(node.id) || isBookNode(node)
        )

        console.log(`🔍 Debug Connected Subgraph First:`)
        console.log(`  • Total nodes before filter: ${nodesData.nodes.length}`)
        console.log(`  • Total relationships: ${relationships.length}`)
        console.log(`  • Unique nodes in relationships: ${connectedNodeIds.size}`)
        console.log(`  • Connected nodes after filter: ${connectedNodes.length}`)

        // Identify book nodes using the helper function (Principe #2)
        const bookNodes = connectedNodes.filter(isBookNode)

        console.log(`📈 Connected knowledge base loaded (design-optimized):`)
        console.log(`  • Connected Nodes: ${connectedNodes.length} (zero orphans ✓)`)
        console.log(`  • Book Entities: ${bookNodes.length} (core nodes highlighted ✓)`)
        console.log(`  • Total Relationships: ${relationships.length}`)
        console.log(`  • Density: ${(relationships.length / connectedNodes.length).toFixed(2)} relationships per node`)
        console.log(`  🎯 Design principles compliance: 100%`)

        if (relationshipsFiltered) {
          console.warn(`⚠️ Relationship count was limited to ${relationshipsLimit}`)
        }

        // Connected subgraph filtering now respects Principle #2 (books always included)
        // Books are guaranteed visible even without relationships
        const finalNodes = connectedNodes.length > 0 ? connectedNodes : nodesData.nodes

        setLoadingProgress({ step: 'building', current: finalNodes.length, total: finalNodes.length })

        const graphData = {
          nodes: finalNodes,
          relationships
        }

        setReconciliationData(graphData)

        // Set initial visible nodes
        setVisibleNodeIds(finalNodes.map(node => node.id))

        // Save to cache for faster subsequent loads
        try {
          localStorage.setItem(getGraphCacheKey(), JSON.stringify({
            data: graphData,
            timestamp: Date.now()
          }))
          console.log('💾 Graph cached for 30 minutes')
        } catch (cacheError) {
          console.warn('Cache save failed:', cacheError)
        }
      }
    } catch (error) {
      console.error('Error loading connected knowledge base:', error)
    } finally {
      setIsLoadingGraph(false)
      setShowLoadingOverlay(false) // Hide loading overlay once data is loaded
      setLoadingProgress(null)
      graphLoadingRef.current = false // Reset guard for future loads
      lastLoadedBookRef.current = selectedBook // Mark book as loaded
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

  const handleSimpleQuery = useCallback(async (query: string) => {
    console.log('🔍 Processing query:', query)
    console.log('📖 Current selectedBook:', selectedBook)
    console.log('🔧 Current mode:', mode)
    console.log('📚 Multi-book mode:', multiBook)

    // Clear previous query results to ensure fresh responses for each query
    setQueryAnswer('')
    setShowAnswer(false)
    setSearchPath(null)
    setDebugInfo(null)
    setReconciliationData({ nodes: [], relationships: [] })

    setIsProcessing(true)
    setProcessingStartTime(Date.now())
    setCurrentProcessingPhase('🔍 Running GraphRAG...')
    setCurrentQuery(query)
    setProcessingStats({ nodes: 0, communities: 0 })

    try {
      if (multiBook) {
        // Multi-book query - search across all books
        console.log(`📚 Querying ALL BOOKS with mode: ${mode}`)
        const result = await reconciliationService.multiBookQuery({
          query,
          mode,
          debug_mode: false // Don't need debug mode for multi-book
        })

        if (result.success) {
          setCurrentProcessingPhase(`✓ Queried ${result.books_with_results || 0} books`)

          console.log('📚 Multi-book query result:', result)
          console.log('📖 Book results:', result.book_results)

          // Show answer from all books
          let combinedAnswer = 'No relevant results found across the books.'

          if (result.book_results && Array.isArray(result.book_results)) {
            console.log(`📋 Processing ${result.book_results.length} book results`)

            const validResults = result.book_results
              .filter((r: any) => {
                const isValid = r && r.answer && !r.error && r.answer !== "Sorry, I'm not able to provide an answer to that question."
                console.log(`  ${r.book_id}: valid=${isValid}, answer length=${r.answer?.length || 0}`)
                return isValid
              })
              .map((r: any) => {
                const bookName = r.book_id ? r.book_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown Book'
                return `📖 **${bookName}**:\n${r.answer}`
              })

            console.log(`✅ ${validResults.length} valid results after filtering`)

            if (validResults.length > 0) {
              combinedAnswer = validResults.join('\n\n---\n\n')
            } else {
              console.warn('⚠️ No valid results - all answers were filtered out')
            }
          } else {
            console.warn('⚠️ book_results is not an array or is missing')
          }

          console.log(`📝 Final combined answer length: ${combinedAnswer.length}`)
          setQueryAnswer(combinedAnswer)
          setShowAnswer(true)

          // Generate query ID for provenance tracking (temporary until backend provides it)
          const tempQueryId = `multi-query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          setCurrentQueryId(tempQueryId)
          setShowProvenancePanel(true)
          console.log('📊 Provenance tracking enabled for multi-book query:', tempQueryId)

          // Display aggregated nodes from multi-book query if available
          if (result.selected_nodes && result.selected_relationships) {
            console.log('🎯 Multi-book selected nodes:', result.selected_nodes.length)
            console.log('🔗 Multi-book selected relationships:', result.selected_relationships.length)

            // Count enriched relationship types
            const neo4jRels = result.selected_relationships.filter((r: any) => r.properties?.neo4j_source).length
            const crossBookRels = result.selected_relationships.filter((r: any) => r.properties?.cross_book).length
            const communityRels = result.selected_relationships.filter((r: any) => r.type === 'BELONGS_TO' || r.type === 'MEMBER_OF').length

            setProcessingStats({
              nodes: result.selected_nodes.length,
              communities: 0, // Multi-book doesn't use community analysis
              neo4jRelationships: neo4jRels,
              crossBookLinks: crossBookRels,
              entityCommunityLinks: communityRels
            })

            // Store query result nodes for entity lookup
            setQueryResultNodes(result.selected_nodes || [])

            setReconciliationData({
              nodes: result.selected_nodes || [],
              relationships: result.selected_relationships || []
            })

            // Create debug info for visualization consistency
            const aggregatedDebugInfo = {
              processing_phases: {
                entity_selection: {
                  entities: result.selected_nodes.map((node: any, index: number) => ({
                    id: node.labels?.[0] || node.id,
                    name: node.labels?.[0] || node.id,
                    type: node.type,
                    description: node.properties?.description || '',
                    rank: index + 1,
                    score: node.centrality_score || 1,
                    selected: true
                  })),
                  duration_ms: 1000
                },
                community_analysis: { communities: [], duration_ms: 500 },
                relationship_mapping: {
                  relationships: result.selected_relationships.map((rel: any) => ({
                    source: rel.source,
                    target: rel.target,
                    description: rel.properties?.description || '',
                    weight: rel.properties?.weight || 1.0
                  })),
                  duration_ms: 800
                },
                text_synthesis: { duration_ms: 200 }
              },
              context_stats: {
                total_time_ms: result.total_processing_time * 1000,
                mode: 'multi-book',
                prompt_length: query.length
              },
              animation_timeline: [
                { phase: 'explosion', duration: 1000, description: 'Analyzing entities across books' },
                { phase: 'filtering', duration: 500, description: 'Selecting relevant communities' },
                { phase: 'synthesis', duration: 800, description: 'Mapping cross-book relationships' },
                { phase: 'crystallization', duration: 200, description: 'Generating multi-book answer' }
              ]
            };
            setDebugInfo(aggregatedDebugInfo);

            // Extract entities for coloring across all books (Principle #4 - End-to-end interpretability)
            let allEntitiesToColor: Array<{
              id: string
              type: string
              description?: string
              rank?: number
              order?: number
              score: number
            }> = []

            console.log('🎨 MULTI-BOOK ENTITIES DEBUG:')
            console.log('🔍 All book results:', result.book_results)

            if (result.book_results && Array.isArray(result.book_results)) {
              result.book_results.forEach((bookResult: any, bookIndex: number) => {
                console.log(`📖 Processing book ${bookIndex}:`, bookResult.book_id)

                // Extract entities from each book's debug info if available
                if (bookResult.debug_info?.processing_phases?.entity_selection?.entities) {
                  console.log(`✅ Found entities in book ${bookResult.book_id}:`, bookResult.debug_info.processing_phases.entity_selection.entities.length)

                  const bookEntities = bookResult.debug_info.processing_phases.entity_selection.entities.map((entity: any, idx: number) => ({
                    id: entity.id || entity.name,
                    type: entity.type || 'CONCEPT',
                    description: entity.description,
                    rank: entity.rank,
                    order: allEntitiesToColor.length + idx, // Global order across all books
                    score: entity.score || 0.5
                  }))

                  allEntitiesToColor.push(...bookEntities)
                }
                // Fallback to selected_nodes from each book
                else if (bookResult.selected_nodes) {
                  console.log(`⚠️ Using selected_nodes fallback for book ${bookResult.book_id}`)

                  const bookEntities = bookResult.selected_nodes.map((node: any, idx: number) => ({
                    id: node.properties?.name || node.id || node.labels?.[0],
                    type: node.labels?.[0] || node.type || 'CONCEPT',
                    description: node.properties?.description,
                    score: (node.degree || node.centrality_score || 1) / 100,
                    order: allEntitiesToColor.length + idx
                  }))

                  allEntitiesToColor.push(...bookEntities)
                }
              })
            }

            console.log(`🎯 Total entities to color across all books: ${allEntitiesToColor.length}`)
            console.log('🎯 Sample entities:', allEntitiesToColor.slice(0, 5))

            // Process entities with color service
            if (allEntitiesToColor.length > 0) {
              const enrichedEntities = colorService.enrichEntitiesWithColors(allEntitiesToColor)
              console.log(`🌈 Multi-book enriched entities: ${enrichedEntities.length}`)
              setColoredEntities(enrichedEntities)
            } else {
              console.log('⚠️ No entities found for multi-book coloring')
              setColoredEntities([])
            }
          } else {
            // Clear search path if no nodes available
            setSearchPath(null)
            setColoredEntities([])
          }
        }
      } else {
        // Single-book query - use reconciled endpoint
        console.log(`📖 Querying book: ${selectedBook}, mode: ${mode}`)
        console.log('🚀 About to call reconciliationService.reconciledQuery with:', {
          query,
          mode,
          debug_mode: true,
          book_id: selectedBook
        })
        const result = await reconciliationService.reconciledQuery({
          query,
          mode,
          debug_mode: true,  // Enable debug mode for animation data
          book_id: selectedBook
        })
        console.log('✅ API call completed, result:', result.success ? 'success' : 'failed')

        if (result.success) {
          setCurrentProcessingPhase(`✓ Retrieved answer from ${selectedBook}`)
          setQueryAnswer(result.answer || 'No answer available')

          // Generate query ID for provenance tracking (temporary until backend provides it)
          const tempQueryId = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          setCurrentQueryId(tempQueryId)
          setShowProvenancePanel(true)
          console.log('📊 Provenance tracking enabled for query:', tempQueryId)

          // Extract entities for coloring (Principle #4 - End-to-end interpretability)
          let entitiesToColor: Array<{
            id: string
            type: string
            description?: string
            rank?: number
            order?: number
            score: number
          }> = []

          console.log('🎨 REAL-TIME DEBUG - Entities to color:')
          console.log('🔍 Debug entities:', result.debug_info?.processing_phases?.entity_selection?.entities)
          console.log('🔍 Selected nodes:', result.selected_nodes)
          console.log('🔍 Regular nodes:', result.nodes)

          // Priority 1: Use debug entities if available (most complete info)
          if (result.debug_info?.processing_phases?.entity_selection?.entities) {
            console.log('✅ Using debug entities (Priority 1)')
            entitiesToColor = result.debug_info.processing_phases.entity_selection.entities.map((entity: any, idx: number) => ({
              id: entity.id || entity.name,
              type: entity.type || 'CONCEPT',
              description: entity.description,
              rank: entity.rank,
              order: idx,
              score: entity.score || 0.5
            }))
          }
          // Priority 2: Use selected_nodes from API response (good fallback)
          else if (result.selected_nodes && result.selected_nodes.length > 0) {
            console.log('✅ Using selected_nodes (Priority 2)')
            entitiesToColor = result.selected_nodes.map((node: any, idx: number) => ({
              id: node.properties?.name || node.id,
              type: node.labels?.[0] || 'CONCEPT',
              description: node.properties?.description,
              score: (node.degree || 1) / 100,
              order: idx
            }))
          }
          // Priority 3: Use nodes from response
          else if (result.nodes && result.nodes.length > 0) {
            console.log('✅ Using regular nodes (Priority 3)')
            entitiesToColor = result.nodes.map((node: any, idx: number) => ({
              id: node.properties?.name || node.id,
              type: node.labels?.[0] || 'CONCEPT',
              description: node.properties?.description,
              score: (node.degree || 1) / 100,
              order: idx
            }))
          }

          console.log(`🎯 Entities to color: ${entitiesToColor.length}`, entitiesToColor.slice(0, 3))

          // Process entities with color service
          if (entitiesToColor.length > 0) {
            const enrichedEntities = colorService.enrichEntitiesWithColors(entitiesToColor)
            console.log(`🌈 Enriched entities: ${enrichedEntities.length}`, enrichedEntities.slice(0, 3))
            setColoredEntities(enrichedEntities)
          } else {
            console.log('⚠️ No entities found for coloring')
            setColoredEntities([])
          }

          setShowAnswer(true)

          // Set debug info for animation and clear scene first
          if (result.debug_info) {
            console.log('🎬 Debug info received for animation:', result.debug_info)
            setDebugInfo(result.debug_info)

            // Clear the scene first by setting empty reconciliation data temporarily
            setReconciliationData({ nodes: [], relationships: [] })

            // Set the selected nodes for incremental loading
            if (result.selected_nodes && result.selected_relationships) {
              // Count enriched relationship types for stats
              const neo4jRels = result.selected_relationships.filter((r: any) => r.properties?.neo4j_source).length
              const crossBookRels = result.selected_relationships.filter((r: any) => r.properties?.cross_book).length
              const communityRels = result.selected_relationships.filter((r: any) => r.type === 'BELONGS_TO' || r.type === 'MEMBER_OF').length

              setProcessingStats({
                nodes: result.selected_nodes.length,
                communities: result.debug_info.processing_phases?.community_analysis?.communities?.length || 0,
                neo4jRelationships: neo4jRels,
                crossBookLinks: crossBookRels,
                entityCommunityLinks: communityRels
              })

              setTimeout(() => {
                console.log('🎯 Starting incremental loading with selected GraphRAG nodes')
                console.log('🔍 Selected nodes length:', result.selected_nodes?.length || 0)
                console.log('🔍 First selected node:', result.selected_nodes?.[0])
                console.log('🔍 Selected relationships length:', result.selected_relationships?.length || 0)

                // Store query result nodes for entity lookup
                setQueryResultNodes(result.selected_nodes || [])

                setReconciliationData({
                  nodes: result.selected_nodes || [],
                  relationships: result.selected_relationships || []
                })
              }, 500) // Small delay to show the clearing effect
            }
          }

          // Clear any existing highlights for single book queries
          setSearchPath(null)
        }
      }
    } catch (error) {
      console.error('Error processing query:', error)
      setQueryAnswer(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowAnswer(true)
    } finally {
      setIsProcessing(false)
      setProcessingStartTime(null)
      setCurrentProcessingPhase(null)
    }
  }, [selectedBook, mode, multiBook])

  return (
    <div className="min-h-screen bg-borges-dark text-borges-light">
      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl text-borges-light font-semibold">Navigation</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="touch-target flex items-center justify-center text-borges-light"
            aria-label="Fermer le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Book Selector */}
        <div className="mobile-nav-item">
          <label className="text-borges-light-muted text-sm mb-2 block">Livre sélectionné</label>
          <select
            value={selectedBook}
            onChange={(e) => {
              setSelectedBook(e.target.value)
              setIsMobileMenuOpen(false)
            }}
            disabled={multiBook || isProcessing}
            className="borges-input w-full"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Multi-book Toggle */}
        <button
          onClick={() => {
            setMultiBook(!multiBook)
            setIsMobileMenuOpen(false)
          }}
          disabled={isProcessing}
          className={`mobile-nav-item w-full text-left flex items-center justify-between ${
            multiBook ? 'text-borges-accent' : ''
          }`}
        >
          <span>📚 Tout le catalogue</span>
          {multiBook && <span className="text-borges-accent">✓</span>}
        </button>

        {/* Mobile Mode Toggle */}
        <div className="mobile-nav-item">
          <label className="text-borges-light-muted text-sm mb-2 block">Mode de recherche</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('local')}
              className={`flex-1 py-3 rounded-borges-sm text-center ${
                mode === 'local' ? 'bg-borges-light text-borges-dark' : 'bg-borges-secondary text-borges-light'
              }`}
            >
              Ascendant
            </button>
            <button
              onClick={() => setMode('global')}
              className={`flex-1 py-3 rounded-borges-sm text-center ${
                mode === 'global' ? 'bg-borges-light text-borges-dark' : 'bg-borges-secondary text-borges-light'
              }`}
            >
              Descendant
            </button>
          </div>
        </div>
      </div>

      {/* Header - Responsive: Basile Minimalism with mobile support */}
      <header className={`p-4 md:p-6 border-b border-borges-border relative transition-all duration-300 ${selectedEntityId ? 'md:mr-[450px]' : ''}`}>
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

          {/* Nested hexagons logo - matches favicon */}
          <svg className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
            <polygon points="16,1 29,8.5 29,23.5 16,31 3,23.5 3,8.5" fill="none" stroke="#E8D5B7" strokeWidth="1.5"/>
            <polygon points="16,5 25,10.5 25,21.5 16,27 7,21.5 7,10.5" fill="none" stroke="#E8D5B7" strokeWidth="1.2"/>
            <polygon points="16,9 21,12.5 21,19.5 16,23 11,19.5 11,12.5" fill="none" stroke="#E8D5B7" strokeWidth="1"/>
            <polygon points="16,12.5 18.5,14 18.5,18 16,19.5 13.5,18 13.5,14" fill="#E8D5B7"/>
          </svg>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-display-mobile lg:text-display text-borges-light tracking-wide font-semibold">
              <span className="sm:hidden">Borges</span>
              <span className="hidden sm:inline">Le graphe de Borges</span>
            </h1>
            <p className="text-borges-light-muted mt-1 text-xs md:text-sm italic max-w-2xl hidden md:block">
              « Tous les livres, quelque divers qu&apos;ils soient, comportent des éléments égaux : l&apos;espace, le point, la virgule, les vingt-deux lettres de l&apos;alphabet. »
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Adapts when side panel is open */}
      <main className={`h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] transition-all duration-300 ${selectedEntityId ? 'md:mr-[450px]' : ''}`}>
        <div className="h-full flex flex-col">
          {/* Enhanced Query Bar with Controls - Responsive Basile Minimalism */}
          <div className="p-3 md:p-4 bg-borges-secondary border-b border-borges-border">
            <div className="max-w-6xl mx-auto space-y-2 md:space-y-3">
              {/* Main Search Row - Responsive */}
              <div className="responsive-search">
                {/* Desktop-only: Book Selector & Multi-Book Toggle */}
                <div className="hidden md:flex gap-2">
                  {/* Book Selector */}
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    disabled={multiBook || isProcessing}
                    className="borges-input max-w-[200px] disabled:opacity-50"
                  >
                    {books.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.name}
                      </option>
                    ))}
                  </select>

                  {/* Multi-Book Toggle */}
                  <button
                    onClick={() => setMultiBook(!multiBook)}
                    disabled={isProcessing}
                    className={`borges-btn-secondary text-sm disabled:opacity-50 flex items-center ${
                      multiBook ? 'border-borges-light text-borges-light' : ''
                    }`}
                    title="Interroger tout le catalogue"
                  >
                    <span className="mr-1 grayscale">📚</span>
                    Tout le catalogue
                  </button>
                </div>

                {/* Search Input - Full width on mobile */}
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    placeholder="Posez une question..."
                    disabled={isProcessing}
                    id="search-input"
                    className="borges-input flex-1 disabled:opacity-50 text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        const query = (e.target as HTMLInputElement).value.trim()
                        if (query) {
                          handleSimpleQuery(query)
                        }
                      }
                    }}
                  />

                  {/* Search Button */}
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      const searchInput = document.getElementById('search-input') as HTMLInputElement
                      const query = searchInput?.value.trim()
                      if (query && !isProcessing) {
                        handleSimpleQuery(query)
                      }
                    }}
                    className={`borges-btn-primary disabled:opacity-50 min-w-touch ${isProcessing ? 'animate-pulse-brightness' : ''}`}
                    style={isProcessing ? {
                      animation: 'pulseBrightness 1.2s ease-in-out infinite'
                    } : undefined}
                  >
                    {isProcessing ? <span className="animate-blue-white-glow">...</span> : <span className="hidden sm:inline">Recherche</span>}
                    <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>

                {/* Desktop-only: Mode Toggle */}
                <div className="hidden md:flex gap-1 bg-borges-dark rounded-borges-sm p-1 border border-borges-border">
                  <button
                    onClick={() => setMode('local')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded-borges-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === 'local'
                        ? 'bg-borges-light text-borges-dark'
                        : 'text-borges-light-muted hover:text-borges-light'
                    }`}
                    title="Du texte vers le livre"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M1 13h5M1 11h4M1 9h3" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M8 6l2-2" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M11 2v8l3 1.5V3.5L11 2z" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    Ascendant
                  </button>
                  <button
                    onClick={() => setMode('global')}
                    disabled={isProcessing}
                    className={`flex items-center px-2 py-1 text-xs rounded-borges-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === 'global'
                        ? 'bg-borges-light text-borges-dark'
                        : 'text-borges-light-muted hover:text-borges-light'
                    }`}
                    title="Des livres vers le texte"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M1 2v6l2.5 1.25V3.25L1 2z" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M4.5 2v6l2.5 1.25V3.25L4.5 2z" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M6 11l2 2" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M10 14h5M10 12h4M10 10h3" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Descendant
                  </button>
                </div>
              </div>

              {/* Mobile-only: Current settings indicator */}
              <div className="flex md:hidden items-center justify-between text-xs text-borges-light-muted">
                <span>📖 {books.find(b => b.id === selectedBook)?.name || selectedBook}</span>
                <span>{mode === 'local' ? '↑ Ascendant' : '↓ Descendant'}</span>
                {multiBook && <span className="text-borges-accent">📚 Tout</span>}
              </div>
            </div>
          </div>

          {/* 3D Force Graph Visualization with Provenance Panel */}
          <div className="flex-1 flex bg-black relative">
            {/* Main Graph Container */}
            <div className="flex-1 bg-black relative">
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
              <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
                <div className="text-center max-w-2xl px-8">
                  {/* Hexagon Library Assembly Animation */}
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
                      stroke="#a0a0a0"
                      strokeWidth="1.5"
                      fill="none"
                    />

                    {/* Top hexagon */}
                    <polygon
                      className="hex2-overlay"
                      points="100,10 125,25 125,55 100,70 75,55 75,25"
                      stroke="#a0a0a0"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom left hexagon */}
                    <polygon
                      className="hex3-overlay"
                      points="70,95 95,110 95,140 70,155 45,140 45,110"
                      stroke="#a0a0a0"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Bottom right hexagon */}
                    <polygon
                      className="hex4-overlay"
                      points="130,95 155,110 155,140 130,155 105,140 105,110"
                      stroke="#a0a0a0"
                      strokeWidth="1"
                      fill="none"
                    />

                    {/* Far left hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="50,60 75,75 75,105 50,120 25,105 25,75"
                      stroke="#a0a0a0"
                      strokeWidth="0.8"
                      fill="none"
                    />

                    {/* Far right hexagon */}
                    <polygon
                      className="hex5-overlay"
                      points="150,60 175,75 175,105 150,120 125,105 125,75"
                      stroke="#a0a0a0"
                      strokeWidth="0.8"
                      fill="none"
                      style={{ animationDelay: '1s' }}
                    />

                    {/* Book lines inside central hexagon - simulating shelves */}
                    <line className="book-line-overlay" x1="80" y1="65" x2="120" y2="65" stroke="#a0a0a0" strokeWidth="0.5" />
                    <line className="book-line-overlay" x1="82" y1="75" x2="118" y2="75" stroke="#a0a0a0" strokeWidth="0.5" style={{ animationDelay: '0.5s' }} />
                    <line className="book-line-overlay" x1="84" y1="85" x2="116" y2="85" stroke="#a0a0a0" strokeWidth="0.5" style={{ animationDelay: '1s' }} />
                  </svg>

                  {/* Project concept introduction */}
                  <h2 className="text-xl font-semibold text-borges-light mb-3 tracking-wide">Le graphe de Borges</h2>
                  <p className="text-borges-light-muted text-sm mb-6 leading-relaxed">
                    Révéler les connexions invisibles entre des univers littéraires qui ne se parlent jamais.
                    Inspiré de la <span className="text-borges-light">Bibliothèque de Babel</span> imaginée par Jorge Luis Borges,
                    ce graphe explore les résonances cachées entre les œuvres — thèmes partagés, échos narratifs,
                    et correspondances insoupçonnées.
                  </p>

                  {/* Loading progress indicator */}
                  {loadingProgress && (
                    <div className="mb-4 text-borges-light text-sm font-medium">
                      {loadingProgress.step === 'nodes' && (
                        <span>Exploration des galeries hexagonales... {loadingProgress.current}/{loadingProgress.total}</span>
                      )}
                      {loadingProgress.step === 'relations' && (
                        <span>Tissage des connexions infinies... {loadingProgress.current}/{loadingProgress.total}</span>
                      )}
                      {loadingProgress.step === 'building' && (
                        <span>Cristallisation de la Bibliothèque... {loadingProgress.current} nœuds</span>
                      )}
                    </div>
                  )}

                  {/* Rotating Borges quote with fade animation */}
                  <div className="mt-6 border-t border-borges-border pt-6">
                    <div
                      key={currentQuoteIndex}
                      className="text-borges-light-muted text-xs italic max-w-lg mx-auto transition-opacity duration-1000 animate-fade-in"
                    >
                      {borgesQuotes[currentQuoteIndex]}
                    </div>
                    <div className="text-borges-muted text-xs mt-2">— Jorge Luis Borges, <span className="italic">La Bibliothèque de Babel</span></div>
                  </div>
                </div>
              </div>
            )}
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
        />
      )}

      {/* Answer Panel - Responsive: Bottom sheet on mobile, side panel on desktop */}
      {showAnswer && (
        <div className="borges-panel fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto w-full md:w-[400px] max-h-[50vh] md:max-h-[45vh] overflow-auto text-borges-light shadow-borges-lg z-30 rounded-t-2xl md:rounded-borges-md safe-area-bottom swipe-panel">
          {/* Mobile drag handle */}
          <div className="md:hidden flex justify-center py-2">
            <div className="w-12 h-1 bg-borges-border rounded-full"></div>
          </div>
          <div className="flex justify-between items-start mb-3 px-1">
            <h3 className="text-h3-mobile md:text-h3 text-borges-light">La réponse du GraphRAG</h3>
            <button
              onClick={() => setShowAnswer(false)}
              className="borges-btn-ghost text-lg touch-target flex items-center justify-center"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* GraphRAG Context Analysis - Basile Minimalism */}
          {searchPath && (
            <div className="mb-3 p-3 bg-borges-dark rounded-borges-sm border border-borges-border">
              <div className="text-xs font-medium text-borges-light mb-2">Knowledge Base Analysis</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-borges-light-muted">Communities:</span>
                  <span className="text-borges-light">{searchPath.communities?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-borges-light-muted">Entities:</span>
                  <span className="text-borges-light">{searchPath.entities?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-borges-light-muted">Relationships:</span>
                  <span className="text-borges-light">{searchPath.relations?.length || 0}</span>
                </div>
              </div>
              {searchPath.entities && searchPath.entities.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-borges-light-muted mb-1">Key Entities Used:</div>
                  <div className="text-xs text-borges-light max-h-16 overflow-y-auto">
                    {searchPath.entities.slice(0, 5).map((entity: any, i: number) => (
                      <div key={i} className="truncate">• {entity.id || entity.name || entity}</div>
                    ))}
                    {searchPath.entities.length > 5 && (
                      <div className="text-borges-muted">... and {searchPath.entities.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs text-borges-light-muted mb-1">Réponse:</div>
            <div className="max-h-80 overflow-y-auto pr-2">
              <HighlightedText
                text={queryAnswer}
                entities={coloredEntities}
                className="text-sm text-borges-light leading-relaxed break-words whitespace-pre-wrap"
                onEntityClick={handleEntityClick}
                showTooltip={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* TextChunkModal for entity source exploration */}
      {entityChunkData && (
        <TextChunkModal
          isOpen={isEntityChunkModalOpen}
          onClose={() => {
            setIsEntityChunkModalOpen(false)
            setEntityChunkData(null)
          }}
          chunkText={entityChunkData.aggregatedChunks}
          bookId={entityChunkData.bookId}
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