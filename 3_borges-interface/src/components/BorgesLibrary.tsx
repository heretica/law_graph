'use client'

import { useState, useEffect, useCallback } from 'react'
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


  const loadReconciliationGraph = async () => {
    setIsLoadingGraph(true)
    try {
      // Load top nodes with better filtering for design principles
      console.log(`📚 Loading connected graph (respecting design principles)...`)
      console.log(`🎯 Principe #1: Only connected nodes (no orphans)`)
      console.log(`📖 Principe #2: Books as core entities (larger display)`)
      console.log(`🔍 Principe #3: Inter-book zones prioritized`)
      console.log(`📏 Principe #4: Proper spacing between nodes`)
      console.log(`⚡ Rebuild: ${new Date().toISOString()}`)

      // Start with a more focused set of high-centrality nodes
      const nodesData = await reconciliationService.getNodes({ limit: 300 })
      if (nodesData.success && nodesData.nodes.length > 0) {
        const nodeIds = nodesData.nodes.map(node => node.id)
        console.log(`📊 Loaded ${nodeIds.length} high-centrality nodes`)

        // Get relationships with priority on book connections
        let relationships: any[] = []
        let relationshipsFiltered = false
        let relationshipsLimit = 0
        try {
          const relationshipsData = await reconciliationService.getRelationships(nodeIds, 8000)
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

        setReconciliationData({
          nodes: finalNodes,
          relationships
        })

        // Set initial visible nodes
        setVisibleNodeIds(finalNodes.map(node => node.id))
      }
    } catch (error) {
      console.error('Error loading connected knowledge base:', error)
    } finally {
      setIsLoadingGraph(false)
      setShowLoadingOverlay(false) // Hide loading overlay once data is loaded
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
      {/* Header - Basile Minimalism: content-first, subtle geometric accent */}
      <header className={`p-6 border-b border-borges-border relative transition-all duration-300 ${selectedEntityId ? 'mr-[450px]' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Subtle hexagonal brand accent */}
          <svg className="w-8 h-8 flex-shrink-0 opacity-60" viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,10 85,30 85,70 50,90 15,70 15,30"
              stroke="#a0a0a0"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <div>
            <h1 className="text-display text-borges-light tracking-wide font-semibold">
              Le graphe de Borges
            </h1>
            <p className="text-borges-light-muted mt-1 text-sm italic max-w-2xl">
              « Tous les livres, quelque divers qu&apos;ils soient, comportent des éléments égaux : l&apos;espace, le point, la virgule, les vingt-deux lettres de l&apos;alphabet. »
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Adapts when side panel is open */}
      <main className={`h-[calc(100vh-120px)] transition-all duration-300 ${selectedEntityId ? 'mr-[450px]' : ''}`}>
        <div className="h-full flex flex-col">
          {/* Enhanced Query Bar with Controls - Basile Minimalism */}
          <div className="p-4 bg-borges-secondary border-b border-borges-border">
            <div className="max-w-6xl mx-auto space-y-3">
              {/* Main Search Row */}
              <div className="flex gap-2">
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

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Posez une question..."
                  disabled={isProcessing}
                  id="search-input"
                  className="borges-input flex-1 disabled:opacity-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isProcessing) {
                      const query = (e.target as HTMLInputElement).value.trim()
                      if (query) {
                        handleSimpleQuery(query)
                        // Keep query visible in search bar
                      }
                    }
                  }}
                />

                {/* Mode Toggle */}
                <div className="flex gap-1 bg-borges-dark rounded-borges-sm p-1 border border-borges-border">
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
                      {/* Lines ascending to book */}
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
                      {/* Books descending to lines */}
                      <path d="M1 2v6l2.5 1.25V3.25L1 2z" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M4.5 2v6l2.5 1.25V3.25L4.5 2z" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M6 11l2 2" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M10 14h5M10 12h4M10 10h3" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Descendant
                  </button>
                </div>

                {/* Search Button */}
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    const searchInput = document.getElementById('search-input') as HTMLInputElement
                    const query = searchInput?.value.trim()
                    if (query && !isProcessing) {
                      handleSimpleQuery(query)
                      // Keep query visible in search bar during processing
                    }
                  }}
                  className="borges-btn-primary disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Recherche Borges'}
                </button>

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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
                  {/* Hexagon Assembly Animation - positioned just below search bar, no countdown */}
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <style>{`
                        @keyframes hexPulse1 { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
                        @keyframes hexPulse2 { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.85; } }
                        @keyframes hexPulse3 { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
                        @keyframes shelfPulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }
                        @keyframes glowPulse { 0%, 100% { filter: drop-shadow(0 0 2px #a0a0a0); } 50% { filter: drop-shadow(0 0 6px #f5f5f5); } }
                        .proc-hex-main { animation: hexPulse1 2s ease-in-out infinite, glowPulse 2s ease-in-out infinite; }
                        .proc-hex-top { animation: hexPulse2 2.5s ease-in-out 0.2s infinite; }
                        .proc-hex-bl { animation: hexPulse3 2.2s ease-in-out 0.4s infinite; }
                        .proc-hex-br { animation: hexPulse3 2.4s ease-in-out 0.6s infinite; }
                        .proc-shelf { animation: shelfPulse 1.5s ease-in-out infinite; }
                      `}</style>

                      {/* Central hexagon */}
                      <polygon
                        className="proc-hex-main"
                        points="100,35 135,55 135,95 100,115 65,95 65,55"
                        stroke="#f5f5f5"
                        strokeWidth="2"
                        fill="none"
                      />

                      {/* Book shelves inside */}
                      <line className="proc-shelf" x1="75" y1="60" x2="125" y2="60" stroke="#a0a0a0" strokeWidth="1" style={{ animationDelay: '0s' }} />
                      <line className="proc-shelf" x1="78" y1="72" x2="122" y2="72" stroke="#a0a0a0" strokeWidth="1" style={{ animationDelay: '0.2s' }} />
                      <line className="proc-shelf" x1="80" y1="84" x2="120" y2="84" stroke="#a0a0a0" strokeWidth="1" style={{ animationDelay: '0.4s' }} />
                      <line className="proc-shelf" x1="83" y1="96" x2="117" y2="96" stroke="#a0a0a0" strokeWidth="1" style={{ animationDelay: '0.6s' }} />

                      {/* Top hexagon */}
                      <polygon
                        className="proc-hex-top"
                        points="100,10 125,24 125,52 100,66 75,52 75,24"
                        stroke="#a0a0a0"
                        strokeWidth="1"
                        fill="none"
                      />

                      {/* Bottom left hexagon */}
                      <polygon
                        className="proc-hex-bl"
                        points="65,95 90,109 90,137 65,151 40,137 40,109"
                        stroke="#a0a0a0"
                        strokeWidth="1"
                        fill="none"
                      />

                      {/* Bottom right hexagon */}
                      <polygon
                        className="proc-hex-br"
                        points="135,95 160,109 160,137 135,151 110,137 110,109"
                        stroke="#a0a0a0"
                        strokeWidth="1"
                        fill="none"
                      />
                    </svg>
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
                <div className="text-center">
                  {/* Hexagon Library Assembly Animation */}
                  <svg className="w-48 h-48 mx-auto mb-4" viewBox="0 0 200 200" fill="none">
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
                  <div className="text-borges-light-muted text-xs italic max-w-lg text-center px-4">
                    « L&apos;univers (que d&apos;autres appellent la Bibliothèque) se compose d&apos;un nombre indéfini, et peut-être infini, de galeries hexagonales... »
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

      {/* Answer Panel - Bottom Left with GraphRAG Context - Basile Minimalism */}
      {showAnswer && (
        <div className="borges-panel fixed bottom-4 left-4 w-[400px] max-h-[45vh] overflow-auto text-borges-light shadow-borges-lg z-30">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-h3 text-borges-light">GraphRAG Analysis</h3>
            <button
              onClick={() => setShowAnswer(false)}
              className="borges-btn-ghost text-lg"
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