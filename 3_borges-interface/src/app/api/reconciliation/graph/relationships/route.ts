import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum function duration: 60 seconds

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeIds = searchParams.get('node_ids') || ''
    const limit = searchParams.get('limit') || '10000'

    if (!nodeIds) {
      return NextResponse.json({
        success: true,
        relationships: [],
        count: 0,
        input_nodes: 0,
        limit_applied: parseInt(limit),
        filtered: false
      })
    }

    const params = new URLSearchParams()
    params.append('node_ids', nodeIds)
    params.append('limit', limit)

    console.log(`🔄 Fetching relationships: ${nodeIds.split(',').length} nodes with limit ${limit}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000) // 55 second timeout (leaving 5 for cleanup)

    const response = await fetch(`${RECONCILIATION_API_URL}/graph/relationships?${params}`, {
      signal: controller.signal,
      headers: {
        'Connection': 'keep-alive',
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error ${response.status}: ${errorText.substring(0, 200)}`)
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Relationships returned: ${data.relationships?.length || 0} relationships`)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Relationships fetch timeout (>55s)')
      return NextResponse.json(
        {
          success: true,
          relationships: [],
          count: 0,
          input_nodes: 0,
          limit_applied: 0,
          filtered: true,
          error: 'Timeout fetching relationships'
        },
        { status: 200 }
      )
    }
    console.error('Relationships fetch failed:', error)
    return NextResponse.json(
      {
        success: true,
        relationships: [],
        count: 0,
        input_nodes: 0,
        limit_applied: 0,
        filtered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    )
  }
}