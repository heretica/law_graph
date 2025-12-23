/**
 * EntityDetailModal Component
 * Displays detailed information about a graph entity with source chunks
 * Feature: 001-interactive-graphrag-refinement - User Story 1 (AC2)
 * Updated: 004-ui-consistency (T039-T041) - Commune provenance
 *
 * Constitution Principle VII: Civic Provenance Chain
 * Shows:
 * - Entity properties from reconciliation data
 * - Connected relationships with source chunks
 * - Source commune information (Grand Débat) or book information (legacy)
 * - Complete provenance trail from entity to source text
 */

'use client';

import { useState, useEffect } from 'react';
import HighlightedText from './HighlightedText';
import { getCommuneDisplayName } from '@/lib/utils/commune-mapping';

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

  // Map of book directory names / IDs to proper display titles
  // Include all known variations and partial matches
  const bookTitleMapping: Record<string, string> = {
    // Directory names
    'peau_bison_frison': 'Peau de Bison',
    'vallee_sans_hommes_frison': 'La Vallée Sans Hommes',
    'racines_ciel_gary': 'Les Racines du Ciel',
    'chien_blanc_gary': 'Chien Blanc',
    'a_rebours_huysmans': 'À Rebours',
    'la_maison_vide_laurent_mauvignier': 'La Maison Vide',
    'policeman_decoin': 'Policeman',
    'tilleul_soir_anglade': 'Le Tilleul du Soir',
    'villa_triste_modiano': 'Villa Triste',
    // Human-readable names (various forms)
    'peau de bison': 'Peau de Bison',
    'la vallée sans hommes': 'La Vallée Sans Hommes',
    'vallée sans hommes': 'La Vallée Sans Hommes',
    'vallee sans hommes': 'La Vallée Sans Hommes',
    'les racines du ciel': 'Les Racines du Ciel',
    'racines du ciel': 'Les Racines du Ciel',
    'la promesse de l\'aube': 'La Promesse de l\'Aube',
    'promesse de l\'aube': 'La Promesse de l\'Aube',
    'chien blanc': 'Chien Blanc',
    'a rebours': 'À Rebours',
    'à rebours': 'À Rebours',
    'la maison vide': 'La Maison Vide',
    'maison vide': 'La Maison Vide',
    'policeman': 'Policeman',
    'le tilleul du soir': 'Le Tilleul du Soir',
    'tilleul du soir': 'Le Tilleul du Soir',
    'villa triste': 'Villa Triste',
  };

  // Clean up the input - remove LIVRE_ prefix (case-insensitive), quotes, and trim
  const cleanName = nodeName
    .replace(/^LIVRE_/i, '')
    .replace(/"/g, '')
    .trim()
    .toLowerCase();

  // Try exact match from mapping
  if (bookTitleMapping[cleanName]) {
    return bookTitleMapping[cleanName];
  }

  // Try partial match - check if cleanName contains any key or key contains cleanName
  for (const [key, title] of Object.entries(bookTitleMapping)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return title;
    }
  }

  // Final fallback: capitalize the cleaned name nicely
  const fallbackName = nodeName
    .replace(/^LIVRE_/i, '')
    .replace(/"/g, '')
    .trim();

  // If it still looks like a technical ID (contains : or long hex), return Unknown
  if (fallbackName.includes(':') || /[0-9a-f]{8,}/.test(fallbackName)) {
    return 'Unknown Book';
  }

  return fallbackName || 'Unknown Book';
}

// Helper to get provenance display name - supports both communes and books (T041)
// Constitution Principle VII: Civic Provenance Chain
function getProvenanceDisplayName(source: string | undefined): { name: string; type: 'commune' | 'book' | 'unknown' } {
  if (!source) return { name: 'Source inconnue', type: 'unknown' };

  // Check if it's a commune (COMMUNE_ prefix or commune property)
  if (source.startsWith('COMMUNE_') || source.toLowerCase().includes('commune')) {
    const communeName = getCommuneDisplayName(source.replace(/^COMMUNE_/i, ''));
    return { name: communeName, type: 'commune' };
  }

  // Check if it's a book (LIVRE_ prefix)
  if (source.startsWith('LIVRE_') || source.toLowerCase().includes('livre')) {
    return { name: extractBookDisplayName(source), type: 'book' };
  }

  // Try commune mapping first (Grand Débat context)
  const communeName = getCommuneDisplayName(source);
  if (communeName !== source && !communeName.includes('non disponible')) {
    return { name: communeName, type: 'commune' };
  }

  // Fall back to book mapping
  const bookName = extractBookDisplayName(source);
  if (bookName !== 'Unknown Book') {
    return { name: bookName, type: 'book' };
  }

  return { name: source, type: 'unknown' };
}

