import { NextRequest, NextResponse } from 'next/server'

interface Node {
  id: string
  label: string
  type: string
  description?: string
}

interface Link {
  source: string
  target: string
  relation: string
  weight?: number
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''

    // Call the reconciliation API to get graph data
    const response = await fetch(`${RECONCILIATION_API_URL}/graph/${bookId}?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      throw new Error(`Reconciliation API returned ${response.status}`)
    }

  } catch (error) {
    const { bookId } = await params
    console.error(`Error getting graph for book ${bookId}:`, error)

    // Return mock data as fallback
    const mockData: GraphData = {
      nodes: [
        { id: 'protagonist', label: 'Protagoniste', type: 'Personnes', description: 'Personnage principal du livre' },
        { id: 'lieu_principal', label: 'Lieu Principal', type: 'Lieux', description: 'Lieu central de l\'action' },
        { id: 'theme_central', label: 'Thème Central', type: 'Concepts', description: 'Thème principal de l\'œuvre' },
        { id: 'antagonist', label: 'Antagoniste', type: 'Personnes', description: 'Force d\'opposition' },
        { id: 'symbole', label: 'Symbole', type: 'Concepts', description: 'Élément symbolique important' },
      ],
      links: [
        { source: 'protagonist', target: 'lieu_principal', relation: 'se trouve dans', weight: 0.8 },
        { source: 'protagonist', target: 'theme_central', relation: 'explore', weight: 0.9 },
        { source: 'protagonist', target: 'antagonist', relation: 'affronte', weight: 0.7 },
        { source: 'theme_central', target: 'symbole', relation: 'symbolisé par', weight: 0.6 },
      ]
    }

    return NextResponse.json(mockData)
  }
}