import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '300'
    const centralityType = searchParams.get('centrality_type') || 'degree'

    const params = new URLSearchParams()
    params.append('limit', limit)
    params.append('centrality_type', centralityType)

    console.log(`🔄 Fetching nodes with limit ${limit}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const response = await fetch(`${RECONCILIATION_API_URL}/graph/nodes?${params}`, {
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
    console.log(`✅ Nodes returned: ${data.nodes?.length || 0} nodes`)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Nodes fetch timeout (>55s)')
      return NextResponse.json(
        {
          success: false,
          error: 'Timeout fetching nodes',
          nodes: []
        },
        { status: 500 }
      )
    }
    console.error('Nodes fetch failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        nodes: []
      },
      { status: 500 }
    )
  }
}