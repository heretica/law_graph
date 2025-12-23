/**
 * TypeScript types for provenance tracking
 * Feature: 001-interactive-graphrag-refinement
 * Updated: 004-ui-consistency - Commune provenance (Constitution Principle VII)
 */

export interface UsedEntity {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  description?: string;
  rank: number;
  relevance_score: number;
  contribution?: 'direct_match' | 'context' | 'community_member';
  // Civic provenance (Grand Débat National)
  commune?: string;
  // Legacy book provenance
  book_id?: string;
  book_title?: string;
  book_author?: string;
}

export interface TraversedRelationship {
  source_id: string;
  source_name: string;
  target_id: string;
  target_name: string;
  relationship_type: string;
  description?: string;
  order: number;
  weight: number;
  hop_distance: number;
}

export interface SourceChunk {
  chunk_id: string;
  content: string;
  // Civic provenance (Grand Débat National)
  commune?: string;
  // Legacy book provenance
  book_id: string;
  book_title: string;
  book_author?: string;
  page?: string;
  section?: string;
  entity_highlights?: string[]; // Entity IDs to highlight in chunk
}

export interface CitedCommunity {
  community_id: string;
  title: string;
  summary: string;
  relevance_score: number;
  members?: string[]; // Entity IDs in community
}

export interface QueryVersion {
  query_id: string;
  version: number;
  question: string;
  answer_text: string;
  timestamp: string; // ISO datetime string
  parent_query_id?: string;
  mode: 'local' | 'global';
  status: 'active' | 'superseded' | 'archived';
  user_id: string;
}

export interface QueryResult {
  result_id: string;
  query_id: string;
  timestamp: string;
  execution_time_ms: number;
  entity_count: number;
  relationship_count: number;
  community_count: number;
}

export interface ProvenanceChain {
  query: QueryVersion;
  result: QueryResult;
  entities: UsedEntity[];
  relationships: TraversedRelationship[];
  chunks?: SourceChunk[];
  communities?: CitedCommunity[];
  books: {
    book_id: string;
    title: string;
    author?: string;
  }[];
}

/**
 * Constitutional Principle #5: End-to-end interpretability
 * ProvenanceChain enables navigation from answer → entities → chunks → books
 */
