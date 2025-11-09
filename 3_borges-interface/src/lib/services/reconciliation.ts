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
  context?: {
    mode: 'local' | 'global';
  };
  search_path?: GraphRAGSearchPath;
  nodes?: Neo4jNode[];
  relationships?: Neo4jRelationship[];
  graph?: {
    total_nodes: number;
    total_relationships: number;
    node_types?: string[];
  };
  timestamp: string;
  debug_info?: DebugInfo;
  processing_time?: number;
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
   * Uses GET with chunking to avoid URL length limits
   * Includes retry logic for transient failures
   */
  async getRelationships(nodeIds: string[], limit: number = 10000): Promise<{
    success: boolean;
    relationships: Neo4jRelationship[];
    count: number;
    input_nodes: number;
    limit_applied: number;
    filtered: boolean;
  }> {
    console.log(`🔍 Fetching relationships for ${nodeIds.length} nodes with limit ${limit}`);

    if (nodeIds.length === 0) {
      return {
        success: true,
        relationships: [],
        count: 0,
        input_nodes: 0,
        limit_applied: limit,
        filtered: false
      };
    }

    // Split into chunks to avoid URL length limits (HTTP header limit is ~4094 bytes)
    // Neo4j element_id is ~43 chars, so ~50 nodes * 43 = 2.15KB safe per request
    // Using smaller chunks (50) to stay well below HTTP header size limit
    const chunkSize = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < nodeIds.length; i += chunkSize) {
      chunks.push(nodeIds.slice(i, i + chunkSize));
    }

    console.log(`📦 Chunking ${nodeIds.length} nodes into ${chunks.length} requests (${chunkSize} per chunk)`);

    // Helper function to fetch with retry logic
    const fetchWithRetry = async (url: string, maxRetries: number = 3): Promise<any> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📡 Fetching (attempt ${attempt}/${maxRetries}), URL: ${url.substring(0, 150)}...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(`⚠️ Failed to fetch relationships (attempt ${attempt}): ${response.status}`);
            if (attempt < maxRetries && response.status >= 500) {
              // Retry on server errors
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
              console.log(`⏳ Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              relationships: [],
              count: 0
            };
          }

          const data = await response.json();
          console.log(`✅ Chunk fetched successfully: ${data.relationships?.length || 0} relationships`);
          return data;
        } catch (error) {
          console.error(`❌ Fetch error (attempt ${attempt}/${maxRetries}):`, error instanceof Error ? error.message : error);
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            return {
              success: false,
              relationships: [],
              count: 0
            };
          }
        }
      }

      return {
        success: false,
        relationships: [],
        count: 0
      };
    };

    // Fetch relationships for each chunk with sequential requests to avoid overload
    const chunkResults = [];
    for (const chunk of chunks) {
      const params = new URLSearchParams();
      params.append('node_ids', chunk.join(','));
      params.append('limit', limit.toString());

      const url = `${this.apiUrl}/graph/relationships?${params}`;
      const result = await fetchWithRetry(url, 3);
      chunkResults.push(result);
    }

    // Combine results from all chunks
    const allRelationships: Neo4jRelationship[] = [];
    let totalFiltered = false;

    for (const result of chunkResults) {
      if (result.success && result.relationships) {
        allRelationships.push(...result.relationships);
        if (result.filtered) {
          totalFiltered = true;
        }
      }
    }

    // Remove duplicates by relationship ID
    const uniqueRelationships = Array.from(
      new Map(allRelationships.map(rel => [rel.id, rel])).values()
    );

    console.log(`✅ Relationships fetched: ${uniqueRelationships.length} from ${nodeIds.length} nodes across ${chunks.length} chunks`);
    if (totalFiltered) {
      console.warn(`⚠️ Some chunks hit relationship limit. Total may be incomplete.`);
    }

    return {
      success: true,
      relationships: uniqueRelationships,
      count: uniqueRelationships.length,
      input_nodes: nodeIds.length,
      limit_applied: limit,
      filtered: totalFiltered
    };
  }

  /**
   * Perform multi-book GraphRAG query sequentially across all available books
   * Returns aggregated results with book-source metadata
   * Falls back to reconciled query if endpoint not available
   */
  async multiBookQuery(options: {
    query: string;
    mode?: 'local' | 'global';
    debug_mode?: boolean;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/query/multi-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: options.query,
          mode: options.mode || 'local',
          debug_mode: options.debug_mode || true
        }),
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 404) {
        console.warn('⚠️ Multi-book endpoint not deployed yet, falling back to reconciled query');
        return this.reconciledQuery(options);
      }

      throw new Error(`Multi-book query failed: ${response.status}`);
    } catch (error) {
      console.warn(`Multi-book query error: ${error}, falling back to reconciled query`);
      return this.reconciledQuery(options);
    }
  }

  /**
   * Perform GraphRAG query with node extraction
   */
  async reconciledQuery(options: {
    query: string;
    mode?: 'local' | 'global';
    debug_mode?: boolean;
    book_id?: string;
  }): Promise<ReconciledQueryResult> {
    const response = await fetch(`${this.apiUrl}/graph/search-nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: options.query,
        mode: options.mode || 'local',
        debug_mode: options.debug_mode || false,
        book_id: options.book_id
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.status}`);
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