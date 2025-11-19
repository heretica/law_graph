/**
 * TypeScript types for ontological pattern discovery
 * Feature: 001-interactive-graphrag-refinement
 */

export interface OntologicalPattern {
  id: string;
  pattern_name: string;
  motif_structure: string; // e.g., "PERSON-INFLUENCES->CONCEPT-APPEARS_IN->BOOK"
  frequency: number; // Total occurrences
  cross_domain_count: number; // Number of books containing pattern
  significance_score: number; // 0.0 - 1.0
  discovered_at: string; // ISO datetime
  saved_by?: string; // User ID if saved
  description?: string;
}

export interface PatternInstance {
  id: string;
  pattern_id: string;
  book_id: string;
  book_title?: string;
  entity_ids: string[];
  entity_names?: string[];
  subgraph_hash: string;
  context?: string; // Text context around pattern
}

export interface PatternDiscoveryParams {
  min_frequency?: number;
  min_cross_domain?: number;
  max_results?: number;
  entity_types_filter?: string[]; // Filter by entity types
  book_filter?: string[]; // Filter by specific books
}

export interface PatternComparison {
  pattern_a: OntologicalPattern;
  pattern_b: OntologicalPattern;
  similarity_score: number;
  shared_books: string[];
  unique_to_a: string[];
  unique_to_b: string[];
}

export interface PatternSearchResult {
  patterns: OntologicalPattern[];
  total_count: number;
  search_params: PatternDiscoveryParams;
  execution_time_ms: number;
}

export interface PatternVisualization {
  pattern: OntologicalPattern;
  instances: PatternInstance[];
  graph_data: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label: string;
    }>;
  };
}

/**
 * Constitutional Principle #3: Cross-book investigation priority
 * Patterns with high cross_domain_count represent universal ontological structures
 */
