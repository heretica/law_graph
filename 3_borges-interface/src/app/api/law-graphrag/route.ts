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

// Session pool configuration
const SESSION_TTL = 300000 // 5 minutes
const MAX_SESSIONS = 3

interface PooledSession {
  sessionId: string
  lastUsed: number
  requestCount: number
  status: 'active' | 'idle' | 'expired'
}

// Session pool singleton
const sessionPool: Map<string, PooledSession> = new Map()

// Cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Send MCP shutdown message to properly close a session
 * This prevents orphaned resources on the MCP server
 */
async function closeSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${LAW_GRAPHRAG_MCP_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'shutdown',
        id: Date.now()
      })
    })

    if (!response.ok) {
      console.warn(`[SessionPool] Shutdown message failed for session ${sessionId}: ${response.status}`)
    } else {
      console.log(`[SessionPool] Successfully sent shutdown for session ${sessionId}`)
    }
  } catch (error) {
    // Log warning but don't throw - we still want to remove from pool
    console.warn(`[SessionPool] Failed to send shutdown for session ${sessionId}:`, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Start periodic cleanup of expired sessions
 */
function startSessionCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    cleanupExpiredSessions()
  }, 60000) // Every minute
}

/**
 * Remove expired sessions from the pool
 * Sends MCP shutdown message before removing to prevent orphaned server resources
 */
async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now()
  const expiredSessions: string[] = []

  for (const [sessionId, session] of Array.from(sessionPool.entries())) {
    if (now - session.lastUsed > SESSION_TTL) {
      session.status = 'expired'
      expiredSessions.push(sessionId)
    }
  }

  // Send shutdown messages in parallel for all expired sessions
  await Promise.all(
    expiredSessions.map(async (sessionId) => {
      await closeSession(sessionId)
      sessionPool.delete(sessionId)
      console.log(`[SessionPool] Cleaned up expired session: ${sessionId}`)
    })
  )

  if (expiredSessions.length > 0) {
    console.log(`[SessionPool] Removed ${expiredSessions.length} expired session(s). Pool size: ${sessionPool.size}`)
  }
}

/**
 * Get an available session from the pool or create a new one
 */
async function getAvailableSession(): Promise<string> {
  const now = Date.now()

  // Start cleanup on first use
  if (!cleanupInterval) {
    startSessionCleanup()
  }

  // Try to find an idle session
  for (const [sessionId, session] of Array.from(sessionPool.entries())) {
    if (session.status === 'idle' && now - session.lastUsed < SESSION_TTL) {
      session.status = 'active'
      session.lastUsed = now
      session.requestCount++
      console.log(`[SessionPool] Reusing session ${sessionId} (requests: ${session.requestCount})`)
      return sessionId
    }
  }

  // If pool is at capacity, remove oldest expired/idle session
  if (sessionPool.size >= MAX_SESSIONS) {
    let oldestSessionId: string | null = null
    let oldestTime = now

    for (const [sessionId, session] of Array.from(sessionPool.entries())) {
      if (session.status === 'idle' && session.lastUsed < oldestTime) {
        oldestTime = session.lastUsed
        oldestSessionId = sessionId
      }
    }

    if (oldestSessionId) {
      // Send shutdown before removing to prevent orphaned server resources
      await closeSession(oldestSessionId)
      sessionPool.delete(oldestSessionId)
      console.log(`[SessionPool] Removed oldest session to make room: ${oldestSessionId}`)
    }
  }

  // Create new session
  const newSessionId = await initializeMcpSession()
  sessionPool.set(newSessionId, {
    sessionId: newSessionId,
    lastUsed: now,
    requestCount: 1,
    status: 'active'
  })

  console.log(`[SessionPool] Created new session ${newSessionId}. Pool size: ${sessionPool.size}`)
  return newSessionId
}

/**
 * Release a session back to the pool after use
 */
function releaseSession(sessionId: string) {
  const session = sessionPool.get(sessionId)
  if (session) {
    session.status = 'idle'
    session.lastUsed = Date.now()
    console.log(`[SessionPool] Released session ${sessionId} (requests: ${session.requestCount})`)
  }
}

// Legacy variable (kept for compatibility, but pool is now used)
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
 * Check if an error is permanent and should not be retried
 */
