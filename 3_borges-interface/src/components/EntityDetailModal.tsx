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
  bookName?: string; // Human-readable book name for display
  chunkId?: string;
  isChunkId?: boolean;
}

// Helper to extract book ID from a node name or ID (e.g., "LIVRE_Peau de bison" -> "peau_bison_frison")
function extractBookDirFromName(nodeName: string): string | null {
  if (!nodeName) return null;

  // Map of known book names to their directory names
  const bookMapping: Record<string, string> = {
    'peau de bison': 'peau_bison_frison',
    'la vallée sans hommes': 'vallee_sans_hommes_frison',
    'vallée sans hommes': 'vallee_sans_hommes_frison',
    'vallee sans hommes': 'vallee_sans_hommes_frison',
    'la promesse de l\'aube': 'racines_ciel_gary', // This book shares content with Les Racines du Ciel (same author)
    'promesse de l\'aube': 'racines_ciel_gary',
    'les racines du ciel': 'racines_ciel_gary',
    'racines du ciel': 'racines_ciel_gary',
    'chien blanc': 'chien_blanc_gary',
    'a rebours': 'a_rebours_huysmans',
    'à rebours': 'a_rebours_huysmans',
    'la maison vide': 'la_maison_vide_laurent_mauvignier',
    'maison vide': 'la_maison_vide_laurent_mauvignier',
    'policeman': 'policeman_decoin',
    'le tilleul du soir': 'tilleul_soir_anglade',
    'tilleul du soir': 'tilleul_soir_anglade',
    'villa triste': 'villa_triste_modiano',
  };

  const cleanName = nodeName.toLowerCase()
    .replace(/^livre_/, '')
    .replace(/"/g, '')
    .trim();

  // Try exact match first
  if (bookMapping[cleanName]) {
    return bookMapping[cleanName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(bookMapping)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value;
    }
  }

  return null;
}

// Helper to extract human-readable book name
function extractBookDisplayName(nodeName: string): string {
  if (!nodeName) return 'Unknown Book';

  // Remove LIVRE_ prefix and clean up
  return nodeName
    .replace(/^LIVRE_/, '')
    .replace(/"/g, '')
    .trim() || 'Unknown Book';
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
      // Only use book_id, don't fallback to source_id (which may be a chunk ID)
      const bookId = foundEntity?.properties?.book_id || foundEntity?.properties?.book_dir;
      // For bookName, try to get a human-readable name
      const bookName = bookId ? extractBookDisplayName(bookId) : undefined;
      extractedChunks.push({
        text: entityDescription,
        relationshipType: 'ENTITY_DESCRIPTION',
        source: entityId,
        target: entityId,
        bookId: bookId || undefined,
        bookName,
        isChunkId: false, // This is already the text content, not an ID to fetch
      });
    }

    // Also extract chunk IDs from entity's source_id property (contains chunk IDs separated by <SEP>)
    const entitySourceId = foundEntity?.properties?.source_id;
    const entityBookId = foundEntity?.properties?.book_id;
    if (entitySourceId && typeof entitySourceId === 'string' && entitySourceId.includes('chunk-')) {
      // source_id now contains chunk IDs, not book ID
      const chunkIds = entitySourceId.split('<SEP>').filter(id => id.trim() && id.includes('chunk-'));
      chunkIds.forEach(chunkId => {
        const trimmedChunkId = chunkId.trim();
        if (trimmedChunkId && entityBookId) {
          extractedChunks.push({
            text: trimmedChunkId,
            relationshipType: 'EXTRACTED_FROM',
            source: entityId,
            target: trimmedChunkId,
            chunkId: trimmedChunkId,
            bookId: entityBookId,
            isChunkId: true,
          });
        }
      });
    }

    // Helper to resolve node name from ID
    const resolveNodeName = (nodeId: string): string | null => {
      if (!nodeId || !reconciliationData) return null;

      // Find the node by element ID
      const node = reconciliationData.nodes.find(n => n.id === nodeId);
      if (node) {
        return node.properties?.name || node.properties?.id || null;
      }

      // If node not found, the nodeId might already be the name (for display purposes)
      // This happens when the relationship was serialized with names instead of IDs
      if (nodeId.includes('LIVRE_') || nodeId.startsWith('La ') || nodeId.startsWith('Les ')) {
        return nodeId;
      }

      return null;
    };

    // Then extract chunks from relationships
    // For inter-book entities, we need to determine which book each chunk belongs to
    // by looking at the related book node in the relationship
    relatedRelationships.forEach(rel => {
      // Helper to find book context from relationship
      const getBookFromRelationship = (): { bookId: string | null; bookName: string | null } => {
        // First try entity's own book_id (but skip for multi-book entities)
        // We only use entity's book_id if this specific relationship doesn't have book context

        // Look for a book node in the relationship (source or target)
        const sourceNode = reconciliationData?.nodes.find(n => n.id === rel.source);
        const targetNode = reconciliationData?.nodes.find(n => n.id === rel.target);

        // Also get names for fallback matching
        const sourceName = sourceNode?.properties?.name || resolveNodeName(rel.source);
        const targetName = targetNode?.properties?.name || resolveNodeName(rel.target);

        // Check if either node is a book by multiple criteria
        const sourceIsBook = sourceNode?.properties?.entity_type === 'BOOK' ||
                            sourceNode?.labels?.includes('Book') ||
                            sourceName?.startsWith('LIVRE_') ||
                            sourceName?.toLowerCase().includes('livre');
        const targetIsBook = targetNode?.properties?.entity_type === 'BOOK' ||
                            targetNode?.labels?.includes('Book') ||
                            targetName?.startsWith('LIVRE_') ||
                            targetName?.toLowerCase().includes('livre');

        if (sourceIsBook && sourceName) {
          const bookDir = extractBookDirFromName(sourceName);
          const displayName = extractBookDisplayName(sourceName);
          console.log(`📖 Found book from source: ${sourceName} -> dir: ${bookDir}`);
          return { bookId: bookDir, bookName: displayName };
        }

        if (targetIsBook && targetName) {
          const bookDir = extractBookDirFromName(targetName);
          const displayName = extractBookDisplayName(targetName);
          console.log(`📖 Found book from target: ${targetName} -> dir: ${bookDir}`);
          return { bookId: bookDir, bookName: displayName };
        }

        // Try relationship properties - check both book_id and book_dir
        if (rel.properties?.book_id || rel.properties?.book_dir) {
          const relBookId = rel.properties.book_id || rel.properties.book_dir;
          const relBookName = rel.properties.book_name || extractBookDisplayName(relBookId);
          console.log(`📖 Found book from relationship properties: ${relBookId}`);
          return { bookId: relBookId, bookName: relBookName };
        }

        // Fallback to entity's own book_id
        if (foundEntity?.properties?.book_id) {
          return {
            bookId: foundEntity.properties.book_id,
            bookName: foundEntity.properties.book_name || foundEntity.properties.book_id
          };
        }

        return { bookId: null, bookName: null };
      };

      const { bookId, bookName } = getBookFromRelationship();

      // Check for graphml_source_chunks property
      const chunkText = rel.properties?.graphml_source_chunks;
      if (chunkText && typeof chunkText === 'string') {
        // Check if this contains <SEP> separated chunk IDs
        if (chunkText.includes('<SEP>')) {
          // Filter: only include valid chunk IDs (starting with 'chunk-'), skip 'book_linkage' metadata
          const chunkIds = chunkText.split('<SEP>').filter(id => {
            const trimmed = id.trim();
            return trimmed && trimmed.startsWith('chunk-') && trimmed !== 'book_linkage';
          });

          chunkIds.forEach(chunkId => {
            const trimmedChunkId = chunkId.trim();
            if (trimmedChunkId) {
              extractedChunks.push({
                text: trimmedChunkId,
                relationshipType: rel.type,
                source: rel.source,
                target: rel.target,
                chunkId: trimmedChunkId,
                bookId: bookId || undefined,
                bookName: bookName || undefined,
                isChunkId: true,
              });
            }
          });
        } else {
          // Single chunk ID or actual text
          // ONLY chunk IDs starting with 'chunk-' are valid - 'book_linkage' is metadata, not a chunk
          const isChunkId = chunkText.startsWith('chunk-');

          // Skip 'book_linkage' metadata - it's not actual content
          if (chunkText === 'book_linkage') {
            return; // Skip this chunk
          }

          extractedChunks.push({
            text: chunkText,
            relationshipType: rel.type,
            source: rel.source,
            target: rel.target,
            chunkId: isChunkId ? chunkText : undefined,
            bookId: isChunkId ? (bookId || undefined) : undefined,
            bookName: isChunkId ? (bookName || undefined) : undefined,
            isChunkId,
          });
        }
      }

      // Also check for source_chunk, chunks, or source_id properties
      const sourceChunk = rel.properties?.source_chunk || rel.properties?.chunks || rel.properties?.source_id;
      if (sourceChunk && typeof sourceChunk === 'string' && sourceChunk !== chunkText) {
        // Check if this contains <SEP> separated chunk IDs
        if (sourceChunk.includes('<SEP>')) {
          // Filter: only include valid chunk IDs (starting with 'chunk-'), skip 'book_linkage' metadata
          const chunkIds = sourceChunk.split('<SEP>').filter(id => {
            const trimmed = id.trim();
            return trimmed && trimmed.startsWith('chunk-') && trimmed !== 'book_linkage';
          });

          chunkIds.forEach(chunkId => {
            const trimmedChunkId = chunkId.trim();
            if (trimmedChunkId) {
              extractedChunks.push({
                text: trimmedChunkId,
                relationshipType: rel.type,
                source: rel.source,
                target: rel.target,
                chunkId: trimmedChunkId,
                bookId: bookId || undefined,
                bookName: bookName || undefined,
                isChunkId: true,
              });
            }
          });
        } else {
          // Single chunk ID or actual text
          // ONLY chunk IDs starting with 'chunk-' are valid - 'book_linkage' is metadata, not a chunk
          const isChunkId = sourceChunk.startsWith('chunk-');

          // Skip 'book_linkage' metadata - it's not actual content
          if (sourceChunk === 'book_linkage') {
            return; // Skip this chunk
          }

          extractedChunks.push({
            text: sourceChunk,
            relationshipType: rel.type,
            source: rel.source,
            target: rel.target,
            chunkId: isChunkId ? sourceChunk : undefined,
            bookId: isChunkId ? (bookId || undefined) : undefined,
            bookName: isChunkId ? (bookName || undefined) : undefined,
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

              {/* Source Text Chunks - Grouped by Book */}
              {chunks.length > 0 && (() => {
                // Group chunks by book
                const chunksByBook = chunks.reduce((acc, chunk) => {
                  const bookKey = chunk.bookName || chunk.bookId || 'Unknown Book';
                  if (!acc[bookKey]) {
                    acc[bookKey] = [];
                  }
                  acc[bookKey].push(chunk);
                  return acc;
                }, {} as Record<string, ExtractedChunk[]>);

                const bookKeys = Object.keys(chunksByBook);
                const isMultiBook = bookKeys.length > 1;

                return (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                      📄 Source Text Chunks ({chunks.length})
                      {isMultiBook && (
                        <span className="ml-2 text-xs text-blue-400">
                          from {bookKeys.length} books
                        </span>
                      )}
                      {fetchingChunks && (
                        <span className="ml-2 text-xs text-yellow-400 animate-pulse">
                          Loading full text...
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-gray-400 mb-3">
                      Original text from the books where this entity appears
                    </div>

                    {/* Group by book for multi-book entities */}
                    {isMultiBook ? (
                      <div className="space-y-4">
                        {bookKeys.map(bookKey => {
                          const bookChunks = chunksByBook[bookKey];
                          const loadedChunks = bookChunks.filter(c => !c.isChunkId);
                          const pendingChunks = bookChunks.filter(c => c.isChunkId);

                          return (
                            <div key={bookKey} className="border border-gray-600 rounded-lg overflow-hidden">
                              {/* Book Header */}
                              <div className="bg-yellow-900/30 px-4 py-2 border-b border-gray-600">
                                <span className="text-sm font-medium text-yellow-300">
                                  📖 {bookKey}
                                </span>
                                <span className="ml-2 text-xs text-gray-400">
                                  ({loadedChunks.length} loaded, {pendingChunks.length} pending)
                                </span>
                              </div>

                              {/* Chunks for this book */}
                              <div className="p-3 space-y-3">
                                {bookChunks.slice(0, 5).map((chunk, index) => (
                                  <div key={index} className="p-3 bg-borges-dark rounded border border-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                                        Chunk {index + 1}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        via {chunk.relationshipType}
                                      </span>
                                      {chunk.isChunkId && chunk.bookId && (
                                        <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded animate-pulse">
                                          Fetching...
                                        </span>
                                      )}
                                      {chunk.isChunkId && !chunk.bookId && (
                                        <span className="text-xs px-2 py-1 bg-red-900/50 text-red-300 rounded">
                                          Book not available
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                      {chunk.isChunkId && !chunk.bookId ? (
                                        <div className="italic text-gray-500">
                                          📚 This chunk is from a book not available locally ({chunk.bookName || 'Unknown'})
                                        </div>
                                      ) : chunk.isChunkId ? (
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
                                  </div>
                                ))}
                                {bookChunks.length > 5 && (
                                  <div className="text-xs text-gray-500 text-center py-2">
                                    ... and {bookChunks.length - 5} more chunks from this book
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Single book - flat list */
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
                              {chunk.bookName && (
                                <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">
                                  📖 {chunk.bookName}
                                </span>
                              )}
                              {chunk.isChunkId && chunk.bookId && (
                                <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded animate-pulse">
                                  Fetching...
                                </span>
                              )}
                              {chunk.isChunkId && !chunk.bookId && (
                                <span className="text-xs px-2 py-1 bg-red-900/50 text-red-300 rounded">
                                  Book not available
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {chunk.isChunkId && !chunk.bookId ? (
                                <div className="italic text-gray-500">
                                  📚 This chunk is from a book not available locally ({chunk.bookName || 'Unknown'})
                                </div>
                              ) : chunk.isChunkId ? (
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
                    )}
                  </div>
                );
              })()}

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
