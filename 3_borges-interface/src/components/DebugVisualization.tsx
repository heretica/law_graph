'use client'

import { useState, useEffect } from 'react'
import { DebugInfo, DebugEntity, DebugCommunity, DebugRelationship, DebugTextSource } from '@/lib/services/reconciliation'

interface DebugVisualizationProps {
  debugInfo?: DebugInfo | null
  isVisible: boolean
  onClose: () => void
}

export default function DebugVisualization({
  debugInfo,
  isVisible,
  onClose
}: DebugVisualizationProps) {
  const [activePhase, setActivePhase] = useState<string>('entity_selection')

  if (!isVisible || !debugInfo) return null

  const phases = [
    { key: 'entity_selection', label: 'Sélection des Entités', icon: '👥' },
    { key: 'community_analysis', label: 'Analyse des Communautés', icon: '🏘️' },
    { key: 'relationship_mapping', label: 'Cartographie des Relations', icon: '🔗' },
    { key: 'text_synthesis', label: 'Synthèse Textuelle', icon: '📝' }
  ]

  const getPhaseData = (phaseKey: string) => {
    return debugInfo.processing_phases[phaseKey as keyof typeof debugInfo.processing_phases]
  }

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-borges-dark border border-borges-secondary rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto text-white">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-borges-light">🔬 Debug GraphRAG</h2>
            <p className="text-gray-400">Analyse des phases de traitement</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Context Stats */}
        <div className="bg-borges-secondary p-4 rounded mb-6">
          <h3 className="text-lg font-semibold mb-3">📊 Statistiques Contextuelles</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400">Mode:</span>
              <span className="ml-2 font-semibold">{debugInfo.context_stats.mode.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-400">Temps total:</span>
              <span className="ml-2 font-semibold">{formatDuration(debugInfo.context_stats.total_time_ms)}</span>
            </div>
            <div>
              <span className="text-gray-400">Taille du prompt:</span>
              <span className="ml-2 font-semibold">{debugInfo.context_stats.prompt_length.toLocaleString()} chars</span>
            </div>
          </div>
        </div>

        {/* Phase Navigation */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {phases.map((phase) => {
            const phaseData = getPhaseData(phase.key)
            return (
              <button
                key={phase.key}
                onClick={() => setActivePhase(phase.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded whitespace-nowrap ${
                  activePhase === phase.key
                    ? 'bg-borges-primary text-white'
                    : 'bg-borges-secondary text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{phase.icon}</span>
                <span className="text-sm">{phase.label}</span>
                <span className="text-xs opacity-75">({formatDuration(phaseData?.duration_ms || 0)})</span>
              </button>
            )
          })}
        </div>

        {/* Phase Content */}
        <div className="min-h-[400px]">
          {activePhase === 'entity_selection' && (
            <EntitySelectionPhase phase={getPhaseData('entity_selection')} />
          )}
          {activePhase === 'community_analysis' && (
            <CommunityAnalysisPhase phase={getPhaseData('community_analysis')} />
          )}
          {activePhase === 'relationship_mapping' && (
            <RelationshipMappingPhase phase={getPhaseData('relationship_mapping')} />
          )}
          {activePhase === 'text_synthesis' && (
            <TextSynthesisPhase phase={getPhaseData('text_synthesis')} />
          )}
        </div>

        {/* Animation Timeline */}
        {debugInfo.animation_timeline && debugInfo.animation_timeline.length > 0 && (
          <div className="mt-6 bg-borges-secondary p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">🎬 Timeline d&apos;Animation</h3>
            <div className="space-y-2">
              {debugInfo.animation_timeline.map((step, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <span className="w-8 h-8 bg-borges-primary rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="flex-1">{step.description}</span>
                  <span className="text-gray-400">{formatDuration(step.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EntitySelectionPhase({ phase }: { phase: any }) {
  if (!phase || !phase.entities) {
    return <div className="text-gray-400">Aucune donnée d&apos;entité disponible</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">👥 Sélection des Entités</h3>
      <p className="text-gray-400 mb-4">
        Phase: {phase.phase} • Durée: {phase.duration_ms}ms
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-3">Entités Sélectionnées ({phase.entities.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {phase.entities.map((entity: DebugEntity, index: number) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  entity.selected
                    ? 'bg-green-900 border-green-500'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-sm text-gray-400">{entity.type}</div>
                    <div className="text-xs text-gray-500 mt-1">{entity.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Rang: {entity.rank}</div>
                    <div className="text-sm">Score: {entity.score.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Statistiques</h4>
          <div className="bg-borges-secondary p-4 rounded">
            <div className="space-y-2">
              <div>Entités sélectionnées: {phase.entities.filter((e: DebugEntity) => e.selected).length}</div>
              <div>Total d&apos;entités: {phase.entities.length}</div>
              <div>Score moyen: {(phase.entities.reduce((sum: number, e: DebugEntity) => sum + e.score, 0) / phase.entities.length).toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommunityAnalysisPhase({ phase }: { phase: any }) {
  if (!phase || !phase.communities) {
    return <div className="text-gray-400">Aucune donnée de communauté disponible</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">🏘️ Analyse des Communautés</h3>
      <p className="text-gray-400 mb-4">
        Phase: {phase.phase} • Durée: {phase.duration_ms}ms
      </p>

      <div className="space-y-4">
        {phase.communities.map((community: DebugCommunity, index: number) => (
          <div key={index} className="bg-borges-secondary p-4 rounded">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold">Communauté {community.id}</h4>
                <p className="text-gray-400">{community.title}</p>
              </div>
              <div className="text-right">
                <div className="text-sm">Pertinence: {community.relevance.toFixed(3)}</div>
                <div className="text-sm">Impact: {community.impact_rating}/10</div>
              </div>
            </div>
            <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded max-h-32 overflow-y-auto">
              {community.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RelationshipMappingPhase({ phase }: { phase: any }) {
  if (!phase || !phase.relationships) {
    return <div className="text-gray-400">Aucune donnée de relation disponible</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">🔗 Cartographie des Relations</h3>
      <p className="text-gray-400 mb-4">
        Phase: {phase.phase} • Durée: {phase.duration_ms}ms
      </p>

      <div className="space-y-3">
        {phase.relationships.map((relationship: DebugRelationship, index: number) => (
          <div key={index} className="bg-borges-secondary p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{relationship.source}</span>
                <span className="text-borges-primary">→</span>
                <span className="font-medium">{relationship.target}</span>
              </div>
              <div className="text-right text-sm">
                <div>Poids: {relationship.weight.toFixed(3)}</div>
                <div>Rang: {relationship.rank}</div>
                <div>Ordre: {relationship.traversal_order}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {relationship.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TextSynthesisPhase({ phase }: { phase: any }) {
  if (!phase || !phase.sources) {
    return <div className="text-gray-400">Aucune donnée de synthèse disponible</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">📝 Synthèse Textuelle</h3>
      <p className="text-gray-400 mb-4">
        Phase: {phase.phase} • Durée: {phase.duration_ms}ms
      </p>

      <div className="space-y-4">
        {phase.sources.map((source: DebugTextSource, index: number) => (
          <div key={index} className="bg-borges-secondary p-4 rounded">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold">Source {source.id}</h4>
              <span className="text-sm">Pertinence: {source.relevance.toFixed(3)}</span>
            </div>
            <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {source.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}