function isPermanentError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase()
  const permanentIndicators = [
    'unauthorized',
    'forbidden',
    'not_found',
    'not found',
    'validation_error',
    'invalid',
    'bad request',
    '401',
    '403',
    '404',
    '400'
  ]

  return permanentIndicators.some(indicator => errorMessage.includes(indicator))
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on permanent errors
      if (isPermanentError(lastError)) {
        console.log(`[Retry] Permanent error detected for ${context}, not retrying: ${lastError.message}`)
        throw lastError
      }

      // Log retry attempt
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${context}: ${lastError.message}. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.log(`[Retry] All ${maxRetries + 1} attempts failed for ${context}: ${lastError.message}`)
      }
    }
  }

  throw lastError
}

/**
 * Call MCP tool with retry logic
 */
async function callMcpTool(sessionId: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
  return withRetry(
    async () => {
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
              const textContent = parsed.result.content[0].text
              // Check if textContent is already an object or needs parsing
              if (typeof textContent === 'string') {
                try {
                  return JSON.parse(textContent)
                } catch {
                  // If parsing fails, return as-is (might be plain text)
                  return textContent
                }
              }
              // Already an object, return directly
              return textContent
            }
            return parsed
          } catch {
            continue
          }
        }
      }

      throw new Error('Could not parse MCP response')
    },
    `${toolName}(${JSON.stringify(args).substring(0, 50)}...)`,
    2, // maxRetries
    1000 // baseDelay
  )
}

