'use client'

import { useState } from 'react'
import { reconciliationService, type DebugInfo } from '@/lib/services/reconciliation'
import QueryDebugPanel from './QueryDebugPanel'
import QueryAnimationControls from './QueryAnimationControls'
import DebugVisualization from './DebugVisualization'
import ProgressiveDebugVisualization from './ProgressiveDebugVisualization'

interface Book {
  id: string
  title: string
  author: string
  graphData?: any
}

interface QueryInterfaceProps {
  selectedBook: Book | null
  visibleNodeIds: string[]
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
    visible_nodes_count: number
    node_context: string[]
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
  visibleNodeIds,
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
        visible_node_ids: visibleNodeIds,
        mode: mode,
        debug_mode: debugMode
      })

      if (result.success) {
        const newResult: QueryResult = {
          query: currentQuery,
          answer: result.answer,
          timestamp: new Date(),
          context: result.context,
          search_path: result.search_path,
          debug_info: result.debug_info
        }
        setLastResult(newResult)
        setShowResult(true)

        // Trigger highlighting if search path is available
        if (result.search_path && onHighlightPath) {
          console.log('🎯 Highlighting search path:', result.search_path)
          onHighlightPath(result.search_path)
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="relative">
      {/* Search Bar */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Explorez la galaxie de connaissances avec une question..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-borges-light placeholder-gray-400 focus:outline-none focus:border-borges-accent"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-borges-accent border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 bg-borges-accent text-black font-medium rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Analyse...' : 'Explorer'}
            </button>
          </div>

          {/* Mode Selection and Stats */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('local')}
                className={`px-2 py-1 rounded ${
                  mode === 'local'
                    ? 'bg-borges-accent text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => setMode('global')}
                className={`px-2 py-1 rounded ${
                  mode === 'global'
                    ? 'bg-borges-accent text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Global
              </button>

              {/* Debug Mode Toggle */}
              <button
                type="button"
                onClick={() => setDebugMode(!debugMode)}
                className={`px-2 py-1 rounded flex items-center space-x-1 ${
                  debugMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Enable GraphRAG debug visualization"
              >
                <span>🔬</span>
                <span>Debug</span>
              </button>

              {/* Debug Visualization Button - Only show when we have debug info */}
              {debugMode && lastResult?.debug_info && (
                <button
                  type="button"
                  onClick={() => setShowDebugPanel(true)}
                  className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 flex items-center space-x-1"
                  title="View GraphRAG processing phases"
                >
                  <span>📊</span>
                  <span>Phases</span>
                </button>
              )}
            </div>
            <div className="text-gray-400">
              {visibleNodeIds.length} nœuds visibles
            </div>
          </div>
        </div>
      </form>

      {/* Result Overlay */}
      {showResult && lastResult && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-borges-secondary border border-gray-600 rounded-lg p-4 shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Question:</div>
              <div className="text-borges-light font-medium text-sm">{lastResult.query}</div>
            </div>
            <button
              onClick={() => {
                setShowResult(false)
                if (onClearHighlight) {
                  onClearHighlight()
                }
              }}
              className="text-gray-400 hover:text-borges-light ml-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Context Info */}
          {lastResult.context && (
            <div className="mb-3 p-2 bg-gray-800 rounded text-xs">
              <div className="text-gray-400">
                Mode: <span className="text-borges-accent">{lastResult.context.mode}</span> •
                Nœuds visibles: <span className="text-borges-accent">{lastResult.context.visible_nodes_count}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Réponse Réconciliée:</div>
            <div className="text-gray-300 text-sm leading-relaxed">
              {lastResult.answer}
            </div>
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