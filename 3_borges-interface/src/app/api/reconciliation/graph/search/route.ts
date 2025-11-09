import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') || '50'

    const params = new URLSearchParams()
    params.append('q', q)
    if (type) params.append('type', type)
    params.append('limit', limit)

    const response = await fetch(`${RECONCILIATION_API_URL}/graph/search?${params}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search nodes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}