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

  useEffect(() => {
    loadReconciliationGraph()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


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

    // Start processing animation
    setIsProcessing(true)
    setCurrentProcessingPhase('🔍 Analyse de la requête')

    try {
      // Simulate processing phases while making real API call
      const phases = [
        { name: '🔍 Analyse de la requête', duration: 1000 },
        { name: '👥 Sélection des entités', duration: 1500 },
        { name: '🏘️ Analyse des communautés', duration: 2000 },
        { name: '🔗 Cartographie des relations', duration: 1200 },
        { name: '📝 Synthèse textuelle', duration: 1800 }
      ]

      // Start the API call - Query FULL knowledge base like test_query_analysis.py
      console.log(`🔍 Querying FULL knowledge base (all books/entities) like test_query_analysis.py`)
      console.log(`📚 Removing visible_node_ids restriction to access complete dataset`)
      const apiCallPromise = reconciliationService.reconciledQuery({
        query,
        // REMOVED: visible_node_ids parameter - this was artificially limiting GraphRAG queries
        // GraphRAG should query the ENTIRE knowledge base, not a pre-filtered subset
        mode: 'global', // Changed to global to query all data like test file
        debug_mode: true // Enable debug to see detailed tracking like test_query_analysis.py
      })

      // Run phases animation in parallel with API call
      for (let i = 0; i < phases.length; i++) {
        setCurrentProcessingPhase(phases[i].name)
        await new Promise(resolve => setTimeout(resolve, phases[i].duration))
      }

      // Wait for API response
      const result = await apiCallPromise

      if (result.success) {
        // Debug: Log the search_path to see what we're getting
        console.log('🔍 Query result search_path:', result.search_path)
        console.log('📊 Query result full data:', result)

        // Store the query and answer
        setCurrentQuery(query)
        setQueryAnswer(result.answer)
        setShowAnswer(true)

        // Extract entity IDs from search_path for visualization highlighting
        if (result.search_path && result.search_path.entities) {
          const entityIds = result.search_path.entities.map((e: any) => e.id)
          console.log('🎯 Query found entities from FULL knowledge base:', entityIds)
          console.log(`📊 GraphRAG Context Analysis (like test_query_analysis.py):`)
          console.log(`   👥 Entities used: ${result.search_path.entities.length}`)
          console.log(`   🔗 Relationships used: ${result.search_path.relations?.length || 0}`)
          console.log(`   🏘️ Communities used: ${result.search_path.communities?.length || 0}`)

          // Keep ALL nodes loaded for comprehensive view, but highlight query results
          // This matches test_query_analysis.py behavior - full dataset available, specific entities highlighted
          setVisibleNodeIds(reconciliationData?.nodes.map(node => node.id) || [])

          // Set the search path for highlighting specific query results
          setSearchPath(result.search_path)
          handleHighlightPath(result.search_path)
        } else {
          console.warn('⚠️ No search_path in result - may need backend updates:', result)
        }
      } else {
        setCurrentQuery(query)
        setQueryAnswer('Erreur lors du traitement de la requête')
        setShowAnswer(true)
      }
    } catch (error) {
      console.error('Error processing query:', error)
      setCurrentQuery(query)
      setQueryAnswer('Erreur lors du traitement de la requête')
      setShowAnswer(true)
    } finally {
      // End processing
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
          {/* Simple Query Bar */}
          <div className="p-4 bg-borges-secondary border-b border-gray-600">
            <div className="max-w-4xl mx-auto">
              <input
                type="text"
                placeholder="Posez une question pour voir les nœuds apparaître dynamiquement..."
                className="w-full p-3 bg-borges-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-borges-accent focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim()
                    if (query) {
                      handleSimpleQuery(query)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
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