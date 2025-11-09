'use client'

import { useState, useEffect } from 'react'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingPhase, setCurrentProcessingPhase] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>('')
  const [queryAnswer, setQueryAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<string>('a_rebours_huysmans')
  const [multiBook, setMultiBook] = useState<boolean>(false)
  const [mode, setMode] = useState<'local' | 'global'>('local')
  const [processingStats, setProcessingStats] = useState<{ nodes: number; communities: number }>({ nodes: 0, communities: 0 })

  useEffect(() => {
    loadBooks()
    loadReconciliationGraph()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSimpleQuery = async (query: string) => {
    console.log('🔍 Processing query:', query)

    setIsProcessing(true)
    setCurrentProcessingPhase('🔍 Running GraphRAG...')
    setCurrentQuery(query)
    setProcessingStats({ nodes: 0, communities: 0 })

    try {
      if (multiBook) {
        // Multi-book query
        console.log(`📚 Querying ALL BOOKS with mode: ${mode}`)
        const result = await reconciliationService.multiBookQuery({
          query,
          mode,
          debug_mode: true
        })

        if (result.success) {
          const aggregated = result.aggregated || {}
          const entities = aggregated.entities || []
          const relationships = aggregated.relationships || []
          const communities = aggregated.communities || []

          setProcessingStats({ nodes: entities.length, communities: communities.length })
          setCurrentProcessingPhase(`✓ Retrieved ${entities.length} nodes, ${communities.length} communities`)

          // Show nodes
          if (entities.length > 0) {
            const searchPath = {
              entities: entities.map((e: any, idx: number) => ({ ...e, order: idx })),
              relations: relationships.map((r: any, idx: number) => ({ ...r, traversalOrder: idx })),
              communities
            }
            setSearchPath(searchPath)
            handleHighlightPath(searchPath)
          }

          // Show answer
          const combinedAnswer = result.book_results
            ?.filter((r: any) => r.answer && !r.error)
            .map((r: any) => `📖 ${r.book_id}:\n${r.answer}`)
            .join('\n\n---\n\n') || 'No results'

          setQueryAnswer(combinedAnswer)
          setShowAnswer(true)
        }
      } else {
        // Single-book query
        console.log(`📖 Querying book: ${selectedBook}, mode: ${mode}`)
        const result = await reconciliationService.reconciledQuery({
          query,
          mode,
          debug_mode: true,
          book_id: selectedBook
        })

        if (result.success && result.nodes) {
          setProcessingStats({ nodes: result.nodes.length, communities: (result.graph?.total_relationships || 0) })
          setCurrentProcessingPhase(`✓ Retrieved ${result.nodes.length} nodes`)

          // Convert to search path
          const searchPath = {
            entities: result.nodes.map((node: any, idx: number) => ({
              id: node.id,
              score: (node.degree || 0) / 100,
              order: idx
            })),
            relations: result.relationships?.map((rel: any, idx: number) => ({
              source: rel.source,
              target: rel.target,
              traversalOrder: idx
            })) || [],
            communities: []
          }

          setSearchPath(searchPath)
          handleHighlightPath(searchPath)
          setQueryAnswer(result.answer || 'No answer')
          setShowAnswer(true)
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
  }

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
                      <div className="text-borges-accent">✓ {processingStats.nodes} nodes extracted</div>
                    )}
                    {processingStats.communities > 0 && (
                      <div className="text-borges-accent">✓ {processingStats.communities} communities analyzed</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3D Force Graph Visualization */}
          <div className="flex-1 bg-black">
            <GraphVisualization3DForce
              reconciliationData={reconciliationData}
              searchPath={searchPath}
              onNodeVisibilityChange={setVisibleNodeIds}
              isProcessing={isProcessing}
              currentProcessingPhase={currentProcessingPhase}
            />
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