interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  degree: number;
  centrality_score: number;
}

interface Neo4jRelationship {
  id: string;
  type: string;
  source: string;
  target: string;
  properties: Record<string, any>;
}

interface GraphRAGSearchPath {
  entities: Array<{
    id: string;
    type: string;
    description: string;
    rank: number;
    order: number;
    score: number;
  }>;
  relations: Array<{
    source: string;
    target: string;
    description: string;
    weight: number;
    rank: number;
    traversalOrder: number;
  }>;
  communities: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
}

interface GraphData {
  success: boolean;
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
  count: number;
  limit: number;
}

interface DebugEntity {
  id: string;
  name: string;
  type: string;
  description: string;
  rank: number;
  score: number;
  selected: boolean;
}

interface DebugCommunity {
  id: string;
  title: string;
  content: string;
  relevance: number;
  impact_rating: number;
}

interface DebugRelationship {
  source: string;
  target: string;
  description: string;
  weight: number;
  rank: number;
  traversal_order: number;
}

interface DebugTextSource {
  id: string;
  content: string;
  relevance: number;
}

interface AnimationPhase {
  phase: string;
  duration: number;
  description: string;
}

interface ProcessingPhase {
  entities?: DebugEntity[];
  communities?: DebugCommunity[];
  relationships?: DebugRelationship[];
  sources?: DebugTextSource[];
  duration_ms: number;
  phase: string;
}

interface DebugInfo {
  processing_phases: {
    entity_selection: ProcessingPhase;
    community_analysis: ProcessingPhase;
    relationship_mapping: ProcessingPhase;
    text_synthesis: ProcessingPhase;
  };
  context_stats: {
    total_time_ms: number;
    mode: 'local' | 'global';
    prompt_length: number;
  };
  animation_timeline: AnimationPhase[];
}

interface ReconciledQueryResult {
  success: boolean;
  query: string;
  answer: string;
  context: {
    visible_nodes_count: number;
    node_context: string[];
    mode: 'local' | 'global';
  };
  search_path: GraphRAGSearchPath;
  timestamp: string;
  debug_info?: DebugInfo;
}

interface Book {
  id: string;
  name: string;
  has_data: boolean;
}

interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  connections: {
    neo4j: string;
    graphrag: string;
  };
}

export class ReconciliationService {
  private readonly apiUrl: string;

  constructor() {
    // Use local API routes to avoid CORS issues
    this.apiUrl = '/api/reconciliation';
  }

  /**
   * Check the health status of the Reconciliation API
   */
  async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${this.apiUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get Neo4j nodes with optional filtering
   */
  async getNodes(options: {
    limit?: number;
    centrality_type?: 'degree' | 'betweenness' | 'eigenvector';
  } = {}): Promise<GraphData> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.centrality_type) params.append('centrality_type', options.centrality_type);

    const response = await fetch(`${this.apiUrl}/graph/nodes?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch nodes: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get relationships for specific node IDs
   */
  async getRelationships(nodeIds: string[], limit: number = 10000): Promise<{
    success: boolean;
    relationships: Neo4jRelationship[];
    count: number;
    input_nodes: number;
    limit_applied: number;
    filtered: boolean;
  }> {
    const params = new URLSearchParams();
    params.append('node_ids', nodeIds.join(','));
    params.append('limit', limit.toString());

    console.log(`🔍 Fetching relationships for ${nodeIds.length} nodes with limit ${limit}`);

    const response = await fetch(`${this.apiUrl}/graph/relationships?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch relationships: ${response.status}`);
    }

    const result = await response.json();

    // Log performance metrics
    if (result.success) {
      console.log(`✅ Relationships fetched: ${result.count} out of ${nodeIds.length} nodes`);
      if (result.filtered) {
        console.warn(`⚠️ Relationship limit reached (${limit}). Some relationships may be missing.`);
      }
    }

    return result;
  }

  /**
   * Perform reconciled query combining Neo4j context with GraphRAG
   */
  async reconciledQuery(options: {
    query: string;
    visible_node_ids: string[];
    mode?: 'local' | 'global';
    debug_mode?: boolean;
  }): Promise<ReconciledQueryResult> {
    const response = await fetch(`${this.apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: options.query,
        visible_node_ids: options.visible_node_ids,
        mode: options.mode || 'local',
        debug_mode: options.debug_mode || false
      }),
    });

    if (!response.ok) {
      throw new Error(`Reconciled query failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Search for specific nodes in Neo4j
   */
  async searchNodes(options: {
    q: string;
    type?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    nodes: Neo4jNode[];
    count: number;
    query: string;
  }> {
    const params = new URLSearchParams();
    params.append('q', options.q);
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${this.apiUrl}/graph/search?${params}`);
    if (!response.ok) {
      throw new Error(`Node search failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get graph statistics
   */
  async getStats(): Promise<{
    success: boolean;
    stats: {
      total_nodes: number;
      total_relationships: number;
      node_types: Array<{ labels: string[]; count: number }>;
      relationship_types: Array<{ type: string; count: number }>;
    };
  }> {
    const response = await fetch(`${this.apiUrl}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get available books from GraphRAG API via reconciliation
   */
  async getBooks(): Promise<{ books: Book[] }> {
    // Since the reconciliation API doesn't have a books endpoint,
    // we'll call the GraphRAG API directly for this
    const graphragUrl = 'https://borgesgraph-production.up.railway.app';
    const response = await fetch(`${graphragUrl}/books`);
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    return response.json();
  }
}

export const reconciliationService = new ReconciliationService();

// Export debug types for use in components
export type {
  DebugEntity,
  DebugCommunity,
  DebugRelationship,
  DebugTextSource,
  AnimationPhase,
  ProcessingPhase,
  DebugInfo,
  ReconciledQueryResult
};