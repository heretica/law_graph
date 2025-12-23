/**
 * Law GraphRAG MCP Proxy Route
 * Feature: 003-rag-observability-comparison
 *
 * Proxies requests to the Law GraphRAG MCP server using JSON-RPC protocol.
 * Handles session initialization and tool calls.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LAW_GRAPHRAG_MCP_URL = process.env.LAW_GRAPHRAG_API_URL || 'https://graphragmcp-production.up.railway.app'

// Session cache (in production, use Redis or similar)
let mcpSessionId: string | null = null

/**
 * Initialize MCP session
 */
async function initializeMcpSession(): Promise<string> {
  const response = await fetch(`${LAW_GRAPHRAG_MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'borges-interface', version: '1.0' }
      },
      id: 1
    })
  })

  if (!response.ok) {
    throw new Error(`MCP initialization failed: ${response.status}`)
  }

  // Get session ID from response header
  const sessionId = response.headers.get('mcp-session-id')
  if (!sessionId) {
    // Try to parse from SSE response
    const text = await response.text()
    console.log('MCP init response:', text)
    throw new Error('No session ID in MCP response')
  }

  return sessionId
}

/**
 * Call MCP tool
 */
async function callMcpTool(sessionId: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${LAW_GRAPHRAG_MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      },
      id: Date.now()
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MCP tool call failed: ${response.status} - ${errorText}`)
  }

  // Parse SSE response
  const text = await response.text()

  // SSE format: "event: message\ndata: {...}\n\n"
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.substring(6)
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.result?.content?.[0]?.text) {
          return JSON.parse(parsed.result.content[0].text)
        }
        return parsed
      } catch {
        continue
      }
    }
  }

  throw new Error('Could not parse MCP response')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, mode = 'local', commune_id } = body

    // Initialize session if needed
    if (!mcpSessionId) {
      console.log('Initializing MCP session...')
      mcpSessionId = await initializeMcpSession()
      console.log('MCP session initialized:', mcpSessionId)
    }

    // If commune_id is provided, query specific commune
    // Otherwise, query all communes
    let result: unknown

    if (commune_id) {
      result = await callMcpTool(mcpSessionId, 'grand_debat_query', {
        commune_id,
        query,
        mode,
        include_sources: true
      })
    } else {
      // Query all communes for broader coverage
      result = await callMcpTool(mcpSessionId, 'grand_debat_query_all', {
        query,
        mode: 'global',
        max_communes: 10,
        include_sources: true
      })
    }

    // Transform MCP response to match expected interface format
    // Handle both single-commune and multi-commune response formats
    const mcpResult = result as {
      success?: boolean
      answer?: string
      provenance?: {
        entities?: Array<{ id?: string; name?: string; type?: string; description?: string }>
        relationships?: Array<{ source?: string; target?: string; type?: string; description?: string; weight?: number }>
        source_quotes?: Array<{ content?: string; commune?: string; chunk_id?: number }>
        communities?: Array<{ title?: string; summary?: string; commune?: string; rating?: number }>
      }
      results?: Array<{ answer_summary?: string; commune_id?: string; commune_name?: string }>
      aggregated_provenance?: {
        entities?: Array<{ id?: string; name?: string; type?: string; description?: string }>
        relationships?: Array<{ source?: string; target?: string; type?: string; description?: string; weight?: number }>
        communities?: Array<{ title?: string; summary?: string; commune?: string; rating?: number }>
        source_quotes?: Array<{ content?: string; commune?: string; chunk_id?: number }>
      }
      error?: string
    }

    // Check for explicit failure or error message from server
    if (mcpResult.success === false || mcpResult.error) {
      throw new Error(mcpResult.error || 'MCP query failed')
    }

    // Handle null/undefined result gracefully
    if (!mcpResult || (typeof mcpResult === 'object' && Object.keys(mcpResult).length === 0)) {
      throw new Error('Empty response from MCP server')
    }

    // Build answer from results if multi-commune query
    let answer = mcpResult.answer || ''
    if (mcpResult.results && Array.isArray(mcpResult.results)) {
      answer = mcpResult.results
        .filter(r => r && (r.commune_id || r.commune_name))
        .map(r => `**${r.commune_name || r.commune_id}**: ${r.answer_summary || 'Aucune réponse'}`)
        .join('\n\n')
    }

    // Get provenance from either format (single-commune or multi-commune)
    const provenance = mcpResult.provenance || mcpResult.aggregated_provenance

    // Transform to expected format with robust null checks
    const transformedResponse = {
      success: true,
      query,
      answer: answer || 'Aucune réponse disponible.',
      graphrag_data: provenance ? {
        entities: (provenance.entities || [])
          .filter((e): e is NonNullable<typeof e> => e != null)
          .map((e: any, i: number) => ({
            id: e.id || e.name || `entity-${i}`,
            name: e.name || e.id || `Entity ${i}`,
            type: e.type || 'CIVIC_ENTITY',
            description: e.description || '',
            importance_score: typeof e.importance_score === 'number' ? e.importance_score : 0.5 // Default to 0.5 if missing
          })),
        relationships: (provenance.relationships || [])
          .filter((r): r is NonNullable<typeof r> => r != null && r.source != null && r.target != null)
          .map((r: any, i: number) => ({
            id: `rel-${i}`,
            source: r.source!,
            target: r.target!,
            type: r.type || 'RELATED_TO',
            description: r.description || '',
            weight: r.weight || 1.0,
            order: typeof r.order === 'number' ? r.order : 1 // Default to direct (1) if missing
          })),
        source_chunks: (provenance.source_quotes || [])
          .filter((q): q is NonNullable<typeof q> => q != null && q.content != null)
          .map((q, i) => ({
            chunk_id: `chunk-${q.chunk_id ?? i}`,
            content: q.content!,
            document_id: q.commune || 'unknown'
          })),
        communities: (provenance.communities || [])
          .filter((c): c is NonNullable<typeof c> => c != null)
          .map((c, i) => ({
            id: `community-${i}`,
            title: c.title || `Community ${i}`,
            summary: c.summary || '',
            commune: c.commune || '',
            rating: c.rating
          }))
      } : undefined
    }

    return NextResponse.json(transformedResponse)
  } catch (error) {
    console.error('Law GraphRAG MCP query failed:', error)

    // Reset session on error (might be expired)
    mcpSessionId = null

    return NextResponse.json(
      {
        success: false,
        error: 'Law GraphRAG query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Health check - list available communes
 */
export async function GET() {
  try {
    // Initialize session if needed
    if (!mcpSessionId) {
      mcpSessionId = await initializeMcpSession()
    }

    const result = await callMcpTool(mcpSessionId, 'grand_debat_list_communes', {})

    return NextResponse.json({
      status: 'healthy',
      proxy: 'law-graphrag-mcp',
      upstream: LAW_GRAPHRAG_MCP_URL,
      data: result
    })
  } catch (error) {
    console.error('Law GraphRAG health check failed:', error)
    mcpSessionId = null

    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