// Helper to format description - escape <SEP> characters for readability
function formatDescription(text: string): string {
  if (!text) return '';
  // Replace <SEP> with readable separator (semicolon + space or newline)
  return text.replace(/<SEP>/g, '; ').trim();
}

// Helper to create unique relationship key for deduplication
function getRelationshipKey(rel: ReconciliationRelationship): string {
  return `${rel.source}:${rel.target}:${rel.type}`;
}

// Helper to deduplicate relationships
function deduplicateRelationships(relationships: ReconciliationRelationship[]): ReconciliationRelationship[] {
  const seen = new Map<string, ReconciliationRelationship>();

  for (const rel of relationships) {
    const key = getRelationshipKey(rel);
    const existing = seen.get(key);

    // Keep the relationship with more properties, or first occurrence
    if (!existing) {
      seen.set(key, rel);
    } else {
      const existingPropCount = Object.keys(existing.properties || {}).length;
      const newPropCount = Object.keys(rel.properties || {}).length;
      if (newPropCount > existingPropCount) {
        seen.set(key, rel);
      }
    }
  }

  return Array.from(seen.values());
}

// Properties to display in priority order
const PRIORITY_PROPERTIES = ['name', 'entity_type', 'description'];

// Internal properties to hide from display:
// - book_dir: replaced by "Appears in X Books" section
// - entity_type: shown in header badge
// - name, id: shown in modal title, redundant in properties list
// - source_chunks: internal data, not user-facing
const HIDDEN_PROPERTIES = ['clusters', 'observations', 'source_id', 'book_dir', 'entity_type', 'name', 'id', 'source_chunks'];

// Internal relationship properties to hide
const HIDDEN_REL_PROPERTIES = ['order', 'has_graphml_metadata', 'graphml_source_chunks', 'source_chunk', 'chunks', 'source_id'];

// Helper to sort properties with priority first, then alphabetically
function sortProperties(properties: Record<string, any>): [string, any][] {
  const entries = Object.entries(properties);

  return entries.sort(([keyA], [keyB]) => {
    const priorityA = PRIORITY_PROPERTIES.indexOf(keyA);
    const priorityB = PRIORITY_PROPERTIES.indexOf(keyB);

    // Both have priority - sort by priority order
    if (priorityA >= 0 && priorityB >= 0) {
      return priorityA - priorityB;
    }
    // Only A has priority
    if (priorityA >= 0) return -1;
    // Only B has priority
    if (priorityB >= 0) return 1;
    // Neither has priority - sort alphabetically
    return keyA.localeCompare(keyB);
  });
}

// Filter properties for display
function filterPropertiesForDisplay(properties: Record<string, any>): [string, any][] {
  const filtered = Object.entries(properties)
    .filter(([key]) => !HIDDEN_PROPERTIES.includes(key));

  return sortProperties(Object.fromEntries(filtered));
}

// Filter relationship properties for display
function filterRelPropertiesForDisplay(properties: Record<string, any>): [string, any][] {
  return Object.entries(properties)
    .filter(([key]) => !HIDDEN_REL_PROPERTIES.includes(key));
}

