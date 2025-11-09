import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '300'
    const centralityType = searchParams.get('centrality_type') || 'degree'

    const params = new URLSearchParams()
    params.append('limit', limit)
    params.append('centrality_type', centralityType)

    const response = await fetch(`${RECONCILIATION_API_URL}/graph/nodes?${params}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Nodes fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nodes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}