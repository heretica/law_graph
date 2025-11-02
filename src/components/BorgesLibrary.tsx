'use client'

import { useState, useEffect } from 'react'
import BookSelector from './BookSelector'
import GraphVisualization from './GraphVisualization'
import QueryInterface from './QueryInterface'
import { reconciliationService } from '@/lib/services/reconciliation'

interface Book {
  id: string
  title: string
  author: string
  graphData?: any
  has_data?: boolean
}

interface Neo4jGraphData {
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, any>;
    degree: number;
    centrality_score: number;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    source: string;
    target: string;
    properties: Record<string, any>;
  }>;
}

export default function BorgesLibrary() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [neo4jGraphData, setNeo4jGraphData] = useState<Neo4jGraphData | null>(null)
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([])

  useEffect(() => {
    loadBooks()
    loadNeo4jGraph()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBooks = async () => {
    try {
      const data = await reconciliationService.getBooks()
      const booksWithAuthors = data.books.map(book => ({
        id: book.id,
        title: book.name,
        author: extractAuthorFromId(book.id),
        has_data: book.has_data
      }))
      setBooks(booksWithAuthors)
    } catch (error) {
      console.error('Error loading books:', error)
      // Fallback with mock data
      setBooks([
        { id: 'vallee_sans_hommes_frison', title: 'La Vallée sans hommes', author: 'Frison' },
        { id: 'racines_ciel_gary', title: 'Les Racines du ciel', author: 'Romain Gary' },
        { id: 'policeman_decoin', title: 'Policeman', author: 'Decoin' },
        { id: 'a_rebours_huysmans', title: 'À rebours', author: 'Huysmans' },
        { id: 'chien_blanc_gary', title: 'Chien blanc', author: 'Romain Gary' },
        { id: 'peau_bison_frison', title: 'Peau de bison', author: 'Frison' },
        { id: 'tilleul_soir_anglade', title: 'Le Tilleul du soir', author: 'Anglade' },
        { id: 'villa_triste_modiano', title: 'Villa triste', author: 'Modiano' },
      ])
    } finally {
      setIsLoadingBooks(false)
    }
  }

  const loadNeo4jGraph = async () => {
    setIsLoadingGraph(true)
    try {
      const nodesData = await reconciliationService.getNodes({ limit: 300 })
      if (nodesData.success && nodesData.nodes.length > 0) {
        const nodeIds = nodesData.nodes.map(node => node.id)
        const relationshipsData = await reconciliationService.getRelationships(nodeIds)

        setNeo4jGraphData({
          nodes: nodesData.nodes,
          relationships: relationshipsData.success ? relationshipsData.relationships : []
        })

        // Set initial visible nodes (top 50 by centrality)
        const topNodes = nodesData.nodes.slice(0, 50).map(node => node.id)
        setVisibleNodeIds(topNodes)
      }
    } catch (error) {
      console.error('Error loading Neo4j graph:', error)
    } finally {
      setIsLoadingGraph(false)
    }
  }

  const extractAuthorFromId = (bookId: string): string => {
    const parts = bookId.split('_')
    const author = parts[parts.length - 1]
    return author.charAt(0).toUpperCase() + author.slice(1)
  }

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book)
  }

  return (
    <div className="min-h-screen bg-borges-dark text-borges-light">
      {/* Header */}
      <header className="p-6 border-b border-borges-secondary">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-light tracking-wide">
            🏛️ Bibliothèque de Borges
          </h1>
          <p className="text-gray-400 mt-2">
            Une exploration interactive des connexions infinies entre les livres
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Book Selection */}
          <div className="lg:col-span-1">
            <BookSelector
              books={books}
              selectedBook={selectedBook}
              onBookSelect={handleBookSelect}
              isLoading={isLoadingBooks}
            />
          </div>

          {/* Graph Visualization */}
          <div className="lg:col-span-2">
            <div className="h-full bg-borges-secondary rounded-lg flex flex-col">
              {neo4jGraphData ? (
                <>
                  {/* Query Bar */}
                  <div className="p-4 border-b border-gray-600">
                    <QueryInterface
                      selectedBook={selectedBook}
                      visibleNodeIds={visibleNodeIds}
                    />
                  </div>
                  {/* Graph */}
                  <div className="flex-1">
                    <GraphVisualization
                      book={selectedBook}
                      neo4jGraphData={neo4jGraphData}
                      isLoadingGraph={isLoadingGraph}
                      onNodeVisibilityChange={setVisibleNodeIds}
                    />
                  </div>
                </>
              ) : isLoadingGraph ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🔄</div>
                    <p className="text-xl">Chargement du graphe de connaissances...</p>
                    <p className="text-sm mt-2 opacity-75">
                      Connexion à Neo4j et récupération des données
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-xl">Explorez le graphe de connaissances</p>
                    <p className="text-sm mt-2 opacity-75">
                      {neo4jGraphData?.nodes.length || 0} entités • {neo4jGraphData?.relationships.length || 0} relations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}