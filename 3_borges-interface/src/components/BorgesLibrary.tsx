'use client'

import { useState, useEffect, useCallback } from 'react'
import GraphVisualization3DForce from './GraphVisualization3DForce'
import QueryInterface from './QueryInterface'
import { reconciliationService } from '@/lib/services/reconciliation'


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

export default function BorgesLibrary() {
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
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<string>('a_rebours_huysmans')
  const [multiBook, setMultiBook] = useState<boolean>(false)
  const [mode, setMode] = useState<'local' | 'global'>('local')
  const [processingStats, setProcessingStats] = useState<{
    nodes: number;
    communities: number;
    neo4jRelationships?: number;
    crossBookLinks?: number;
    entityCommunityLinks?: number;
  }>({ nodes: 0, communities: 0 })

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
  }, [selectedBook])

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
      // Load top 500 nodes with relationships
      console.log(`📚 Loading top 500 nodes (optimized for performance)...`)
      console.log(`🚀 Using reasonable limits: 500 nodes, 50-node chunks`)
      console.log(`⚡ Rebuild: ${new Date().toISOString()}`)
      const nodesData = await reconciliationService.getNodes({ limit: 500 })
      if (nodesData.success && nodesData.nodes.length > 0) {
        const nodeIds = nodesData.nodes.map(node => node.id)
        console.log(`📊 Loaded ${nodeIds.length} top nodes from knowledge base`)

        // Get relationships with optimized chunking
        let relationships: any[] = []
        let relationshipsFiltered = false
        let relationshipsLimit = 0
        try {
          const relationshipsData = await reconciliationService.getRelationships(nodeIds, 10000)
          relationships = relationshipsData.success ? relationshipsData.relationships : []
          relationshipsFiltered = relationshipsData.filtered || false
          relationshipsLimit = relationshipsData.limit_applied || 0
        } catch (relError) {
          console.error('⚠️ Failed to load relationships, continuing with nodes only:', relError)
          // Continue with empty relationships array - nodes will still be visible
        }

        console.log(`📈 FULL knowledge base loaded successfully:`)
        console.log(`  • Total Nodes: ${nodesData.nodes.length} (complete dataset)`)
        console.log(`  • Total Relationships: ${relationships.length}`)
        console.log(`  • Coverage: ${(relationships.length / nodesData.nodes.length).toFixed(2)} relationships per node`)
        console.log(`  📚 This represents the COMPLETE knowledge base, like test_query_analysis.py`)

        if (relationshipsFiltered) {
          console.warn(`⚠️ Relationship count was limited to ${relationshipsLimit} (may need higher limit)`)
        }

        setReconciliationData({
          nodes: nodesData.nodes,
          relationships
        })

        // Set initial visible nodes (all nodes for comprehensive view)
        setVisibleNodeIds(nodesData.nodes.map(node => node.id))
      }
    } catch (error) {
      console.error('Error loading full knowledge base:', error)
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
    setCurrentProcessingPhase('🔍 Analyse de la requête')
  }

  const handleProcessingPhaseChange = (phase: string) => {
    setCurrentProcessingPhase(phase)
  }

  const handleProcessingEnd = () => {
    setIsProcessing(false)
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

          // Show answer from all books
          let combinedAnswer = 'No relevant results found across the books.'

          if (result.book_results && Array.isArray(result.book_results)) {
            const validResults = result.book_results
              .filter((r: any) => r && r.answer && !r.error && r.answer !== "Sorry, I'm not able to provide an answer to that question.")
              .map((r: any) => {
                const bookName = r.book_id ? r.book_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown Book'
                return `📖 **${bookName}**:\n${r.answer}`
              })

            if (validResults.length > 0) {
              combinedAnswer = validResults.join('\n\n---\n\n')
            }
          }

          setQueryAnswer(combinedAnswer)
          setShowAnswer(true)

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

            setReconciliationData({
              nodes: result.selected_nodes || [],
              relationships: result.selected_relationships || []
            })

            // Create debug info for visualization consistency
            const aggregatedDebugInfo = {
              processing_phases: {
                entity_selection: {
                  entities: result.selected_nodes.map((node: any, index: number) => ({
                    id: node.label,
                    name: node.label,
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
          } else {
            // Clear search path if no nodes available
            setSearchPath(null)
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
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="p-3 bg-gray-800 rounded border border-borges-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-borges-accent rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-borges-accent">Processing Query...</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>{currentProcessingPhase || '🔍 Analyzing question...'}</div>
                    {processingStats.nodes > 0 && (
                      <div className="text-borges-accent">✓ {processingStats.nodes} entités extraites</div>
                    )}
                    {processingStats.communities > 0 && (
                      <div className="text-borges-accent">✓ {processingStats.communities} communautés analysées</div>
                    )}
                    {(processingStats.neo4jRelationships || 0) > 0 && (
                      <div className="text-blue-400">🔗 {processingStats.neo4jRelationships} relations Neo4j enrichies</div>
                    )}
                    {(processingStats.entityCommunityLinks || 0) > 0 && (
                      <div className="text-purple-400">🏘️ {processingStats.entityCommunityLinks} liens entité↔communauté</div>
                    )}
                    {(processingStats.crossBookLinks || 0) > 0 && (
                      <div className="text-red-400">📚 {processingStats.crossBookLinks} connexions inter-livres</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3D Force Graph Visualization */}
          <div className="flex-1 bg-black relative">
            <GraphVisualization3DForce
              reconciliationData={reconciliationData}
              searchPath={searchPath}
              debugInfo={debugInfo}
              onNodeVisibilityChange={setVisibleNodeIds}
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
          </div>
        </div>
      </main>

      {/* Answer Panel - Bottom Left with GraphRAG Context like test_query_analysis.py */}
      {showAnswer && (
        <div className="fixed bottom-4 left-4 bg-borges-dark border border-borges-accent rounded-lg p-4 max-w-lg max-h-96 overflow-auto text-white shadow-2xl z-50">
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
            <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{queryAnswer}</div>
          </div>
        </div>
      )}
    </div>
  )
}