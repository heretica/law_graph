/**
 * Law GraphRAG API Proxy Route
 * Feature: 003-rag-observability-comparison
 *
 * Proxies requests to the Law GraphRAG API for legal knowledge graph queries.
 * Follows the same pattern as reconciliation/query/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LAW_GRAPHRAG_API_URL = process.env.LAW_GRAPHRAG_API_URL || 'https://law-graphrag-reconciliation-api-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${LAW_GRAPHRAG_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Law GraphRAG API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Law GraphRAG query failed:', error)
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
 * Health check endpoint for Law GraphRAG API
 */
export async function GET() {
  try {
    const response = await fetch(`${LAW_GRAPHRAG_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      ...data,
      proxy: 'law-graphrag',
      upstream: LAW_GRAPHRAG_API_URL
    })
  } catch (error) {
    console.error('Law GraphRAG health check failed:', error)
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
