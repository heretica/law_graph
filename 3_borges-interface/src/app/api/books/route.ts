import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const RAILWAY_API_URL = 'https://comfortable-gentleness-production-8603.up.railway.app'

function extractAuthorFromTitle(bookName: string): string {
  const parts = bookName.split('_')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1]
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).toLowerCase()
  }
  return 'Auteur inconnu'
}

export async function GET() {
  try {
    // Try to fetch books from Railway API first
    try {
      const response = await fetch(`${RAILWAY_API_URL}/books`, {
        next: { revalidate: 300 } // Cache for 5 minutes
      })
      if (response.ok) {
        const data = await response.json()
        // Transform Railway API response to match our format
        const books = data.books.map((book: any) => ({
          id: book.id,
          title: book.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          author: extractAuthorFromTitle(book.name),
          has_data: book.has_data,
          source: 'railway'
        }))
        return NextResponse.json(books)
      }
    } catch (railwayError) {
      console.warn('Railway API unavailable, checking local files:', railwayError)
    }

    // Fallback to local file checking
    const booksPath = path.join(process.cwd(), '..', '..', '..', 'nano-graphrag')
    const expectedBooks = [
      { id: 'vallee_sans_hommes_frison', title: 'La Vallée sans hommes', author: 'Frison' },
      { id: 'racines_ciel_gary', title: 'Les Racines du ciel', author: 'Romain Gary' },
      { id: 'policeman_decoin', title: 'Policeman', author: 'Decoin' },
      { id: 'a_rebours_huysmans', title: 'À rebours', author: 'Huysmans' },
      { id: 'chien_blanc_gary', title: 'Chien blanc', author: 'Romain Gary' },
      { id: 'peau_bison_frison', title: 'Peau de bison', author: 'Frison' },
      { id: 'tilleul_soir_anglade', title: 'Le Tilleul du soir', author: 'Anglade' },
      { id: 'villa_triste_modiano', title: 'Villa triste', author: 'Modiano' },
    ]

    const availableBooks = []

    for (const book of expectedBooks) {
      try {
        const bookPath = path.join(booksPath, book.id)
        const graphmlPath = path.join(bookPath, 'graph_chunk_entity_relation.graphml')
        await fs.access(graphmlPath)
        availableBooks.push({ ...book, has_data: true, source: 'local' })
      } catch (error) {
        console.log(`Book data not found for: ${book.id}`)
        // Still include the book but mark as no data available
        availableBooks.push({ ...book, has_data: false, source: 'fallback' })
      }
    }

    return NextResponse.json(availableBooks)

  } catch (error) {
    console.error('Error listing books:', error)

    // Return expected books as fallback
    const fallbackBooks = [
      { id: 'vallee_sans_hommes_frison', title: 'La Vallée sans hommes', author: 'Frison' },
      { id: 'racines_ciel_gary', title: 'Les Racines du ciel', author: 'Romain Gary' },
      { id: 'policeman_decoin', title: 'Policeman', author: 'Decoin' },
      { id: 'a_rebours_huysmans', title: 'À rebours', author: 'Huysmans' },
      { id: 'chien_blanc_gary', title: 'Chien blanc', author: 'Romain Gary' },
      { id: 'peau_bison_frison', title: 'Peau de bison', author: 'Frison' },
      { id: 'tilleul_soir_anglade', title: 'Le Tilleul du soir', author: 'Anglade' },
      { id: 'villa_triste_modiano', title: 'Villa triste', author: 'Modiano' },
    ]

    return NextResponse.json(fallbackBooks)
  }
}