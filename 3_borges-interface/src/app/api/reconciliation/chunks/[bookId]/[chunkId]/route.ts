import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chunkId: string }> }
) {
  try {
    const { bookId, chunkId } = await params

    console.log(`API Route: Fetching chunk ${chunkId} from book ${bookId}`)

    const response = await fetch(
      `${RECONCILIATION_API_URL}/chunks/${bookId}/${chunkId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('API Route: Chunk response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Route: Chunk error response:', errorText)
      throw new Error(`Chunk fetch failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('API Route: Chunk success, content length:', data.content?.length || 0)

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Route: Error fetching chunk:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
