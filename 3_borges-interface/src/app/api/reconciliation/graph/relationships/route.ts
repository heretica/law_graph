import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeIds = searchParams.get('node_ids') || ''
    const limit = searchParams.get('limit') || '10000'

    const params = new URLSearchParams()
    params.append('node_ids', nodeIds)
    params.append('limit', limit)

    const response = await fetch(`${RECONCILIATION_API_URL}/graph/relationships?${params}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Relationships fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch relationships', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}