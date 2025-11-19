/**
 * Provenance Service
 * Fetches and manages provenance chains for GraphRAG queries
 * Feature: 001-interactive-graphrag-refinement - User Story 1
 */

import type {
  ProvenanceChain,
  UsedEntity,
  TraversedRelationship,
  SourceChunk
} from '@/types/provenance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

/**
 * Get complete provenance chain for a query
 *
 * Constitutional Principle #5: End-to-end interpretability
 * Enables navigation from answer → entities → relationships → chunks → books
 *
 * @param queryId - Query node ID
 * @returns Complete provenance chain or null if not found
 */
export async function getProvenanceChain(
  queryId: string
): Promise<ProvenanceChain | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/provenance/${queryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Provenance chain not found for query: ${queryId}`);
        return null;
      }
      throw new Error(`Failed to fetch provenance chain: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.provenance_chain) {
      console.error('Invalid provenance chain response:', data);
      return null;
    }

    return data.provenance_chain;
  } catch (error) {
    console.error('Error fetching provenance chain:', error);
    return null;
  }
}

/**
 * Get list of entities used in a query with rank and relevance scores
 *
 * @param queryId - Query node ID
 * @param limit - Maximum number of entities to return
 * @returns List of entities with metadata
 */
export async function getQueryEntities(
  queryId: string,
  limit?: number
): Promise<UsedEntity[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/provenance/${queryId}/entities`);
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch entities: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.entities) {
      console.error('Invalid entities response:', data);
      return [];
    }

    return data.entities;
  } catch (error) {
    console.error('Error fetching query entities:', error);
    return [];
  }
}

/**
 * Get list of relationships traversed during query execution
 *
 * @param queryId - Query node ID
 * @returns List of traversed relationships with order and weights
 */
export async function getQueryRelationships(
  queryId: string
): Promise<TraversedRelationship[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/provenance/${queryId}/relationships`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch relationships: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.relationships) {
      console.error('Invalid relationships response:', data);
      return [];
    }

    return data.relationships;
  } catch (error) {
    console.error('Error fetching query relationships:', error);
    return [];
  }
}

/**
 * Get list of source text chunks used in query
 *
 * Note: Currently chunks are not stored separately in Neo4j.
 * This is a placeholder for future implementation.
 *
 * @param queryId - Query node ID
 * @returns List of source chunks (currently empty)
 */
export async function getQueryChunks(
  queryId: string
): Promise<SourceChunk[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/provenance/${queryId}/chunks`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chunks: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.chunks) {
      console.error('Invalid chunks response:', data);
      return [];
    }

    return data.chunks;
  } catch (error) {
    console.error('Error fetching query chunks:', error);
    return [];
  }
}

/**
 * Format entity for display in provenance UI
 *
 * @param entity - Used entity from provenance chain
 * @returns Formatted entity display text
 */
export function formatEntityDisplay(entity: UsedEntity): string {
  const { entity_name, entity_type, rank, relevance_score } = entity;
  const score = (relevance_score * 100).toFixed(0);
  return `#${rank} ${entity_name} (${entity_type}) - ${score}% relevant`;
}

/**
 * Format relationship for display in provenance UI
 *
 * @param relationship - Traversed relationship from provenance chain
 * @returns Formatted relationship display text
 */
export function formatRelationshipDisplay(
  relationship: TraversedRelationship
): string {
  const { source_name, target_name, relationship_type, hop_distance } = relationship;
  return `${source_name} --[${relationship_type}]--> ${target_name} (hop ${hop_distance})`;
}

/**
 * Group entities by book for provenance display
 *
 * @param entities - List of entities from provenance chain
 * @returns Map of book_id to entities
 */
export function groupEntitiesByBook(
  entities: UsedEntity[]
): Map<string, UsedEntity[]> {
  const grouped = new Map<string, UsedEntity[]>();

  for (const entity of entities) {
    const bookId = entity.book_id || 'unknown';
    if (!grouped.has(bookId)) {
      grouped.set(bookId, []);
    }
    grouped.get(bookId)!.push(entity);
  }

  return grouped;
}

/**
 * Sort entities by rank (ascending)
 *
 * @param entities - List of entities to sort
 * @returns Sorted entities
 */
export function sortEntitiesByRank(entities: UsedEntity[]): UsedEntity[] {
  return [...entities].sort((a, b) => a.rank - b.rank);
}

/**
 * Sort entities by relevance score (descending)
 *
 * @param entities - List of entities to sort
 * @returns Sorted entities
 */
export function sortEntitiesByRelevance(entities: UsedEntity[]): UsedEntity[] {
  return [...entities].sort((a, b) => b.relevance_score - a.relevance_score);
}