export async function POST(request: NextRequest) {
  let sessionId: string | null = null

  try {
    const body = await request.json()
    const { query, mode = 'local', commune_id, commune_ids } = body

    // Get session from pool (reuses existing or creates new)
    sessionId = await getAvailableSession()

    // Determine query strategy:
    // 1. commune_ids array (multi-commune comparative analysis)
    // 2. commune_id (single commune query)
    // 3. No filter (query all communes)
    let result: unknown

    if (commune_ids && Array.isArray(commune_ids) && commune_ids.length > 0) {
      // Multi-commune query: Execute parallel queries and merge results
      // Constitution Principle #3: Cross-Commune Analysis
      console.log(`[Multi-Commune] Querying ${commune_ids.length} communes in parallel`)

      const communeResults = await Promise.all(
        commune_ids.map(async (cid: string) => {
          try {
            return await callMcpTool(sessionId!, 'grand_debat_query', {
              commune_id: cid,
              query,
              mode,
              include_sources: true
            })
          } catch (error) {
            console.error(`[Multi-Commune] Failed for ${cid}:`, error)
            return null // Partial failure handling
          }
        })
      )

      // Merge results with Set-based deduplication
      const entityMap = new Map<string, { id: string; name: string; type: string; description?: string; source_commune?: string }>()
      const relationshipSet = new Set<string>()
      const relationships: Array<{ source: string; target: string; type: string; description?: string; weight?: number }> = []
      const sourceQuotes: Array<{ content: string; commune: string; chunk_id: number }> = []
      const answerParts: string[] = []

      for (const res of communeResults) {
        if (!res) continue
        const mcpRes = res as {
          answer?: string
          commune_id?: string
          commune_name?: string
          provenance?: {
            entities?: Array<{ id?: string; name?: string; type?: string; description?: string; source_commune?: string }>
            relationships?: Array<{ source?: string; target?: string; type?: string; description?: string; weight?: number }>
            source_quotes?: Array<{ content?: string; commune?: string; chunk_id?: number }>
          }
        }

        // Collect answer
        if (mcpRes.answer) {
          const communeName = mcpRes.commune_name || mcpRes.commune_id || 'Unknown'
          answerParts.push(`**${communeName}**: ${mcpRes.answer}`)
        }

        // Deduplicate entities by id
        if (mcpRes.provenance?.entities) {
          for (const e of mcpRes.provenance.entities) {
            if (e && e.id && !entityMap.has(e.id)) {
              entityMap.set(e.id, {
                id: e.id,
                name: e.name || e.id,
                type: e.type || 'CIVIC_ENTITY',
                description: e.description,
                source_commune: e.source_commune
              })
            }
          }
        }

        // Deduplicate relationships by source-target-type key
        if (mcpRes.provenance?.relationships) {
          for (const r of mcpRes.provenance.relationships) {
            if (r && r.source && r.target) {
              const key = `${r.source}-${r.target}-${r.type || 'RELATED_TO'}`
              if (!relationshipSet.has(key)) {
                relationshipSet.add(key)
                relationships.push({
                  source: r.source,
                  target: r.target,
                  type: r.type || 'RELATED_TO',
                  description: r.description,
                  weight: r.weight
                })
              }
            }
          }
        }

        // Collect source quotes with commune attribution
        if (mcpRes.provenance?.source_quotes) {
          for (const q of mcpRes.provenance.source_quotes) {
            if (q && q.content) {
              sourceQuotes.push({
                content: q.content,
                commune: q.commune || mcpRes.commune_id || 'Unknown',
                chunk_id: q.chunk_id || sourceQuotes.length
              })
            }
          }
        }
      }

      // Build merged result in expected format
      result = {
        success: true,
        answer: answerParts.join('\n\n'),
        provenance: {
          entities: Array.from(entityMap.values()),
          relationships,
          source_quotes: sourceQuotes
        }
      }
    } else if (commune_id) {
      result = await callMcpTool(sessionId, 'grand_debat_query', {
        commune_id,
        query,
        mode,
        include_sources: true
      })
    } else {
      // Query all communes for full dataset - Constitution: 50 communes in Charente-Maritime
      result = await callMcpTool(sessionId, 'grand_debat_query_all', {
        query,
        mode: 'global',
        max_communes: 50,  // Full dataset: all 50 communes in Charente-Maritime (target: 200+ nodes)
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
            // Constitution Principle VII: Civic Provenance Chain
            // Fallback order: quote.commune > request commune_id > explicit missing marker
            document_id: q.commune || commune_id || 'PROVENANCE_MISSING'
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

    // Release session back to pool for reuse
    if (sessionId) {
      releaseSession(sessionId)
    }

    // HTTP Cache-Control headers at the API route level (proper HTTP layer separation)
    // Graph query results can be cached for 5 minutes (300s) to reduce MCP server load
    // stale-while-revalidate allows serving stale content while fetching fresh data in background
    return NextResponse.json(transformedResponse, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Law GraphRAG MCP query failed:', error)

    // If session was created, send shutdown and remove from pool
    if (sessionId) {
      const currentSessionId = sessionId // Capture for closure
      // Fire and forget - don't await to avoid delaying error response
      closeSession(currentSessionId).finally(() => {
        sessionPool.delete(currentSessionId)
        console.log(`[SessionPool] Removed failed session ${currentSessionId}`)
      })
    }

    // Error responses should not be cached to allow retry
    return NextResponse.json(
      {
        success: false,
        error: 'Law GraphRAG query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  }
}

/**
 * Health check and commune list endpoint
 * GET /api/law-graphrag - Health check
 * GET /api/law-graphrag?action=list_communes - List communes for selector
 */
export async function GET(request: NextRequest) {
  let sessionId: string | null = null
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    // Get session from pool
    sessionId = await getAvailableSession()

    const result = await callMcpTool(sessionId, 'grand_debat_list_communes', {})

    // Release session back to pool
    if (sessionId) {
      releaseSession(sessionId)
    }

    // If action is list_communes, return just the communes data
    // This is used by the CommuneSelector component
    if (action === 'list_communes') {
      return NextResponse.json({
        status: 'ok',
        data: result
      }, {
        headers: {
          // Communes list can be cached for longer (5 minutes) as it rarely changes
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      })
    }

    // Default: Health check response
    return NextResponse.json({
      status: 'healthy',
      proxy: 'law-graphrag-mcp',
      upstream: LAW_GRAPHRAG_MCP_URL,
      sessionPool: {
        size: sessionPool.size,
        maxSessions: MAX_SESSIONS,
        ttl: SESSION_TTL
      },
      data: result
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=10',
      },
    })
  } catch (error) {
    console.error('Law GraphRAG health check failed:', error)

    // If session was created, send shutdown and remove from pool
    if (sessionId) {
      const currentSessionId = sessionId // Capture for closure
      // Fire and forget - don't await to avoid delaying error response
      closeSession(currentSessionId).finally(() => {
        sessionPool.delete(currentSessionId)
        console.log(`[SessionPool] Removed failed session ${currentSessionId}`)
      })
    }

    // Error responses should not be cached to allow retry
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  }
}
