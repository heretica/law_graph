import { NextRequest, NextResponse } from 'next/server'

const RAILWAY_API_URL = 'https://borgesgraph-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { book_id, query } = body

    if (!book_id || !query) {
      return NextResponse.json(
        { error: 'book_id and query are required' },
        { status: 400 }
      )
    }

    // Try to forward the request to the Railway API first
    try {
      const response = await fetch(`${RAILWAY_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id,
          query,
          mode: 'local'  // Using local search mode by default
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          answer: data.answer || data.result || 'Pas de réponse disponible',
          book_id,
          query,
          timestamp: new Date().toISOString(),
          source: 'railway'
        })
      }
    } catch (railwayError) {
      console.warn('Railway API unavailable, using mock response:', railwayError)
    }

    // Fallback to mock response if Railway API is unavailable
    const mockResponse = `Voici une réponse simulée pour la question "${query}" sur le livre "${book_id}".

L'analyse littéraire révèle des thèmes profonds et des connexions complexes entre les personnages. Cette œuvre explore les relations humaines et les transformations psychologiques des protagonistes.

(Note: Cette réponse est simulée car l'API GraphRAG n'est pas disponible pour le moment)`

    return NextResponse.json({
      answer: mockResponse,
      book_id,
      query,
      timestamp: new Date().toISOString(),
      source: 'mock'
    })

  } catch (error) {
    console.error('Error querying GraphRAG:', error)

    // Return a fallback response
    return NextResponse.json(
      {
        error: 'Erreur lors de la requête GraphRAG',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}