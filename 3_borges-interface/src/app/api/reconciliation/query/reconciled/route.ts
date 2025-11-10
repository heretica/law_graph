import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API Route: Forwarding request to', `${RECONCILIATION_API_URL}/query/reconciled`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    const response = await fetch(`${RECONCILIATION_API_URL}/query/reconciled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('API Route: Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Route: Error response:', errorText)
      throw new Error(`Query failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('API Route: Success, selected_nodes count:', data.selected_nodes?.length || 0)
    return NextResponse.json(data)

  } catch (error) {
    console.error('API Route: Error with reconciled query:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('aborted')) {
      return NextResponse.json(
        { success: false, error: 'Request timeout - GraphRAG query took too long' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}