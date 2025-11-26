'use client'

import { useState } from 'react'
import { reconciliationService, type DebugInfo } from '@/lib/services/reconciliation'
import { colorService, type EntityColorInfo } from '@/lib/utils/colorService'
import QueryDebugPanel from './QueryDebugPanel'
import QueryAnimationControls from './QueryAnimationControls'
import DebugVisualization from './DebugVisualization'
import ProgressiveDebugVisualization from './ProgressiveDebugVisualization'
import HighlightedText from './HighlightedText'

interface Book {
  id: string
  title: string
  author: string
  graphData?: any
}

interface QueryInterfaceProps {
  selectedBook: Book | null
  onHighlightPath?: (searchPath: any) => void
  onClearHighlight?: () => void
  onProcessingStart?: () => void
  onProcessingPhaseChange?: (phase: string) => void
  onProcessingEnd?: () => void
}

interface QueryResult {
  query: string
  answer: string
  timestamp: Date
  context?: {
    mode: 'local' | 'global'
  }
  search_path?: {
    entities: Array<{ id: string; score: number; order: number }>
    relations: Array<{ source: string; target: string; traversalOrder: number }>
    communities: Array<{ id: string; relevance: number }>
  }
  debug_info?: DebugInfo
}

export default function QueryInterface({
  selectedBook,
  onHighlightPath,
  onClearHighlight,
  onProcessingStart,
  onProcessingPhaseChange,
  onProcessingEnd
}: QueryInterfaceProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<QueryResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [mode, setMode] = useState<'local' | 'global'>('local')

  // Interpretability state - entity colors for highlighted text
  const [coloredEntities, setColoredEntities] = useState<EntityColorInfo[]>([])

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [currentProcessingPhase, setCurrentProcessingPhase] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<{
    phases: Array<{
      name: string
      status: 'pending' | 'processing' | 'completed'
      duration?: number
      data?: any
    }>
    currentPhase: number
  }>({
    phases: [],
    currentPhase: 0
  })

  // Animation state
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [currentAnimationPhase, setCurrentAnimationPhase] = useState('explosion')
  const [animationProgress, setAnimationProgress] = useState(0)

  const simulateProcessingPhases = () => {
    const phases = [
      { name: '🔍 Analyse de la requête', duration: 1000 },
      { name: '👥 Sélection des entités', duration: 1500 },
      { name: '🏘️ Analyse des communautés', duration: 2000 },
      { name: '🔗 Cartographie des relations', duration: 1200 },
      { name: '📝 Synthèse textuelle', duration: 1800 },
      { name: '✨ Finalisation', duration: 800 }
    ]

    setProcessingProgress({
      phases: phases.map(p => ({ ...p, status: 'pending' as const })),
      currentPhase: 0
    })

    let currentPhaseIndex = 0

    const processPhase = () => {
      if (currentPhaseIndex < phases.length) {
        // Mark current phase as processing
        setProcessingProgress(prev => ({
          ...prev,
          phases: prev.phases.map((p, i) =>
            i === currentPhaseIndex
              ? { ...p, status: 'processing' as const }
              : p
          ),
          currentPhase: currentPhaseIndex
        }))

        setCurrentProcessingPhase(phases[currentPhaseIndex].name)

        // Notify parent component about phase change
        if (onProcessingPhaseChange) {
          onProcessingPhaseChange(phases[currentPhaseIndex].name)
        }

        // Complete phase after duration
        setTimeout(() => {
          setProcessingProgress(prev => ({
            ...prev,
            phases: prev.phases.map((p, i) =>
              i === currentPhaseIndex
                ? { ...p, status: 'completed' as const }
                : p
            )
          }))

          currentPhaseIndex++
          processPhase()
        }, phases[currentPhaseIndex].duration)
      } else {
        setCurrentProcessingPhase(null)
        // Notify processing end
        if (onProcessingEnd) {
          onProcessingEnd()
        }
      }
    }

    processPhase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    const currentQuery = query.trim()
    setQuery('')
    setShowResult(false)

    try {
      // Start progressive processing animation if debug mode is enabled
      if (debugMode) {
        if (onProcessingStart) {
          onProcessingStart()
        }
        setShowDebugPanel(true)
        simulateProcessingPhases()
        setIsAnimationPlaying(true)
        setCurrentAnimationPhase('explosion')
        setAnimationProgress(0)
      }

      const result = await reconciliationService.reconciledQuery({
        query: currentQuery,
        mode: mode,
        debug_mode: debugMode
      })

      if (result.success) {
        console.log('🔍 FULL API RESULT:', JSON.stringify(result, null, 2))

        // Convert nodes and relationships from GraphRAG extraction
        const searchPath = {
          entities: result.nodes?.map((node: any, idx: number) => ({
            id: node.id,
            score: (node.degree || 0) / 100,
            order: idx
          })) || [],
          relations: result.relationships?.map((rel: any, idx: number) => ({
            source: rel.source,
            target: rel.target,
            traversalOrder: idx
          })) || [],
          communities: []
        }

        console.log('🎯 SearchPath created:', searchPath)

        // Extract entities from multiple sources for coloring
        let entitiesToColor: Array<{
          id: string
          type: string
          description?: string
          rank?: number
          order?: number
          score: number
        }> = []

        console.log('🔍 Checking entity sources...')
        console.log('1. Debug entities:', result.debug_info?.processing_phases?.entity_selection?.entities)
        console.log('2. Selected nodes:', result.selected_nodes)
        console.log('3. Regular nodes:', result.nodes)
        console.log('4. SearchPath entities:', searchPath.entities)

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
            type: inferEntityTypeFromLabels(node.labels),
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
            type: inferEntityTypeFromLabels(node.labels),
            description: node.properties?.description,
            score: (node.degree || 1) / 100,
            order: idx
          }))
        }
        // Priority 4: Fallback to search_path entities
        else if (searchPath.entities.length > 0) {
          console.log('✅ Using searchPath entities (Priority 4)')
          entitiesToColor = searchPath.entities.map((entity: any) => ({
            id: entity.id,
            type: 'CONCEPT', // Default type when not available
            score: entity.score,
            order: entity.order
          }))
        }
        else {
          console.log('❌ NO ENTITIES FOUND IN ANY SOURCE!')
        }

        console.log('🎨 REAL-TIME DEBUG - Entities to color:', entitiesToColor)
        console.log('🎨 REAL-TIME DEBUG - First entity example:', entitiesToColor[0])

        // Always enrich entities with colors for interpretability
        const enrichedEntities = colorService.enrichEntitiesWithColors(entitiesToColor)
        setColoredEntities(enrichedEntities)

        console.log('🎨 REAL-TIME DEBUG - Entities enriched with colors for interpretability:', enrichedEntities)
        console.log('🎨 REAL-TIME DEBUG - First enriched entity:', enrichedEntities[0])

        const newResult: QueryResult = {
          query: currentQuery,
          answer: result.answer,
          timestamp: new Date(),
          context: result.context,
          search_path: searchPath,
          debug_info: result.debug_info
        }
        setLastResult(newResult)
        setShowResult(true)

        // Trigger highlighting with extracted nodes
        if (onHighlightPath) {
          console.log('🎯 Highlighting search path:', searchPath)
          onHighlightPath(searchPath)
        }
      } else {
        throw new Error('Erreur lors de la requête')
      }
    } catch (error) {
      console.error('Error querying reconciled API:', error)
      const errorResult: QueryResult = {
        query: currentQuery,
        answer: 'Désolé, une erreur s\'est produite lors du traitement de votre question. Veuillez réessayer.',
        timestamp: new Date(),
      }
      setLastResult(errorResult)
      setShowResult(true)
    } finally {
      setIsLoading(false)
      // Stop animation when query completes
      if (debugMode) {
        setIsAnimationPlaying(false)
        setCurrentAnimationPhase('crystallization')
        setAnimationProgress(1)
      }
    }
  }

  // Helper function to infer entity type from Neo4j labels
  const inferEntityTypeFromLabels = (labels: string[]): string => {
    if (!labels || labels.length === 0) return 'CONCEPT'

    // Map Neo4j labels to entity types
    const labelMappings: Record<string, string> = {
      'Person': 'PERSON',
      'Personne': 'PERSON',
      'Location': 'LOCATION',
      'Place': 'LOCATION',
      'Lieu': 'LOCATION',
      'Event': 'EVENT',
      'Evenement': 'EVENT',
      'Événement': 'EVENT',
      'Organization': 'ORGANIZATION',
      'Organisation': 'ORGANIZATION',
      'Book': 'BOOK',
      'Livre': 'BOOK',
      'Concept': 'CONCEPT'
    }

    // Find the first matching label
    for (const label of labels) {
      if (labelMappings[label]) {
        return labelMappings[label]
      }
    }

    // Default fallback
    return 'CONCEPT'
  }

  // Animation control functions
  const handleAnimationPlay = () => {
    setIsAnimationPlaying(true)
  }

  const handleAnimationPause = () => {
    setIsAnimationPlaying(false)
  }

  const handleAnimationReset = () => {
    setIsAnimationPlaying(false)
    setCurrentAnimationPhase('explosion')
    setAnimationProgress(0)
  }

  const handleSeekToPhase = (phaseIndex: number) => {
    const phases = ['explosion', 'filtering', 'synthesis', 'crystallization']
    if (phaseIndex >= 0 && phaseIndex < phases.length) {
      setCurrentAnimationPhase(phases[phaseIndex])
      setAnimationProgress(0)
    }
  }

  const handleTriggerAnimation = (phase?: string) => {
    if (phase) {
      setCurrentAnimationPhase(phase)
    }
    setIsAnimationPlaying(!isAnimationPlaying)
  }

  const handleEntityClick = (entity: EntityColorInfo) => {
    console.log('🎯 Entity clicked for highlight:', entity)
    if (onHighlightPath && lastResult?.search_path) {
      // Create a search path focused on the clicked entity
      const focusedSearchPath = {
        entities: [{
          id: entity.id,
          score: entity.score,
          order: 0
        }],
        relations: lastResult.search_path.relations.filter(rel =>
          rel.source === entity.id || rel.target === entity.id
        ),
        communities: lastResult.search_path.communities
      }
      onHighlightPath(focusedSearchPath)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="relative">
      {/* Search Bar - Basile Minimalism */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="borges-input pr-12"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-borges-light border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-borges-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="borges-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Analyzing...' : 'Explore'}
            </button>
          </div>

          {/* Mode Selection - Basile Minimalism */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('local')}
                className={`px-2 py-1 rounded-borges-sm transition-colors ${
                  mode === 'local'
                    ? 'bg-borges-light text-borges-dark'
                    : 'bg-borges-secondary text-borges-light-muted hover:text-borges-light border border-borges-border'
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => setMode('global')}
                className={`px-2 py-1 rounded-borges-sm transition-colors ${
                  mode === 'global'
                    ? 'bg-borges-light text-borges-dark'
                    : 'bg-borges-secondary text-borges-light-muted hover:text-borges-light border border-borges-border'
                }`}
              >
                Global
              </button>

              {/* Debug Mode Toggle */}
              <button
                type="button"
                onClick={() => setDebugMode(!debugMode)}
                className={`px-2 py-1 rounded-borges-sm flex items-center space-x-1 transition-colors ${
                  debugMode
                    ? 'bg-borges-light text-borges-dark'
                    : 'bg-borges-secondary text-borges-light-muted hover:text-borges-light border border-borges-border'
                }`}
                title="Enable GraphRAG debug visualization"
              >
                <span>Debug</span>
              </button>

              {/* Debug Visualization Button - Only show when we have debug info */}
              {debugMode && lastResult?.debug_info && (
                <button
                  type="button"
                  onClick={() => setShowDebugPanel(true)}
                  className="px-2 py-1 rounded-borges-sm bg-borges-secondary text-borges-light hover:bg-borges-dark-hover border border-borges-light flex items-center space-x-1 transition-colors"
                  title="View GraphRAG processing phases"
                >
                  <span>Phases</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Result Panel - Non-blocking side popup for graph exploration */}
      {showResult && lastResult && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-borges-secondary border border-borges-border rounded-borges-md p-4 shadow-borges-lg z-10 max-h-80 overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="text-xs text-borges-muted mb-1">Query:</div>
              <div className="text-borges-light font-medium text-sm">{lastResult.query}</div>
            </div>
            <button
              onClick={() => {
                setShowResult(false)
                if (onClearHighlight) {
                  onClearHighlight()
                }
              }}
              className="borges-btn-ghost p-1 hover:bg-borges-dark-hover rounded-borges-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Context Info */}
          {lastResult.context && (
            <div className="mb-3 p-2 bg-borges-dark rounded-borges-sm text-xs border border-borges-border">
              <div className="text-borges-muted">
                Mode: <span className="text-borges-light">{lastResult.context.mode}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-xs text-borges-muted mb-2">Reconciled Answer:</div>
            <HighlightedText
              text={lastResult.answer}
              entities={coloredEntities}
              onEntityClick={handleEntityClick}
              className="text-borges-light-muted"
              showTooltip={true}
            />
          </div>

          {/* Animation Controls - Show when debug mode is enabled and we have debug info */}
          {debugMode && lastResult.debug_info && (
            <QueryAnimationControls
              animationTimeline={lastResult.debug_info.animation_timeline}
              isPlaying={isAnimationPlaying}
              currentPhase={currentAnimationPhase}
              currentProgress={animationProgress}
              onPlay={handleAnimationPlay}
              onPause={handleAnimationPause}
              onReset={handleAnimationReset}
              onSeekToPhase={handleSeekToPhase}
              className="mb-4"
            />
          )}

        </div>
      )}

      {/* Debug Panel - Separate from result overlay */}
      {debugMode && lastResult?.debug_info && (
        <QueryDebugPanel
          debugInfo={lastResult.debug_info}
          isVisible={showDebugPanel}
          onToggleVisibility={() => setShowDebugPanel(!showDebugPanel)}
          onTriggerAnimation={handleTriggerAnimation}
          isAnimationPlaying={isAnimationPlaying}
        />
      )}

      {/* Progressive GraphRAG Processing Visualization */}
      <ProgressiveDebugVisualization
        isVisible={showDebugPanel && debugMode && isLoading}
        processingProgress={processingProgress}
        currentProcessingPhase={currentProcessingPhase}
        onClose={() => setShowDebugPanel(false)}
      />

      {/* Final Debug Results Visualization */}
      {!isLoading && (
        <DebugVisualization
          debugInfo={lastResult?.debug_info}
          isVisible={showDebugPanel && debugMode && !isLoading && !!lastResult?.debug_info}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </div>
  )
}