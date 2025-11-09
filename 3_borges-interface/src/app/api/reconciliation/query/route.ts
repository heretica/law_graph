import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${RECONCILIATION_API_URL}/query/reconciled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Reconciled query failed:', error)
    return NextResponse.json(
      { error: 'Reconciled query failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}