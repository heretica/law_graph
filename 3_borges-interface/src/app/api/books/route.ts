import { NextRequest, NextResponse } from 'next/server'

const RECONCILIATION_API_URL = process.env.NEXT_PUBLIC_RECONCILIATION_API_URL || 'https://reconciliation-api-production.up.railway.app'

export async function GET() {
  try {
    const response = await fetch(`${RECONCILIATION_API_URL}/books`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`)
    }

    const data = await response.json()

    // Transform the response to match frontend expectations
    const books = data.books.map((book: any) => ({
      id: book.id,
      name: book.name,
      title: book.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      has_data: true,
      stats: book.stats
    }))

    return NextResponse.json({
      books,
      count: data.count,
      success: data.success
    })

  } catch (error) {
    console.error('Error fetching books from reconciliation API:', error)

    // Return fallback books
    const fallbackBooks = [
      { id: 'a_rebours_huysmans', name: 'A Rebours Huysmans', title: 'À rebours', has_data: true },
      { id: 'chien_blanc_gary', name: 'Chien Blanc Gary', title: 'Chien blanc', has_data: true },
      { id: 'peau_bison_frison', name: 'Peau Bison Frison', title: 'Peau de bison', has_data: true },
      { id: 'policeman_decoin', name: 'Policeman Decoin', title: 'Policeman', has_data: true },
      { id: 'racines_ciel_gary', name: 'Racines Ciel Gary', title: 'Les Racines du ciel', has_data: true },
      { id: 'tilleul_soir_anglade', name: 'Tilleul Soir Anglade', title: 'Le Tilleul du soir', has_data: true },
      { id: 'vallee_sans_hommes_frison', name: 'Vallee Sans Hommes Frison', title: 'La Vallée sans hommes', has_data: true },
      { id: 'villa_triste_modiano', name: 'Villa Triste Modiano', title: 'Villa triste', has_data: true },
    ]

    return NextResponse.json({
      books: fallbackBooks,
      count: fallbackBooks.length,
      success: false
    })
  }
}