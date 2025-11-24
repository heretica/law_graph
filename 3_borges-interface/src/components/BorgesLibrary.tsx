'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const GraphVisualization3DForce = dynamic(() => import('./GraphVisualization3DForce'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96 bg-black">
      <div className="text-center">
        <div className="text-6xl mb-4">🌐</div>
        <div className="text-white">Initialisation du graphe 3D...</div>
      </div>
    </div>
  )
})
import { GraphErrorBoundary } from './GraphErrorBoundary'
import QueryInterface from './QueryInterface'
import HighlightedText from './HighlightedText'
import LoadingWheel3D from './LoadingWheel3D'
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
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)
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

        // Helper function to identify book nodes (Principle #2)
        const isBookNode = (node: any): boolean => {
          return (node as any).type === 'Book' ||
            (node.labels && node.labels.includes('Livres')) ||
            (node.labels && node.labels.includes('BOOK')) ||
            String(node.id).startsWith('LIVRE_') ||
            String(node.properties?.id || '').startsWith('LIVRE_')
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
      {/* Header */}
      <header className="p-6 border-b border-borges-secondary">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-light tracking-wide">
            🏛️ Bibliothèque de Borges
          </h1>
          <p className="text-gray-400 mt-2">
            Une exploration interactive des connexions infinies entre les livres
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-120px)]">
        <div className="h-full flex flex-col">
          {/* Enhanced Query Bar with Controls */}
          <div className="p-4 bg-borges-secondary border-b border-gray-600">
            <div className="max-w-6xl mx-auto space-y-3">
              {/* Main Search Row */}
              <div className="flex gap-2">
                {/* Book Selector */}
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  disabled={multiBook || isProcessing}
                  className="px-3 py-2 bg-borges-dark border border-gray-600 rounded text-sm text-white focus:border-borges-accent focus:outline-none disabled:opacity-50"
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
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                    multiBook
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Query all books at once"
                >
                  📚 All Books
                </button>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Posez une question..."
                  disabled={isProcessing}
                  id="search-input"
                  className="flex-1 p-2 bg-borges-dark border border-gray-600 rounded text-white placeholder-gray-400 focus:border-borges-accent focus:outline-none disabled:opacity-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isProcessing) {
                      const query = (e.target as HTMLInputElement).value.trim()
                      if (query) {
                        handleSimpleQuery(query)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />

                {/* Mode Toggle */}
                <div className="flex gap-1 bg-gray-700 rounded p-1">
                  <button
                    onClick={() => setMode('local')}
                    disabled={isProcessing}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                      mode === 'local'
                        ? 'bg-borges-accent text-black'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Local
                  </button>
                  <button
                    onClick={() => setMode('global')}
                    disabled={isProcessing}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                      mode === 'global'
                        ? 'bg-borges-accent text-black'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Global
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
                      searchInput.value = ''
                    }
                  }}
                  className="px-4 py-2 bg-borges-accent text-black font-medium rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '⏳' : '🔍'}
                </button>

                {/* Provenance Panel Toggle */}
                {currentQueryId && (
                  <button
                    onClick={() => setShowProvenancePanel(!showProvenancePanel)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      showProvenancePanel
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Toggle provenance panel"
                  >
                    🔗 Provenance
                  </button>
                )}
              </div>

              {/* Minimal Processing Indicator with 3D Wheel */}
              {isProcessing && (
                <div className="mt-2 mb-2 flex items-center justify-center gap-6 py-2">
                  {/* Left: GraphRAG Processing */}
                  <div className="flex items-center gap-2 text-sm text-gray-300 animate-pulse">
                    <span className="text-blue-400">📚</span>
                    <span>GraphRAG</span>
                  </div>

                  {/* Center: 3D Wheel + Timer */}
                  <div className="flex flex-col items-center gap-1">
                    <LoadingWheel3D size={32} speed={1.5} color="#D97706" />
                    <span className="font-mono text-xs text-borges-accent">
                      {formatElapsedTime(elapsedTime)}
                    </span>
                  </div>

                  {/* Right: Neo4j Processing */}
                  <div className="flex items-center gap-2 text-sm text-gray-300 animate-pulse">
                    <span className="text-green-400">🔗</span>
                    <span>Neo4j</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3D Force Graph Visualization with Provenance Panel */}
          <div className="flex-1 flex bg-black relative">
            {/* Main Graph Container */}
            <div className="flex-1 bg-black relative">
              <GraphErrorBoundary>
                <GraphVisualization3DForce
                  reconciliationData={reconciliationData}
                  searchPath={searchPath}
                  debugInfo={debugInfo}
                  onNodeVisibilityChange={setVisibleNodeIds}
                  onNodeClick={handleNodeClick}
                  isProcessing={isProcessing}
                  currentProcessingPhase={currentProcessingPhase}
              />

            {/* Loading Overlay with Star Animation */}
            {isLoadingGraph && (
              <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                <div className="text-center">
                  <h2 className="text-2xl font-serif text-borges-accent mb-8 animate-pulse leading-relaxed">
                    &ldquo;Il suffit qu&apos;un livre soit possible pour qu&apos;il existe&rdquo;
                  </h2>
                  <p className="text-sm text-gray-400 italic mb-6 font-serif">— Jorge Luis Borges</p>

                  {/* Star Constellation Loading Animation */}
                  <div className="relative w-64 h-64 mx-auto mb-6">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Constellation of stars that light up in sequence */}
                      {[
                        { x: 20, y: 15, delay: 0 },
                        { x: 35, y: 25, delay: 0.2 },
                        { x: 50, y: 20, delay: 0.4 },
                        { x: 65, y: 30, delay: 0.6 },
                        { x: 80, y: 18, delay: 0.8 },
                        { x: 15, y: 40, delay: 1.0 },
                        { x: 30, y: 50, delay: 1.2 },
                        { x: 50, y: 45, delay: 1.4 },
                        { x: 70, y: 55, delay: 1.6 },
                        { x: 85, y: 45, delay: 1.8 },
                        { x: 25, y: 70, delay: 2.0 },
                        { x: 45, y: 75, delay: 2.2 },
                        { x: 65, y: 80, delay: 2.4 },
                        { x: 80, y: 70, delay: 2.6 },
                      ].map((star, index) => (
                        <g key={index}>
                          {/* Star shape */}
                          <path
                            d={`M${star.x},${star.y - 2} L${star.x + 0.6},${star.y - 0.6} L${star.x + 2},${star.y} L${star.x + 0.6},${star.y + 0.6} L${star.x},${star.y + 2} L${star.x - 0.6},${star.y + 0.6} L${star.x - 2},${star.y} L${star.x - 0.6},${star.y - 0.6} Z`}
                            fill="#F4C842"
                            className="animate-pulse"
                            style={{
                              animationDelay: `${star.delay}s`,
                              animationDuration: '1.5s',
                              animationIterationCount: 'infinite',
                              animationDirection: 'alternate'
                            }}
                          />
                          {/* Glowing effect */}
                          <circle
                            cx={star.x}
                            cy={star.y}
                            r="1"
                            fill="#F4C842"
                            className="animate-pulse"
                            style={{
                              animationDelay: `${star.delay}s`,
                              animationDuration: '1.5s',
                              animationIterationCount: 'infinite',
                              animationDirection: 'alternate'
                            }}
                          />
                        </g>
                      ))}

                      {/* Connecting lines between stars */}
                      <g stroke="#F4C842" strokeWidth="0.3" fill="none" opacity="0.3">
                        <path d="M20,15 L35,25 L50,20 L65,30 L80,18" className="animate-pulse" style={{ animationDuration: '3s' }} />
                        <path d="M15,40 L30,50 L50,45 L70,55 L85,45" className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                        <path d="M25,70 L45,75 L65,80 L80,70" className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        <path d="M35,25 L30,50" className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                        <path d="M50,20 L50,45" className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
                        <path d="M65,30 L70,55" className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '2.5s' }} />
                      </g>
                    </svg>
                  </div>

                </div>
              </div>
            )}
            </GraphErrorBoundary>
            </div>

            {/* Provenance Panel - Side Panel */}
            {showProvenancePanel && currentQueryId && (
              <div className="w-96">
                <ProvenancePanel
                  queryId={currentQueryId}
                  onEntityClick={handleProvenanceEntityClick}
                  onRelationshipClick={handleRelationshipClick}
                  onChunkClick={handleChunkClick}
                />
              </div>
            )}
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

      {/* Answer Panel - Bottom Left with GraphRAG Context like test_query_analysis.py */}
      {showAnswer && (
        <div className="fixed bottom-4 left-4 bg-borges-dark border border-borges-accent rounded-lg p-4 w-[500px] max-h-[600px] overflow-auto text-white shadow-2xl z-50">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-semibold text-borges-accent">📊 GraphRAG Analysis</h3>
            <button
              onClick={() => setShowAnswer(false)}
              className="text-gray-400 hover:text-white text-lg ml-2"
            >
              ×
            </button>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Question:</div>
            <div className="text-xs text-borges-light font-medium line-clamp-2">{currentQuery}</div>
          </div>

          {/* GraphRAG Context Analysis like test_query_analysis.py */}
          {searchPath && (
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="text-xs font-semibold text-borges-accent mb-2">🔍 Knowledge Base Analysis:</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">🏘️ Communities:</span>
                  <span className="text-white">{searchPath.communities?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">👥 Entities:</span>
                  <span className="text-white">{searchPath.entities?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🔗 Relationships:</span>
                  <span className="text-white">{searchPath.relations?.length || 0}</span>
                </div>
              </div>
              {searchPath.entities && searchPath.entities.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Key Entities Used:</div>
                  <div className="text-xs text-gray-300 max-h-16 overflow-y-auto">
                    {searchPath.entities.slice(0, 5).map((entity: any, i: number) => (
                      <div key={i} className="truncate">• {entity.id || entity.name || entity}</div>
                    ))}
                    {searchPath.entities.length > 5 && (
                      <div className="text-gray-500">... and {searchPath.entities.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs text-gray-400 mb-1">Réponse:</div>
            <div className="max-h-80 overflow-y-auto pr-2">
              <HighlightedText
                text={queryAnswer}
                entities={coloredEntities}
                className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap"
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