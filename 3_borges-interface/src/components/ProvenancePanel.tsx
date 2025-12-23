/**
 * ProvenancePanel Component
 * Displays the complete provenance chain for a GraphRAG query
 * Feature: 001-interactive-graphrag-refinement - User Story 1 (AC1)
 * Updated: 004-ui-consistency (T036-T038) - Commune attribution
 *
 * Constitution Principle VII: Civic Provenance Chain
 * Shows:
 * - Query details
 * - Entities used (ranked by relevance) with commune attribution
 * - Relationships traversed
 * - Source chunks with commune of origin
 */

'use client';

import { useState, useEffect } from 'react';
import type { ProvenanceChain, UsedEntity, TraversedRelationship, SourceChunk } from '@/types/provenance';
import { getProvenanceChain, formatEntityDisplay, formatRelationshipDisplay } from '@/lib/services/provenance';
import { getCommuneDisplayName } from '@/lib/utils/commune-mapping';

interface ProvenancePanelProps {
  queryId: string | null;
  onEntityClick?: (entityId: string, entityName: string) => void;
  onRelationshipClick?: (relationship: TraversedRelationship) => void;
  onChunkClick?: (chunkId: string) => void;
}

export default function ProvenancePanel({
  queryId,
  onEntityClick,
  onRelationshipClick,
  onChunkClick,
}: ProvenancePanelProps) {
  const [provenance, setProvenance] = useState<ProvenanceChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships' | 'chunks'>('entities');

  useEffect(() => {
    if (!queryId) {
      setProvenance(null);
      return;
    }

    const fetchProvenance = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProvenanceChain(queryId);
        setProvenance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provenance');
      } finally {
        setLoading(false);
      }
    };

    fetchProvenance();
  }, [queryId]);

  if (!queryId) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-400">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg mb-2 text-white">Answer Provenance Panel</p>
          <p className="text-sm">Submit a query to see which entities, relationships, and source text chunks were used to build the answer. Click through to trace each element back to the original civic contributions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-400">Loading provenance chain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center text-red-400">
          <div className="text-4xl mb-4">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!provenance) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📭</div>
          <p>No provenance data available</p>
        </div>
      </div>
    );
  }

  const { entities = [], relationships = [], chunks = [] } = provenance;

  return (
    <div className="flex flex-col h-full bg-borges-secondary border-l border-borges-border">
      {/* Header - Basile Minimalism */}
      <div className="p-4 border-b border-borges-border">
        <h2 className="text-h2 text-borges-light mb-2">Answer Provenance</h2>
        <p className="text-sm text-borges-light-muted mb-3">
          <strong className="text-borges-light">See how the answer was built:</strong> View the entities, relationships, and source text that GraphRAG used to construct this answer.
        </p>
        <p className="text-xs text-borges-muted mb-2">
          Query ID: <span className="text-borges-light font-mono">{queryId}</span>
        </p>
        <div className="flex gap-4 text-sm text-borges-light-muted">
          <span>{entities.length} entities</span>
          <span>{relationships.length} relationships</span>
          <span>{chunks.length} source chunks</span>
        </div>
      </div>

      {/* Tabs - Basile Minimalism: no emoji */}
      <div className="flex border-b border-borges-border">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'entities'
              ? 'bg-borges-dark text-borges-light border-b-2 border-borges-light'
              : 'text-borges-light-muted hover:text-borges-light hover:bg-borges-dark-hover'
          }`}
          onClick={() => setActiveTab('entities')}
        >
          Entities ({entities.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'relationships'
              ? 'bg-borges-dark text-borges-light border-b-2 border-borges-light'
              : 'text-borges-light-muted hover:text-borges-light hover:bg-borges-dark-hover'
          }`}
          onClick={() => setActiveTab('relationships')}
        >
          Relationships ({relationships.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chunks'
              ? 'bg-borges-dark text-borges-light border-b-2 border-borges-light'
              : 'text-borges-light-muted hover:text-borges-light hover:bg-borges-dark-hover'
          }`}
          onClick={() => setActiveTab('chunks')}
        >
          Chunks ({chunks.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'entities' && (
          <>
            {entities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No entities found
              </div>
            ) : (
              entities.map((entity: UsedEntity, index: number) => (
                <div
                  key={entity.entity_id || index}
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-light cursor-pointer transition-colors"
                  onClick={() => onEntityClick?.(entity.entity_id, entity.entity_name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                          #{entity.rank}
                        </span>
                        <span className="font-medium text-white">{entity.entity_name}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Type: <span className="text-borges-light">{entity.entity_type}</span>
                        {/* Constitution Principle VII: Commune attribution (T037) */}
                        {(entity.commune || entity.book_title) && (
                          <> • Commune: <span className="text-yellow-300">{getCommuneDisplayName(entity.commune || entity.book_title)}</span></>
                        )}
                      </div>
                      {entity.description && (
                        <div className="mt-2 text-sm text-gray-300">
                          {entity.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-borges-light">
                        {(entity.relevance_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">relevance</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'relationships' && (
          <>
            {relationships.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No relationships found
              </div>
            ) : (
              relationships.map((rel: TraversedRelationship, index: number) => (
                <div
                  key={`${rel.source_id}-${rel.target_id}-${index}`}
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-light cursor-pointer transition-colors"
                  onClick={() => onRelationshipClick?.(rel)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                      Hop {rel.hop_distance}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/50 rounded text-blue-300">
                      {rel.relationship_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">{rel.source_name}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-white font-medium">{rel.target_name}</span>
                  </div>
                  {rel.weight !== undefined && (
                    <div className="mt-2 text-xs text-gray-400">
                      Weight: <span className="text-borges-light">{rel.weight.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'chunks' && (
          <>
            {chunks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No source chunks found
              </div>
            ) : (
              chunks.map((chunk: SourceChunk, index: number) => (
                <div
                  key={chunk.chunk_id || index}
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-light cursor-pointer transition-colors"
                  onClick={() => onChunkClick?.(chunk.chunk_id)}
                >
                  {/* Constitution Principle VII: Commune of origin (T038) */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-yellow-900/50 rounded text-yellow-300">
                      🏛️ {getCommuneDisplayName(chunk.commune || chunk.book_title)}
                    </span>
                    {chunk.page && (
                      <span className="text-xs text-gray-400">
                        Contribution #{chunk.page}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 line-clamp-3">
                    {chunk.content}
                  </div>
                  {chunk.entity_highlights && chunk.entity_highlights.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chunk.entity_highlights.map((entity, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Footer Stats - Basile Minimalism */}
      <div className="p-3 border-t border-borges-border bg-borges-secondary">
        <div className="text-xs text-borges-muted text-center">
          Principle #5: End-to-end interpretability
        </div>
      </div>
    </div>
  );
}
