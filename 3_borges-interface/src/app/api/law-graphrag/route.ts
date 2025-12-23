/**
 * Law GraphRAG MCP Proxy Route
 * Feature: 003-rag-observability-comparison
 *
 * Proxies requests to the Law GraphRAG MCP server using JSON-RPC protocol.
 * Handles session initialization and tool calls.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LAW_GRAPHRAG_MCP_URL = process.env.LAW_GRAPHRAG_API_URL || 'https://law-graphrag-reconciliation-api-production.up.railway.app'

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
    const mcpResult = result as {
      success: boolean
      answer?: string
      provenance?: {
        entities?: Array<{ id: string; name: string; type: string; description?: string }>
        relationships?: Array<{ source: string; target: string; type?: string }>
        source_quotes?: Array<{ content: string; commune?: string }>
      }
      results?: Array<{ answer_summary: string; commune_id: string }>
      error?: string
    }

    if (!mcpResult.success) {
      throw new Error(mcpResult.error || 'MCP query failed')
    }

    // Build answer from results if multi-commune query
    let answer = mcpResult.answer || ''
    if (mcpResult.results) {
      answer = mcpResult.results
        .map(r => `**${r.commune_id}**: ${r.answer_summary}`)
        .join('\n\n')
    }

    // Transform to expected format
    const transformedResponse = {
      success: true,
      query,
      answer,
      graphrag_data: mcpResult.provenance ? {
        entities: (mcpResult.provenance.entities || []).map((e, i) => ({
          id: e.id || `entity-${i}`,
          name: e.name || e.id,
          type: e.type || 'concept',
          description: e.description
        })),
        relationships: (mcpResult.provenance.relationships || []).map((r, i) => ({
          id: `rel-${i}`,
          source: r.source,
          target: r.target,
          type: r.type || 'RELATED_TO'
        })),
        source_chunks: (mcpResult.provenance.source_quotes || []).map((q, i) => ({
          chunk_id: `chunk-${i}`,
          content: q.content,
          document_id: q.commune || 'unknown'
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
