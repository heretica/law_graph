'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import type {
  DebugInfo,
  DebugEntity,
  DebugCommunity,
  DebugRelationship,
  DebugTextSource
} from '@/lib/services/reconciliation'

interface QueryDebugPanelProps {
  debugInfo: DebugInfo | null
  isVisible: boolean
  onToggleVisibility: () => void
  onTriggerAnimation?: (phase?: string) => void
  isAnimationPlaying?: boolean
}

export default function QueryDebugPanel({
  debugInfo,
  isVisible,
  onToggleVisibility,
  onTriggerAnimation,
  isAnimationPlaying = false
}: QueryDebugPanelProps) {
  const [activeTab, setActiveTab] = useState<'entities' | 'communities' | 'relationships' | 'sources'>('entities')
  const [selectedPhase, setSelectedPhase] = useState<string>('entity_selection')

  if (!debugInfo) return null

  const { processing_phases, context_stats, animation_timeline } = debugInfo

  const handlePhaseSelect = (phase: string) => {
    setSelectedPhase(phase)

    // Set active tab based on phase
    switch (phase) {
      case 'entity_selection':
        setActiveTab('entities')
        break
      case 'community_analysis':
        setActiveTab('communities')
        break
      case 'relationship_mapping':
        setActiveTab('relationships')
        break
      case 'text_synthesis':
        setActiveTab('sources')
        break
    }

    // Trigger animation for this phase
    if (onTriggerAnimation) {
      onTriggerAnimation(processing_phases[phase as keyof typeof processing_phases]?.phase)
    }
  }

  const renderEntityTable = (entities: DebugEntity[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Score
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {entities.map((entity, idx) => (
            <tr key={entity.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {entity.name || entity.id}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {entity.type}
                </span>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {entity.rank}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(entity.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="ml-2 text-xs">{(entity.score * 100).toFixed(0)}%</span>
                </div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                {entity.description || 'No description'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCommunityCards = (communities: DebugCommunity[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {communities.map((community, idx) => (
        <div key={community.id || idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {community.title}
            </h4>
            <div className="flex items-center">
              <span className="text-yellow-500">⭐</span>
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                {community.impact_rating}/10
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
            {community.content}
          </p>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Relevance: {(community.relevance * 100).toFixed(0)}%</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
              Community {community.id}
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  const renderRelationshipList = (relationships: DebugRelationship[]) => (
    <div className="space-y-3">
      {relationships.slice(0, 20).map((rel, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs">
                {rel.source}
              </span>
              <span className="mx-2 text-gray-400">→</span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs">
                {rel.target}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Weight: {rel.weight} | Order: {rel.traversal_order}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {rel.description}
          </p>
        </div>
      ))}
      {relationships.length > 20 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          ... and {relationships.length - 20} more relationships
        </div>
      )}
    </div>
  )

  const renderSourcesList = (sources: DebugTextSource[]) => (
    <div className="space-y-3">
      {sources.map((source, idx) => (
        <div key={source.id || idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Source {source.id}
            </h4>
            <div className="flex items-center">
              <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${source.relevance * 100}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {(source.relevance * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {source.content}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Debug Panel Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onToggleVisibility}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {isVisible ? (
            <ChevronUpIcon className="w-4 h-4 mr-2" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 mr-2" />
          )}
          🔬 GraphRAG Debug Information
        </button>

        {isVisible && (
          <div className="flex items-center space-x-3">
            {/* Animation Controls */}
            <button
              onClick={() => onTriggerAnimation?.()}
              className="flex items-center px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {isAnimationPlaying ? (
                <PauseIcon className="w-3 h-3 mr-1" />
              ) : (
                <PlayIcon className="w-3 h-3 mr-1" />
              )}
              {isAnimationPlaying ? 'Pause' : 'Replay'} Animation
            </button>

            {/* Performance Stats */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total: {context_stats.total_time_ms}ms | Mode: {context_stats.mode}
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel Content */}
      {isVisible && (
        <div className="p-4 space-y-6">
          {/* Animation Timeline */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Processing Timeline
            </h3>
            <div className="flex space-x-1">
              {animation_timeline.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className={`flex-1 h-8 rounded cursor-pointer transition-all ${
                    selectedPhase === Object.keys(processing_phases)[idx]
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => handlePhaseSelect(Object.keys(processing_phases)[idx])}
                  title={phase.description}
                >
                  <div className="flex items-center justify-center h-full text-xs font-medium">
                    {phase.phase}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Phases Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'entities', label: 'Entities', count: processing_phases.entity_selection.entities?.length || 0 },
                { key: 'communities', label: 'Communities', count: processing_phases.community_analysis.communities?.length || 0 },
                { key: 'relationships', label: 'Relationships', count: processing_phases.relationship_mapping.relationships?.length || 0 },
                { key: 'sources', label: 'Text Sources', count: processing_phases.text_synthesis.sources?.length || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'entities' && processing_phases.entity_selection.entities && (
              renderEntityTable(processing_phases.entity_selection.entities)
            )}
            {activeTab === 'communities' && processing_phases.community_analysis.communities && (
              renderCommunityCards(processing_phases.community_analysis.communities)
            )}
            {activeTab === 'relationships' && processing_phases.relationship_mapping.relationships && (
              renderRelationshipList(processing_phases.relationship_mapping.relationships)
            )}
            {activeTab === 'sources' && processing_phases.text_synthesis.sources && (
              renderSourcesList(processing_phases.text_synthesis.sources)
            )}
          </div>
        </div>
      )}
    </div>
  )
}