/**
 * TypeScript types for Grand Débat National GraphRAG integration
 * Feature: 003-rag-observability-comparison
 * Constitution: v3.0.0 (Single-purpose civic interface)
 *
 * Connects to MCP server at https://graphragmcp-production.up.railway.app
 * Dataset: Cahiers de Doléances 2019 - 50 communes in Charente-Maritime
 */

/**
 * Query request to the Grand Débat National MCP API
 */
export interface LawGraphRAGQuery {
  query: string;
  mode?: 'local' | 'global';
  /** Optional: Filter by specific commune ID */
  commune_id?: string;
}

/**
 * Civic entity extracted from the knowledge graph
 * Represents themes, actors, proposals, and concepts from citizen contributions
 */
export interface LegalEntity {
  id: string;
  name: string;
  type: 'theme' | 'actor' | 'proposal' | 'concept' | 'entity';
  description?: string;
  source_commune?: string;
}

/**
 * Relationship between civic entities
 */
export interface LegalRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  description?: string;
  weight?: number;
}

/**
 * Source chunk from a citizen contribution
 * Constitution Principle II: Civic Provenance Chain
 */
export interface LegalSourceChunk {
  chunk_id: string;
  content: string;
  /** Commune that contributed this text */
  document_id: string;
  document_title: string;
  /** Commune name for display */
  commune?: string;
}

/**
 * Graph data structure for visualization
 * Matches the format expected by GraphVisualization3DForce
 */
export interface LawGraphRAGGraphData {
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, unknown>;
    degree?: number;
    centrality_score?: number;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    source: string;
    target: string;
    properties: Record<string, unknown>;
  }>;
}

/**
 * Response from the Grand Débat National MCP API
 * Constitution Principle I: End-to-End Interpretability
 */
export interface LawGraphRAGResponse {
  success: boolean;
  query: string;
  answer: string;
  /** Graph data for visualization */
  graphrag_data?: {
    entities: LegalEntity[];
    relationships: LegalRelationship[];
    source_chunks?: LegalSourceChunk[];
  };
  /** Processing metadata */
  context?: {
    mode: 'local' | 'global';
    processing_time_ms?: number;
  };
  /** Processing time in seconds (top-level for convenience) */
  processing_time?: number;
  /** Unique query ID for provenance tracking (Constitution Principle I) */
  query_id?: string;
  timestamp?: string;
  /** Error details if success is false */
  error?: string;
}

/**
 * Error response from the Grand Débat National API
 */
export interface LawGraphRAGError {
  error: string;
  details?: string;
  status?: number;
}

/**
 * Constitutional Principle I: End-to-end interpretability
 * LawGraphRAGResponse enables navigation from answer → entities → chunks → citizen contributions
 *
 * Constitutional Principle II: Civic Provenance Chain
 * Every entity is traceable to its source commune and original citizen text
 */
