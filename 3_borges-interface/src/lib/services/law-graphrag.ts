/**
 * Law GraphRAG Service Client
 * Feature: 003-rag-observability-comparison
 *
 * Client for querying the Law GraphRAG API via the Next.js proxy.
 * Enables legal knowledge graph exploration through the interface.
 */

import type {
  LawGraphRAGQuery,
  LawGraphRAGResponse,
  LawGraphRAGError,
  LawGraphRAGGraphData,
} from '@/types/law-graphrag'

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
   * Query the Law GraphRAG for legal knowledge
   * @param query - The query request
   * @returns The response with answer and graph data
   */
  async query(query: LawGraphRAGQuery): Promise<LawGraphRAGResponse> {
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

    return response.json()
  }

  /**
   * Transform Law GraphRAG response to graph data format
   * for visualization with GraphVisualization3DForce
   *
   * @param response - The Law GraphRAG API response
   * @returns Graph data compatible with the visualization component
   */
  transformToGraphData(response: LawGraphRAGResponse): LawGraphRAGGraphData | null {
    if (!response.graphrag_data) {
      return null
    }

    const { entities, relationships } = response.graphrag_data

    // Transform entities to nodes
    const nodes = entities.map((entity) => ({
      id: entity.id,
      labels: [entity.type],
      properties: {
        name: entity.name,
        description: entity.description || '',
        source_commune: entity.source_commune || '',
        entity_type: entity.type,
      },
      degree: 1, // Will be calculated from relationships
      centrality_score: 0.5, // Default centrality
    }))

    // Calculate node degrees from relationships
    const degreeMap = new Map<string, number>()
    relationships.forEach((rel) => {
      degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1)
      degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1)
    })
    nodes.forEach((node) => {
      node.degree = degreeMap.get(node.id) || 1
    })

    // Transform relationships
    const transformedRelationships = relationships.map((rel, index) => ({
      id: rel.id || `rel-${index}`,
      type: rel.type,
      source: rel.source,
      target: rel.target,
      properties: {
        description: rel.description || '',
        weight: rel.weight || 1,
      },
    }))

    return {
      nodes,
      relationships: transformedRelationships,
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
export type { LawGraphRAGQuery, LawGraphRAGResponse, LawGraphRAGGraphData }
