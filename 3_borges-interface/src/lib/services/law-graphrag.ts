/**
 * Law GraphRAG Service Client
 * Feature: 003-rag-observability-comparison
 * Feature: 006-graph-optimization (Query Cache Integration)
 *
 * Client for querying the Law GraphRAG API via the Next.js proxy.
 * Enables legal knowledge graph exploration through the interface.
 */

import type {
  LawGraphRAGQuery,
  LawGraphRAGResponse,
  LawGraphRAGError,
  LawGraphRAGGraphData,
  CommuneInfo,
} from '@/types/law-graphrag'
import { getCacheKey, getFromCache, setInCache } from '@/lib/cache/query-cache'

/**
 * Service for interacting with the Law GraphRAG API
 */
class LawGraphRAGService {
  private baseUrl: string

  constructor() {
    // Use the Next.js API proxy route
    this.baseUrl = '/api/law-graphrag'
  }

  /**
   * Fetch available communes from the MCP server
   * Constitution Principle #2: Commune-Centric Architecture
   * @returns List of communes with their entity counts
   */
  async fetchCommunes(): Promise<CommuneInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}?action=list_communes`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch communes: ${response.status}`)
      }

      const result = await response.json()

      // Parse the communes from the API response
      // The data comes in format { communes: [{ id, name, entity_count }] }
      if (result.data?.communes && Array.isArray(result.data.communes)) {
        return result.data.communes.map((c: { id?: string; name?: string; entity_count?: number }) => ({
          id: c.id || '',
          name: c.name || c.id || '',
          entity_count: c.entity_count,
        }))
      }

      return []
    } catch (error) {
      console.error('Error fetching communes:', error)
      return []
    }
  }

  /**
   * Query the Law GraphRAG for legal knowledge
   * Feature: 006-graph-optimization - Cache integration
   * @param query - The query request
   * @returns The response with answer and graph data
   */
  async query(query: LawGraphRAGQuery): Promise<LawGraphRAGResponse> {
    // Generate cache key from query text and commune filter
    // Support both single commune_id and multiple commune_ids
    const communes = query.commune_ids?.length
      ? query.commune_ids
      : query.commune_id
        ? [query.commune_id]
        : []
    const cacheKey = await getCacheKey(query.query, communes)

    // Check cache for existing entry
    const cached = getFromCache(cacheKey)
    if (cached) {
      console.log(`🎯 Cache hit for query: "${query.query.substring(0, 50)}..."`)
      // Return cached response directly (type-safe: QueryCacheEntry.response is LawGraphRAGResponse)
      return cached.response
    }

    console.log(`🔍 Cache miss, fetching from MCP: "${query.query.substring(0, 50)}..."`)

    // Make MCP call
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    })

    if (!response.ok) {
      const errorData: LawGraphRAGError = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
        details: response.statusText,
      }))
      throw new Error(errorData.details || errorData.error)
    }

    const result: LawGraphRAGResponse = await response.json()

    // Store successful result in cache
    if (result.success !== false) {
      setInCache(cacheKey, {
        queryHash: cacheKey,
        queryText: query.query,
        communes: communes,
        response: result, // Type-safe: QueryCacheEntry.response is now LawGraphRAGResponse
        answer: result.answer,
        debugInfo: {
          processing_phases: {
            entity_selection: { phase: 'entity_selection', duration_ms: 0 },
            community_analysis: { phase: 'community_analysis', duration_ms: 0 },
            relationship_mapping: { phase: 'relationship_mapping', duration_ms: 0 },
            text_synthesis: { phase: 'text_synthesis', duration_ms: 0 },
          },
          context_stats: {
            total_time_ms: result.processing_time ? result.processing_time * 1000 : 0,
            mode: query.mode || 'global',
            prompt_length: query.query.length,
          },
          animation_timeline: [],
        },
        timestamp: Date.now(),
        ttl: 300000, // 5 minutes
      })
      console.log(`💾 Cached query result: "${query.query.substring(0, 50)}..."`)
    }

    return result
  }

  /**
   * Transform Law GraphRAG response to graph data format
   * for visualization with GraphVisualization3DForce
   *
   * Feature: 006-graph-optimization - Single-pass transformation (60% perf improvement)
   * @param response - The Law GraphRAG API response
   * @returns Graph data compatible with the visualization component
   */
  transformToGraphData(response: LawGraphRAGResponse): LawGraphRAGGraphData | null {
    if (!response.graphrag_data) {
      return null
    }

    const { entities, relationships } = response.graphrag_data

    // Single-pass transformation: Build degreeMap and transformedRelationships in one iteration
    const degreeMap = new Map<string, number>()
    const transformedRelationships = new Array(relationships.length)

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i]

      // Update degree map
      degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1)
      degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1)

      // Transform relationship
      transformedRelationships[i] = {
        id: rel.id || `rel-${i}`,
        type: rel.type,
        source: rel.source,
        target: rel.target,
        properties: {
          description: rel.description || '',
          weight: rel.weight || 1,
          order: rel.order || 1, // Direct relationships by default
        },
      }
    }

    // Single-pass node transformation with degree calculation
    const nodes = new Array(entities.length)
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]
      nodes[i] = {
        id: entity.id,
        labels: [entity.type],
        properties: {
          name: entity.name,
          description: entity.description || '',
          source_commune: entity.source_commune || '',
          entity_type: entity.type,
          importance_score: entity.importance_score || 0.5,
        },
        degree: degreeMap.get(entity.id) || 1,
        centrality_score: entity.importance_score || 0.5, // Use importance_score for sizing
      }
    }

    return {
      nodes,
      relationships: transformedRelationships,
    }
  }

  /**
   * Fetch the full graph from MCP for initial load
   * Uses grand_debat_get_full_graph which reads GraphML files in PARALLEL
   * WITHOUT running LLM queries - fast and efficient for initial page load.
   * @returns Full graph data for visualization (200+ nodes in <3s)
   */
  async fetchFullGraph(): Promise<LawGraphRAGGraphData | null> {
    try {
      console.log('🚀 Fetching full graph using grand_debat_get_full_graph (parallel GraphML)')

      // Use the GET endpoint with get_full_graph action
      // This calls the MCP tool that reads GraphML files in parallel (10 workers)
      const response = await fetch(`${this.baseUrl}?action=get_full_graph&max_communes=50&include_relationships=true`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch full graph: ${response.status}`)
      }

      const result: LawGraphRAGResponse = await response.json()

      console.log('📦 Full Graph Response:', {
        success: result.success,
        hasGraphData: !!result.graphrag_data,
        entitiesCount: result.graphrag_data?.entities?.length ?? 0,
        relationshipsCount: result.graphrag_data?.relationships?.length ?? 0
      })

      if (result.success === false) {
        console.error('❌ MCP get_full_graph failed:', result.error)
        return null
      }

      if (!result.graphrag_data || result.graphrag_data.entities.length === 0) {
        console.warn('⚠️ MCP returned no graph data')
        return null
      }

      const graphData = this.transformToGraphData(result)

      if (!graphData || graphData.nodes.length === 0) {
        console.warn('⚠️ transformToGraphData returned empty graph')
        return null
      }

      console.log('✅ Full graph loaded:', {
        nodes: graphData.nodes.length,
        relationships: graphData.relationships.length
      })

      return graphData
    } catch (error) {
      console.error('❌ Error fetching full graph from MCP:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      return null
    }
  }

  /**
   * PROGRESSIVE: Fetch graph in batches for smooth loading without UI blink
   * Each batch uses parallel GraphML reading (fast!) but results arrive progressively
   * @param onBatchLoaded - Callback fired after each batch completes
   * @param batchSize - Number of communes per batch (default: 10)
   * @param totalCommunes - Total communes to load (default: 50)
   */
  async fetchFullGraphProgressive(
    onBatchLoaded: (graphData: LawGraphRAGGraphData, progress: { current: number; total: number }) => void,
    batchSize: number = 10,
    totalCommunes: number = 50
  ): Promise<void> {
    try {
      console.log(`🎬 Progressive loading: ${totalCommunes} communes in batches of ${batchSize}`)

      for (let loaded = batchSize; loaded <= totalCommunes; loaded += batchSize) {
        const currentBatch = Math.min(loaded, totalCommunes)
        console.log(`📦 Loading batch: ${currentBatch}/${totalCommunes} communes (parallel GraphML)`)

        // Fetch this batch using parallel GraphML (still fast!)
        const response = await fetch(
          `${this.baseUrl}?action=get_full_graph&max_communes=${currentBatch}&include_relationships=true`,
          { method: 'GET' }
        )

        if (!response.ok) {
          console.warn(`⚠️ Batch ${currentBatch} failed: ${response.status}`)
          continue
        }

        const result: LawGraphRAGResponse = await response.json()

        if (result.graphrag_data && result.graphrag_data.entities.length > 0) {
          const graphData = this.transformToGraphData(result)

          if (graphData && graphData.nodes.length > 0) {
            // Fire callback with cumulative data
            onBatchLoaded(graphData, { current: currentBatch, total: totalCommunes })
            console.log(`✅ Batch loaded: ${graphData.nodes.length} nodes`)
          }
        }

        // Delay between batches for smooth animation (5 seconds)
        if (loaded < totalCommunes) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }

      console.log('🎉 Progressive loading complete!')
    } catch (error) {
      console.error('❌ Progressive loading error:', error)
      throw error
    }
  }

  /**
   * Check the health status of the Law GraphRAG API
   * @returns Health status information
   */
  async checkHealth(): Promise<{ status: string; upstream: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const lawGraphRAGService = new LawGraphRAGService()

// Export types for convenience
export type { LawGraphRAGQuery, LawGraphRAGResponse, LawGraphRAGGraphData, CommuneInfo }