export default function EntityDetailModal({
  entityId,
  entityName,
  reconciliationData,
  onClose,
}: EntityDetailModalProps) {
  const [entity, setEntity] = useState<ReconciliationNode | null>(null);
  const [relationships, setRelationships] = useState<ReconciliationRelationship[]>([]);
  const [bookRelationships, setBookRelationships] = useState<{bookId: string; bookTitle: string}[]>([]);
  const [chunks, setChunks] = useState<ExtractedChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingChunks, setFetchingChunks] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  // Toggle chunk expansion
  const toggleChunkExpanded = (chunkKey: string) => {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      if (next.has(chunkKey)) {
        next.delete(chunkKey);
      } else {
        next.add(chunkKey);
      }
      return next;
    });
  };

  // Preview length for collapsed chunks
  const CHUNK_PREVIEW_LENGTH = 200;

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

    // Extract book relationships (CONTAINS_ENTITY) separately
    const books: {bookId: string; bookTitle: string}[] = [];
    const nonBookRelationships: ReconciliationRelationship[] = [];

    relatedRelationships.forEach(rel => {
      // Check if this is a book relationship (CONTAINS_ENTITY from a BOOK node)
      const otherNodeId = rel.source === entityId ? rel.target : rel.source;
      const otherNode = reconciliationData.nodes.find(n => n.id === otherNodeId);

      // Check if this is a BOOK node - check labels array or id prefix
      const isBookNode = otherNode?.labels?.includes('BOOK') ||
                        otherNode?.properties?.entity_type === 'BOOK' ||
                        otherNodeId.startsWith('LIVRE_') ||
                        (typeof otherNode?.id === 'string' && otherNode.id.startsWith('LIVRE_'));

      if (isBookNode) {
        // This is a book relationship - get the best available name
        // Priority: title property > name property > id with LIVRE_ prefix
        let rawBookTitle = otherNode?.properties?.title ||
                          otherNode?.properties?.name;

        // If no title/name, try to extract from the node ID if it starts with LIVRE_
        if (!rawBookTitle) {
          const nodeIdStr = otherNode?.id || otherNodeId;
          if (typeof nodeIdStr === 'string' && nodeIdStr.startsWith('LIVRE_')) {
            rawBookTitle = nodeIdStr;
          } else {
            // Skip this - it's likely a Neo4j element ID, not a real book
            // This prevents showing raw IDs like "4:d3905797-be64..."
            nonBookRelationships.push(rel);
            return;
          }
        }

        // ALWAYS normalize through extractBookDisplayName for consistent formatting
        const bookTitle = extractBookDisplayName(rawBookTitle);

        books.push({
          bookId: otherNodeId,
          bookTitle: bookTitle
        });
      } else {
        nonBookRelationships.push(rel);
      }
    });

    // Deduplicate books by title (not bookId, as same book may have different element IDs in multi-book mode)
    const uniqueBooks = books.filter((book, index, self) =>
      index === self.findIndex(b => b.bookTitle === book.bookTitle)
    );
    setBookRelationships(uniqueBooks);

    // Deduplicate non-book relationships to avoid showing the same connection multiple times
    const uniqueRelationships = deduplicateRelationships(nonBookRelationships);
    setRelationships(uniqueRelationships);

    // Extract chunks from relationships and entity properties
    const extractedChunks: ExtractedChunk[] = [];

    // First, check if entity has description (actual text from source chunks)
    const entityDescription = foundEntity?.properties?.description;
    if (entityDescription && typeof entityDescription === 'string' && entityDescription.length > 0) {
      // Use the description directly - it already contains the source text
      // For inter-book entities (appearing in multiple books), the description is a summary
      // that may combine info from all books - don't attribute to a single book incorrectly
      let descriptionBookId: string | undefined;
      let descriptionBookName: string | undefined;

      if (uniqueBooks.length === 1) {
        // Entity appears in exactly one book - use that book
        descriptionBookId = uniqueBooks[0].bookId;
        descriptionBookName = uniqueBooks[0].bookTitle;
      } else if (uniqueBooks.length > 1) {
        // Entity appears in multiple books - don't attribute to wrong single book
        descriptionBookId = undefined;
        descriptionBookName = `Multiple Books (${uniqueBooks.length})`;
      } else {
        // No book relationships found, fallback to entity's book_dir
        const bookDir = foundEntity?.properties?.book_dir;
        descriptionBookId = bookDir || undefined;
        descriptionBookName = bookDir ? extractBookDisplayName(bookDir) : undefined;
      }

      extractedChunks.push({
        text: entityDescription,
        relationshipType: 'ENTITY_DESCRIPTION',
        source: entityId,
        target: entityId,
        bookId: descriptionBookId,
        bookName: descriptionBookName,
        isChunkId: false, // This is already the text content, not an ID to fetch
      });
    }

    // Also extract chunk IDs from entity's source_id property (contains chunk IDs separated by <SEP>)
    const entitySourceId = foundEntity?.properties?.source_id;
    // Per data-model.md: use book_dir (short directory name), book_id was removed from Entity nodes
    const entityBookDir = foundEntity?.properties?.book_dir;
    if (entitySourceId && typeof entitySourceId === 'string' && entitySourceId.includes('chunk-')) {
      // source_id now contains chunk IDs, not book ID
      const chunkIds = entitySourceId.split('<SEP>').filter(id => id.trim() && id.includes('chunk-'));
      chunkIds.forEach(chunkId => {
        const trimmedChunkId = chunkId.trim();
        if (trimmedChunkId && entityBookDir) {
          extractedChunks.push({
            text: trimmedChunkId,
            relationshipType: 'EXTRACTED_FROM',
            source: entityId,
            target: trimmedChunkId,
            chunkId: trimmedChunkId,
            bookId: entityBookDir,
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
        // Per data-model.md: Entity book association is via CONTAINS_ENTITY relationship
        // and book_dir property (short directory name). Entity.book_id was removed.
        // We check multiple sources: book nodes in relationship, relationship properties, entity's book_dir

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

        // Fallback to entity's own book_dir (book_id was removed per data-model.md)
        if (foundEntity?.properties?.book_dir) {
          return {
            bookId: foundEntity.properties.book_dir,
            bookName: foundEntity.properties.book_name || extractBookDisplayName(foundEntity.properties.book_dir)
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
            return { chunkId: chunk.chunkId, content: null, foundIn: null };
          }

          const data = await response.json();
          // Use found_in field to get the actual book source (for inter-book entities)
          const actualBookId = data.found_in || data.book_id || chunk.bookId;
          console.log(`✅ Fetched chunk ${chunk.chunkId}, content length: ${data.content?.length || 0}, found in: ${actualBookId}`);

          return {
            chunkId: chunk.chunkId,
            content: data.content || null,
            foundIn: actualBookId,  // The actual book where chunk was found
          };
        } catch (error) {
          console.error(`❌ Error fetching chunk ${chunk.chunkId}:`, error);
          return { chunkId: chunk.chunkId, content: null, foundIn: null };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Update chunks with fetched content and correct book attribution
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
                // Update book attribution with actual source (fixes inter-book entity issue)
                bookId: result.foundIn || updatedChunks[index].bookId,
                bookName: result.foundIn ? extractBookDisplayName(result.foundIn) : updatedChunks[index].bookName,
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
    <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-40 w-full md:max-w-md bg-borges-secondary md:border-l border-borges-border shadow-borges-lg overflow-hidden flex flex-col safe-area-top safe-area-bottom">
      {/* Mobile drag handle */}
      <div className="md:hidden flex justify-center py-2 bg-borges-secondary">
        <div className="w-12 h-1 bg-borges-border rounded-full"></div>
      </div>

      {/* Header - Responsive Side Panel style */}
      <div className="p-3 md:p-4 border-b border-borges-border">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-h2-mobile md:text-h2 text-borges-light mb-2 truncate">
              {entity?.properties?.name || entity?.labels?.[0] || entityName || 'Entity Details'}
            </h2>
            {entity && (
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-borges-light text-borges-dark rounded-borges-sm font-medium">
                  {entity.properties?.entity_type || entity.labels?.[0] || 'Entity'}
                </span>
                {entity.properties?.book_name && (
                  <span className="text-xs px-2 py-1 bg-borges-dark border border-borges-border text-borges-light rounded-borges-sm hidden sm:inline-block">
                    {entity.properties.book_name}
                  </span>
                )}
                <span className="text-xs px-2 py-1 bg-borges-dark border border-borges-border text-borges-light-muted rounded-borges-sm">
                  {relationships.length} rel
                </span>
                <span className="text-xs px-2 py-1 bg-borges-dark border border-borges-border text-borges-light-muted rounded-borges-sm">
                  {chunks.length} chunks
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="borges-btn-ghost ml-2 p-2 touch-target flex items-center justify-center"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - Side Panel for graph exploration */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-2xl mb-2 animate-pulse text-borges-light">...</div>
              <p className="text-borges-muted text-sm">Loading entity details...</p>
            </div>
          </div>
        )}

        {!loading && !entity && (
          <div className="p-3 bg-borges-dark border border-borges-border rounded-borges-sm text-borges-light-muted">
            <p className="font-medium">Entity not found</p>
            <p className="text-xs mt-1">The entity with ID {entityId} was not found in the graph data.</p>
          </div>
        )}

        {entity && !loading && (
          <>
            {/* Appears in Books - Basile Minimalism */}
            {bookRelationships.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-borges-muted uppercase mb-2">
                  Appears in {bookRelationships.length} {bookRelationships.length === 1 ? 'Book' : 'Books'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bookRelationships.map((book) => (
                    <span
                      key={book.bookId}
                      className="px-2 py-1 bg-borges-dark border border-borges-border rounded-borges-sm text-xs text-borges-light"
                    >
                      {book.bookTitle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Entity Properties - Basile Minimalism */}
            {entity.properties && Object.keys(entity.properties).length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-borges-muted uppercase mb-2">
                  Properties
                </h3>
                <div className="space-y-2">
                  {filterPropertiesForDisplay(entity.properties).map(([key, value]) => (
                    <div key={key} className="p-3 bg-borges-dark rounded-borges-sm border border-borges-border">
                      <div className="text-xs text-borges-muted mb-1">{key}</div>
                      <div className="text-sm text-borges-light break-words whitespace-pre-wrap">
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : key === 'description'
                            ? formatDescription(String(value))
                            : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships - Basile Minimalism */}
            {relationships.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-borges-muted uppercase mb-2">
                  Relationships ({relationships.length})
                </h3>
                <div className="space-y-2">
                  {relationships.map((rel, index) => {
                    const isSource = rel.source === entityId;
                    const otherNodeId = isSource ? rel.target : rel.source;
                    const otherLabel = getNodeLabel(otherNodeId);

                    return (
                      <div key={index} className="p-2 bg-borges-dark rounded-borges-sm border border-borges-border">
                        <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
                          {isSource ? (
                            <>
                              <span className="text-borges-light font-medium">{entity.properties?.name || entity.labels?.[0]}</span>
                              <span className="text-borges-light-muted">→ [{rel.type}] →</span>
                              <span className="text-borges-light-muted">{otherLabel}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-borges-light-muted">{otherLabel}</span>
                              <span className="text-borges-light-muted">→ [{rel.type}] →</span>
                              <span className="text-borges-light font-medium">{entity.properties?.name || entity.labels?.[0]}</span>
                            </>
                          )}
                        </div>
                        {rel.properties && Object.keys(rel.properties).length > 0 && (() => {
                          const filteredProps = filterRelPropertiesForDisplay(rel.properties);
                          return filteredProps.length > 0 && (
                            <div className="mt-1 text-xs text-borges-muted">
                              <details className="cursor-pointer">
                                <summary className="hover:text-borges-light-muted">Properties...</summary>
                                <div className="mt-1 pl-2 space-y-1">
                                  {filteredProps.map(([key, value]) => (
                                    <div key={key}>
                                      <span className="text-borges-muted">{key}:</span>{' '}
                                      <span className="text-borges-light-muted">
                                        {key === 'description'
                                          ? formatDescription(String(value)).substring(0, 150)
                                          : String(value).substring(0, 80)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          );
                        })()}
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
                    <h3 className="text-sm font-semibold text-borges-muted uppercase mb-2">
                      Source Text Chunks ({chunks.length})
                      {isMultiBook && (
                        <span className="ml-2 text-xs text-borges-light-muted">
                          from {bookKeys.length} books
                        </span>
                      )}
                      {fetchingChunks && (
                        <span className="ml-2 text-xs text-borges-light-muted animate-pulse">
                          Loading full text...
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-borges-muted mb-3">
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
                            <div key={bookKey} className="border border-borges-border rounded-lg overflow-hidden">
                              {/* Book Header */}
                              <div className="bg-borges-secondary px-4 py-2 border-b border-borges-border">
                                <span className="text-sm font-medium text-borges-light">
                                  {bookKey}
                                </span>
                                <span className="ml-2 text-xs text-borges-muted">
                                  ({loadedChunks.length} loaded, {pendingChunks.length} pending)
                                </span>
                              </div>

                              {/* Chunks for this book */}
                              <div className="p-3 space-y-2">
                                {bookChunks.slice(0, 5).map((chunk, index) => {
                                  const chunkKey = `${bookKey}-${index}`;
                                  const isExpanded = expandedChunks.has(chunkKey);
                                  const hasLongText = !chunk.isChunkId && chunk.text && chunk.text.length > CHUNK_PREVIEW_LENGTH;

                                  return (
                                    <div key={index} className="bg-borges-dark rounded border border-borges-border overflow-hidden">
                                      {/* Chunk header - clickable to expand */}
                                      <button
                                        onClick={() => hasLongText && toggleChunkExpanded(chunkKey)}
                                        className={`w-full flex items-center justify-between p-2 text-left ${hasLongText ? 'hover:bg-borges-secondary cursor-pointer' : ''}`}
                                      >
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs px-2 py-0.5 bg-borges-accent/20 text-borges-accent rounded">
                                            {index + 1}
                                          </span>
                                          <span className="text-xs text-borges-muted">
                                            {chunk.relationshipType}
                                          </span>
                                          {chunk.isChunkId && chunk.bookId && (
                                            <span className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded animate-pulse">
                                              Loading...
                                            </span>
                                          )}
                                          {chunk.isChunkId && !chunk.bookId && (
                                            <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded">
                                              Unavailable
                                            </span>
                                          )}
                                        </div>
                                        {hasLongText && (
                                          <span className="text-xs text-borges-muted">
                                            {isExpanded ? '▼' : '▶'}
                                          </span>
                                        )}
                                      </button>

                                      {/* Chunk content */}
                                      <div className={`px-3 pb-3 text-sm text-borges-light leading-relaxed ${!isExpanded && hasLongText ? 'max-h-20 overflow-hidden relative' : ''}`}>
                                        {chunk.isChunkId && !chunk.bookId ? (
                                          <div className="italic text-borges-muted text-xs">
                                            Book not available locally
                                          </div>
                                        ) : chunk.isChunkId ? (
                                          <div className="italic text-borges-muted text-xs">
                                            Loading...
                                          </div>
                                        ) : (
                                          <HighlightedText
                                            text={isExpanded || !hasLongText ? chunk.text : chunk.text.substring(0, CHUNK_PREVIEW_LENGTH) + '...'}
                                            entities={entity ? [{
                                              id: entity.id,
                                              type: entity.properties?.entity_type || entity.labels?.[0] || 'Entity',
                                              color: '#fbbf24',
                                              score: 1.0
                                            }] : []}
                                          />
                                        )}
                                        {!isExpanded && hasLongText && (
                                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-borges-dark to-transparent" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
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
                      <div className="space-y-2">
                        {chunks.map((chunk, index) => {
                          const chunkKey = `single-${index}`;
                          const isExpanded = expandedChunks.has(chunkKey);
                          const hasLongText = !chunk.isChunkId && chunk.text && chunk.text.length > CHUNK_PREVIEW_LENGTH;

                          return (
                            <div key={index} className="bg-borges-dark rounded border border-borges-border overflow-hidden">
                              {/* Chunk header - clickable to expand */}
                              <button
                                onClick={() => hasLongText && toggleChunkExpanded(chunkKey)}
                                className={`w-full flex items-center justify-between p-2 text-left ${hasLongText ? 'hover:bg-borges-secondary cursor-pointer' : ''}`}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs px-2 py-0.5 bg-borges-accent/20 text-borges-accent rounded">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs text-borges-muted">
                                    {chunk.relationshipType}
                                  </span>
                                  {chunk.bookName && (
                                    <span className="text-xs text-borges-muted">
                                      {chunk.bookName}
                                    </span>
                                  )}
                                  {chunk.isChunkId && chunk.bookId && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded animate-pulse">
                                      Loading...
                                    </span>
                                  )}
                                  {chunk.isChunkId && !chunk.bookId && (
                                    <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded">
                                      Unavailable
                                    </span>
                                  )}
                                </div>
                                {hasLongText && (
                                  <span className="text-xs text-borges-muted">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                )}
                              </button>

                              {/* Chunk content */}
                              <div className={`px-3 pb-3 text-sm text-borges-light leading-relaxed ${!isExpanded && hasLongText ? 'max-h-20 overflow-hidden relative' : ''}`}>
                                {chunk.isChunkId && !chunk.bookId ? (
                                  <div className="italic text-borges-muted text-xs">
                                    Book not available locally
                                  </div>
                                ) : chunk.isChunkId ? (
                                  <div className="italic text-borges-muted text-xs">
                                    Loading...
                                  </div>
                                ) : (
                                  <HighlightedText
                                    text={isExpanded || !hasLongText ? chunk.text : chunk.text.substring(0, CHUNK_PREVIEW_LENGTH) + '...'}
                                    entities={entity ? [{
                                      id: entity.id,
                                      type: entity.properties?.entity_type || entity.labels?.[0] || 'Entity',
                                      color: '#fbbf24',
                                      score: 1.0
                                    }] : []}
                                  />
                                )}
                                {!isExpanded && hasLongText && (
                                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-borges-dark to-transparent" />
                                )}
                              </div>
                            </div>
                          );
                        })}
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

            {/* Constitutional Principle Footer - Basile Minimalism */}
            <div className="pt-3 border-t border-borges-border">
              <p className="text-xs text-borges-muted">
                Principle #5: End-to-end interpretability
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer - Responsive Side Panel style */}
      <div className="p-3 md:p-4 border-t border-borges-border bg-borges-secondary flex justify-end safe-area-bottom">
        <button
          onClick={onClose}
          className="borges-btn-secondary text-sm min-h-touch px-4"
        >
          Close
        </button>
      </div>
    </div>
  );
}
