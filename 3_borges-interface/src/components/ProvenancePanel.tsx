/**
 * ProvenancePanel Component
 * Displays the complete provenance chain for a GraphRAG query
 * Feature: 001-interactive-graphrag-refinement - User Story 1 (AC1)
 *
 * Shows:
 * - Query details
 * - Entities used (ranked by relevance)
 * - Relationships traversed
 * - Source chunks with book references
 */

'use client';

import { useState, useEffect } from 'react';
import type { ProvenanceChain, UsedEntity, TraversedRelationship, SourceChunk } from '@/types/provenance';
import { getProvenanceChain, formatEntityDisplay, formatRelationshipDisplay } from '@/lib/services/provenance';

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
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p>Submit a query to view provenance</p>
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
    <div className="flex flex-col h-full bg-borges-secondary border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-2">🔗 Provenance Chain</h2>
        <p className="text-sm text-gray-400">
          Query: <span className="text-white font-mono text-xs">{queryId}</span>
        </p>
        <div className="flex gap-4 mt-2 text-sm text-gray-400">
          <span>📊 {entities.length} entities</span>
          <span>🔗 {relationships.length} relationships</span>
          <span>📄 {chunks.length} chunks</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'entities'
              ? 'bg-borges-dark text-white border-b-2 border-borges-accent'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('entities')}
        >
          📊 Entities ({entities.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'relationships'
              ? 'bg-borges-dark text-white border-b-2 border-borges-accent'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('relationships')}
        >
          🔗 Relationships ({relationships.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chunks'
              ? 'bg-borges-dark text-white border-b-2 border-borges-accent'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('chunks')}
        >
          📄 Chunks ({chunks.length})
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
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-accent cursor-pointer transition-colors"
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
                        Type: <span className="text-borges-accent">{entity.entity_type}</span>
                        {entity.book_title && (
                          <> • Book: <span className="text-gray-300">{entity.book_title}</span></>
                        )}
                      </div>
                      {entity.description && (
                        <div className="mt-2 text-sm text-gray-300">
                          {entity.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-borges-accent">
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
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-accent cursor-pointer transition-colors"
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
                      Weight: <span className="text-borges-accent">{rel.weight.toFixed(2)}</span>
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
                  className="p-3 bg-borges-dark rounded border border-gray-700 hover:border-borges-accent cursor-pointer transition-colors"
                  onClick={() => onChunkClick?.(chunk.chunk_id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-yellow-900/50 rounded text-yellow-300">
                      📖 {chunk.book_title}
                    </span>
                    {chunk.page && (
                      <span className="text-xs text-gray-400">
                        Page {chunk.page}
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

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-700 bg-borges-secondary">
        <div className="text-xs text-gray-400 text-center">
          Constitutional Principle #5: End-to-end interpretability ✓
        </div>
      </div>
    </div>
  );
}
