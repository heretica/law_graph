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
      <table className="min-w-full divide-y divide-borges-border">
        <thead className="bg-borges-secondary">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-borges-light-muted uppercase tracking-wider">
              Name
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-borges-light-muted uppercase tracking-wider">
              Type
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-borges-light-muted uppercase tracking-wider">
              Rank
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-borges-light-muted uppercase tracking-wider">
              Score
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-borges-light-muted uppercase tracking-wider">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="bg-borges-dark divide-y divide-borges-border">
          {entities.map((entity, idx) => (
            <tr key={entity.id || idx} className="hover:bg-borges-dark-hover">
              <td className="px-3 py-4 text-sm font-medium text-borges-light">
                {entity.name || entity.id}
              </td>
              <td className="px-3 py-4 text-sm text-borges-light-muted">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-borges-secondary text-borges-accent border border-borges-border">
                  {entity.type}
                </span>
              </td>
              <td className="px-3 py-4 text-sm text-borges-light-muted">
                {entity.rank}
              </td>
              <td className="px-3 py-4 text-sm text-borges-light-muted">
                <div className="flex items-center">
                  <div className="w-16 bg-borges-secondary rounded-full h-2">
                    <div
                      className="bg-borges-accent h-2 rounded-full"
                      style={{ width: `${Math.min(entity.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="ml-2 text-xs">{(entity.score * 100).toFixed(0)}%</span>
                </div>
              </td>
              <td className="px-3 py-4 text-sm text-borges-light-muted max-w-xs truncate">
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
        <div key={community.id || idx} className="bg-borges-secondary rounded-borges-md p-4 border border-borges-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-borges-light">
              {community.title}
            </h4>
            <div className="flex items-center">
              <span className="text-borges-accent">{community.impact_rating}/10</span>
            </div>
          </div>
          <p className="text-sm text-borges-light-muted mb-2 line-clamp-3">
            {community.content}
          </p>
          <div className="flex justify-between items-center text-xs text-borges-muted">
            <span>Relevance: {(community.relevance * 100).toFixed(0)}%</span>
            <span className="px-2 py-1 bg-borges-dark text-borges-light-muted rounded-borges-sm border border-borges-border">
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
        <div key={idx} className="bg-borges-secondary rounded-borges-md p-3 border border-borges-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm font-medium text-borges-light">
              <span className="bg-borges-dark text-borges-light px-2 py-1 rounded-borges-sm text-xs border border-borges-border">
                {rel.source}
              </span>
              <span className="mx-2 text-borges-accent">→</span>
              <span className="bg-borges-dark text-borges-light px-2 py-1 rounded-borges-sm text-xs border border-borges-border">
                {rel.target}
              </span>
            </div>
            <div className="text-xs text-borges-muted">
              Weight: {rel.weight} | Order: {rel.traversal_order}
            </div>
          </div>
          <p className="text-sm text-borges-light-muted">
            {rel.description}
          </p>
        </div>
      ))}
      {relationships.length > 20 && (
        <div className="text-center text-sm text-borges-muted">
          ... and {relationships.length - 20} more relationships
        </div>
      )}
    </div>
  )

  const renderSourcesList = (sources: DebugTextSource[]) => (
    <div className="space-y-3">
      {sources.map((source, idx) => (
        <div key={source.id || idx} className="bg-borges-secondary rounded-borges-md p-4 border border-borges-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-borges-light">
              Source {source.id}
            </h4>
            <div className="flex items-center">
              <div className="w-16 bg-borges-dark rounded-full h-2">
                <div
                  className="bg-borges-accent h-2 rounded-full"
                  style={{ width: `${source.relevance * 100}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-borges-muted">
                {(source.relevance * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-borges-light-muted">
            {source.content}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <div className="border-t border-borges-border">
      {/* Debug Panel Header */}
      <div className="flex items-center justify-between p-4 bg-borges-secondary">
        <button
          onClick={onToggleVisibility}
          className="flex items-center text-sm font-medium text-borges-light-muted hover:text-borges-light"
        >
          {isVisible ? (
            <ChevronUpIcon className="w-4 h-4 mr-2" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 mr-2" />
          )}
          GraphRAG Debug Information
        </button>

        {isVisible && (
          <div className="flex items-center space-x-3">
            {/* Animation Controls */}
            <button
              onClick={() => onTriggerAnimation?.()}
              className="borges-btn-primary text-xs"
            >
              {isAnimationPlaying ? (
                <PauseIcon className="w-3 h-3 mr-1" />
              ) : (
                <PlayIcon className="w-3 h-3 mr-1" />
              )}
              {isAnimationPlaying ? 'Pause' : 'Replay'} Animation
            </button>

            {/* Performance Stats */}
            <div className="text-xs text-borges-muted">
              Total: {context_stats.total_time_ms}ms | Mode: {context_stats.mode}
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel Content */}
      {isVisible && (
        <div className="p-4 space-y-6 bg-borges-dark">
          {/* Animation Timeline */}
          <div className="bg-borges-secondary rounded-borges-md p-4">
            <h3 className="text-sm font-medium text-borges-light mb-3">
              Processing Timeline
            </h3>
            <div className="flex space-x-1">
              {animation_timeline.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className={`flex-1 h-8 rounded-borges-sm cursor-pointer transition-all ${
                    selectedPhase === Object.keys(processing_phases)[idx]
                      ? 'bg-borges-accent text-borges-dark'
                      : 'bg-borges-dark hover:bg-borges-dark-hover text-borges-light-muted'
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
          <div className="border-b border-borges-border">
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
                      ? 'border-borges-accent text-borges-accent'
                      : 'border-transparent text-borges-muted hover:text-borges-light-muted hover:border-borges-border'
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