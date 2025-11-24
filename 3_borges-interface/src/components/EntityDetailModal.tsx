/**
 * EntityDetailModal Component
 * Displays detailed information about a graph entity with source chunks
 * Feature: 001-interactive-graphrag-refinement - User Story 1 (AC2)
 *
 * Shows:
 * - Entity properties from reconciliation data
 * - Connected relationships with source chunks
 * - Source book information
 * - Complete provenance trail from entity to source text
 */

'use client';

import { useState, useEffect } from 'react';
import HighlightedText from './HighlightedText';

interface ReconciliationNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  degree: number;
  centrality_score: number;
}

interface ReconciliationRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
  source_chunk_ids?: string[];
}

interface ReconciliationGraphData {
  nodes: ReconciliationNode[];
  relationships: ReconciliationRelationship[];
}

interface EntityDetailModalProps {
  entityId: string | null;
  entityName?: string;
  reconciliationData: ReconciliationGraphData | null;
  onClose: () => void;
}

interface ExtractedChunk {
  text: string;
  relationshipType: string;
  source: string;
  target: string;
  bookId?: string;
  chunkId?: string;
  isChunkId?: boolean;
}

export default function EntityDetailModal({
  entityId,
  entityName,
  reconciliationData,
  onClose,
}: EntityDetailModalProps) {
  const [entity, setEntity] = useState<ReconciliationNode | null>(null);
  const [relationships, setRelationships] = useState<ReconciliationRelationship[]>([]);
  const [chunks, setChunks] = useState<ExtractedChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingChunks, setFetchingChunks] = useState(false);

  useEffect(() => {
    if (!entityId || !reconciliationData) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Find the entity in the graph data
    const foundEntity = reconciliationData.nodes.find(node => node.id === entityId);
    setEntity(foundEntity || null);

    // Find all relationships involving this entity
    const relatedRelationships = reconciliationData.relationships.filter(rel =>
      rel.source === entityId || rel.target === entityId
    );
    setRelationships(relatedRelationships);

    // Extract chunks from relationships and entity properties
    const extractedChunks: ExtractedChunk[] = [];

    // First, check if entity has description (actual text from source chunks)
    const entityDescription = foundEntity?.properties?.description;
    if (entityDescription && typeof entityDescription === 'string' && entityDescription.length > 0) {
      // Use the description directly - it already contains the source text
      const bookId = foundEntity?.properties?.source_id; // This is actually the book ID
      extractedChunks.push({
        text: entityDescription,
        relationshipType: 'ENTITY_DESCRIPTION',
        source: entityId,
        target: entityId,
        bookId,
        isChunkId: false, // This is already the text content, not an ID to fetch
      });
    }

    // Then extract chunks from relationships
    relatedRelationships.forEach(rel => {
      // Check for graphml_source_chunks property
      const chunkText = rel.properties?.graphml_source_chunks;
      if (chunkText && typeof chunkText === 'string') {
        // Check if this contains <SEP> separated chunk IDs
        if (chunkText.includes('<SEP>')) {
          const chunkIds = chunkText.split('<SEP>').filter(id => id.trim());
          const bookId = foundEntity?.properties?.book_id || rel.properties?.book_id;

          chunkIds.forEach(chunkId => {
            const trimmedChunkId = chunkId.trim();
            if (trimmedChunkId) {
              extractedChunks.push({
                text: trimmedChunkId,
                relationshipType: rel.type,
                source: rel.source,
                target: rel.target,
                chunkId: trimmedChunkId,
                bookId,
                isChunkId: true,
              });
            }
          });
        } else {
          // Single chunk ID or actual text
          const isChunkId = chunkText.startsWith('chunk-') || chunkText === 'book_linkage';

          extractedChunks.push({
            text: chunkText,
            relationshipType: rel.type,
            source: rel.source,
            target: rel.target,
            chunkId: isChunkId ? chunkText : undefined,
            bookId: isChunkId ? (foundEntity?.properties?.book_id || rel.properties?.book_id) : undefined,
            isChunkId,
          });
        }
      }

      // Also check for source_chunk, chunks, or source_id properties
      const sourceChunk = rel.properties?.source_chunk || rel.properties?.chunks || rel.properties?.source_id;
      if (sourceChunk && typeof sourceChunk === 'string' && sourceChunk !== chunkText) {
        // Check if this contains <SEP> separated chunk IDs
        if (sourceChunk.includes('<SEP>')) {
          const chunkIds = sourceChunk.split('<SEP>').filter(id => id.trim());
          const bookId = foundEntity?.properties?.book_id || rel.properties?.book_id;

          chunkIds.forEach(chunkId => {
            const trimmedChunkId = chunkId.trim();
            if (trimmedChunkId) {
              extractedChunks.push({
                text: trimmedChunkId,
                relationshipType: rel.type,
                source: rel.source,
                target: rel.target,
                chunkId: trimmedChunkId,
                bookId,
                isChunkId: true,
              });
            }
          });
        } else {
          // Single chunk ID or actual text
          const isChunkId = sourceChunk.startsWith('chunk-') || sourceChunk === 'book_linkage';

          extractedChunks.push({
            text: sourceChunk,
            relationshipType: rel.type,
            source: rel.source,
            target: rel.target,
            chunkId: isChunkId ? sourceChunk : undefined,
            bookId: isChunkId ? (foundEntity?.properties?.book_id || rel.properties?.book_id) : undefined,
            isChunkId,
          });
        }
      }
    });

    setChunks(extractedChunks);
    setLoading(false);

    console.log(`📊 Entity details loaded:`, {
      entity: foundEntity,
      relationships: relatedRelationships.length,
      chunks: extractedChunks.length,
    });
  }, [entityId, reconciliationData]);

  // Fetch actual chunk text for chunk IDs
  useEffect(() => {
    const fetchChunkContents = async () => {
      if (chunks.length === 0 || fetchingChunks) return;

      // Find chunks that need their content fetched
      const chunksToFetch = chunks.filter(chunk => chunk.isChunkId && chunk.chunkId && chunk.bookId);

      if (chunksToFetch.length === 0) return;

      setFetchingChunks(true);
      console.log(`🔍 Fetching ${chunksToFetch.length} chunk contents...`);

      // Fetch all chunks in parallel
      const fetchPromises = chunksToFetch.map(async (chunk) => {
        try {
          const response = await fetch(`/api/reconciliation/chunks/${chunk.bookId}/${chunk.chunkId}`);

          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch chunk ${chunk.chunkId}:`, response.status);
            return { chunkId: chunk.chunkId, content: null };
          }

          const data = await response.json();
          console.log(`✅ Fetched chunk ${chunk.chunkId}, content length:`, data.content?.length || 0);

          return {
            chunkId: chunk.chunkId,
            content: data.content || null,
          };
        } catch (error) {
          console.error(`❌ Error fetching chunk ${chunk.chunkId}:`, error);
          return { chunkId: chunk.chunkId, content: null };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Update chunks with fetched content
      setChunks(prevChunks => {
        const updatedChunks = [...prevChunks];
        results.forEach(result => {
          if (result.content) {
            const index = updatedChunks.findIndex(c => c.chunkId === result.chunkId);
            if (index >= 0) {
              updatedChunks[index] = {
                ...updatedChunks[index],
                text: result.content,
                isChunkId: false, // Mark as fetched
              };
            }
          }
        });
        return updatedChunks;
      });

      setFetchingChunks(false);
      console.log(`✅ Finished fetching chunk contents`);
    };

    fetchChunkContents();
  }, [entityId, chunks.length, fetchingChunks]); // Re-run when entity changes or chunks are loaded

  if (!entityId) return null;

  const getNodeLabel = (nodeId: string): string => {
    if (!nodeId || !reconciliationData) return 'Unknown';

    // Try to find by element ID first
    const node = reconciliationData.nodes.find(n => n.id === nodeId);
    if (node) {
      // Prefer name property, then first label, then shortened ID
      return node.properties?.name ||
             node.properties?.id ||
             node.labels?.[0] ||
             nodeId.substring(0, 20) + '...';
    }

    // If not found, it might be truncated or formatted differently
    return nodeId.length > 30 ? nodeId.substring(0, 20) + '...' : nodeId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-borges-secondary border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {entity?.properties?.name || entity?.labels?.[0] || entityName || 'Entity Details'}
              </h2>
              {entity && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-borges-accent text-black rounded font-medium">
                    {entity.properties?.entity_type || entity.labels?.[0] || 'Entity'}
                  </span>
                  {entity.properties?.book_name && (
                    <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded">
                      📖 {entity.properties.book_name}
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-300 rounded">
                    {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded">
                    {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">⏳</div>
                <p className="text-gray-400">Loading entity details...</p>
              </div>
            </div>
          )}

          {!loading && !entity && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-300">
              <p className="font-medium">Entity not found</p>
              <p className="text-sm mt-1">The entity with ID {entityId} was not found in the graph data.</p>
            </div>
          )}

          {entity && !loading && (
            <>
              {/* Entity ID */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Entity ID</h3>
                <code className="text-xs bg-borges-dark p-2 rounded block text-gray-300 font-mono break-all">
                  {entity.id}
                </code>
              </div>

              {/* Entity Properties */}
              {entity.properties && Object.keys(entity.properties).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                    Properties
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(entity.properties).map(([key, value]) => (
                      <div key={key} className="p-3 bg-borges-dark rounded border border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">{key}</div>
                        <div className="text-sm text-white break-words">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {relationships.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                    🔗 Relationships ({relationships.length})
                  </h3>
                  <div className="space-y-2">
                    {relationships.map((rel, index) => {
                      const isSource = rel.source === entityId;
                      const otherNodeId = isSource ? rel.target : rel.source;
                      const otherLabel = getNodeLabel(otherNodeId);

                      return (
                        <div key={index} className="p-3 bg-borges-dark rounded border border-gray-700">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            {isSource ? (
                              <>
                                <span className="text-white font-medium">{entity.properties?.name || entity.labels?.[0]}</span>
                                <span className="text-borges-accent">--[{rel.type}]→</span>
                                <span className="text-gray-300">{otherLabel}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-300">{otherLabel}</span>
                                <span className="text-borges-accent">--[{rel.type}]→</span>
                                <span className="text-white font-medium">{entity.properties?.name || entity.labels?.[0]}</span>
                              </>
                            )}
                          </div>
                          {rel.properties && Object.keys(rel.properties).length > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                              <details className="cursor-pointer">
                                <summary className="hover:text-gray-300">Relationship properties...</summary>
                                <div className="mt-2 pl-4 space-y-1">
                                  {Object.entries(rel.properties).filter(([key]) =>
                                    !key.includes('chunk') && !key.includes('source')
                                  ).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="text-gray-500">{key}:</span>{' '}
                                      <span className="text-gray-300">{String(value).substring(0, 100)}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source Text Chunks */}
              {chunks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                    📄 Source Text Chunks ({chunks.length})
                    {fetchingChunks && (
                      <span className="ml-2 text-xs text-yellow-400 animate-pulse">
                        Loading full text...
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-gray-400 mb-3">
                    Original text from the books where this entity appears
                  </div>
                  <div className="space-y-3">
                    {chunks.map((chunk, index) => (
                      <div key={index} className="p-4 bg-borges-dark rounded border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                            Chunk {index + 1}
                          </span>
                          <span className="text-xs text-gray-400">
                            via {chunk.relationshipType}
                          </span>
                          {chunk.isChunkId && (
                            <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded animate-pulse">
                              Fetching...
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {chunk.isChunkId ? (
                            <div className="italic text-gray-500">
                              Loading chunk content from: {chunk.chunkId}
                            </div>
                          ) : (
                            <HighlightedText
                              text={chunk.text}
                              entities={entity ? [{
                                id: entity.id,
                                type: entity.properties?.entity_type || entity.labels?.[0] || 'Entity',
                                color: '#fbbf24',
                                score: 1.0
                              }] : []}
                            />
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {getNodeLabel(chunk.source)} → {getNodeLabel(chunk.target)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chunks.length === 0 && (
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded text-gray-400 text-sm">
                  <p className="font-medium">No source chunks found</p>
                  <p className="text-xs mt-1">
                    This entity has {relationships.length} relationship{relationships.length !== 1 ? 's' : ''},
                    but no source text chunks are attached to them.
                  </p>
                </div>
              )}

              {/* Constitutional Principle Footer */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 italic">
                  🏛️ Principe de conception #5 : Interprétabilité de bout-en-bout -
                  Navigation du chunk de texte jusqu&apos;à la réponse RAG
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-borges-secondary flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
