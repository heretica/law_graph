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

      // Parse the communes from the health check response
      // The data comes in format { communes: [{ commune_id, commune_name, entity_count }] }
      if (result.data?.communes && Array.isArray(result.data.communes)) {
        return result.data.communes.map((c: { commune_id?: string; commune_name?: string; entity_count?: number }) => ({
          id: c.commune_id || '',
          name: c.commune_name || c.commune_id || '',
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
   * Uses grand_debat_query_all which now queries ALL 50 communes in both modes:
   * - local mode: entities, relationships, source quotes
   * - global mode: community summaries
   * @returns Full graph data for visualization
   */
  async fetchFullGraph(): Promise<LawGraphRAGGraphData | null> {
    try {
      // Use a broad query to get comprehensive data across all communes
      const response = await this.query({
        query: 'Grand Débat National préoccupations citoyennes',
        mode: 'global',  // Mode is ignored - MCP queries both modes now
      })

      if (response.success === false) {
        console.error('Failed to fetch full graph:', response.error)
        return null
      }

      return this.transformToGraphData(response)
    } catch (error) {
      console.error('Error fetching full graph from MCP:', error)
      return null
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
