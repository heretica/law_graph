'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import HighlightedText from './HighlightedText'

interface EntityMatch {
  id: string
  type: string
  color: string
  score: number
  description?: string
}

interface TextChunkModalProps {
  isOpen: boolean
  onClose: () => void
  chunkText: string
  bookId?: string
  chunkId?: string
  entities?: EntityMatch[]
  relationshipInfo?: {
    sourceNode: string
    targetNode: string
    relationType: string
  }
}

/**
 * Modal full-screen pour afficher les chunks de texte avec highlighting des entités
 * Principe d'interprétabilité bout-en-bout : navigation du chunk source vers la visualisation 3D
 * Design Borges dark theme pour l'immersion
 */
export default function TextChunkModal({
  isOpen,
  onClose,
  chunkText,
  bookId,
  chunkId,
  entities = [],
  relationshipInfo
}: TextChunkModalProps) {
  const [mounted, setMounted] = useState(false)

  // Handle portal mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  // Don't render if not mounted (SSR safety) or not open
  if (!mounted || !isOpen) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEntityClick = (entity: EntityMatch) => {
    console.log('🎯 Entity clicked in TextChunkModal:', entity)
    // TODO: Implement navigation to entity in 3D graph
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-borges-dark border border-borges-accent shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-borges-secondary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-borges-accent rounded-full"></div>
              <h2 className="text-xl font-semibold text-white font-borges">
                📚 Source Textuelle
              </h2>
            </div>

            {bookId && (
              <div className="text-sm text-gray-300">
                <span className="text-borges-accent">{bookId}</span>
                {chunkId && <span className="text-gray-500 ml-2">• {chunkId}</span>}
              </div>
            )}
          </div>

          {/* Relationship info if available */}
          {relationshipInfo && (
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <span className="text-blue-300">{relationshipInfo.sourceNode}</span>
              <span className="text-gray-500">→</span>
              <span className="text-purple-300">{relationshipInfo.targetNode}</span>
              <span className="text-gray-600 ml-2">({relationshipInfo.relationType})</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
            title="Fermer (Échap)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">

            {/* Pipeline Traceability */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border-l-4 border-borges-accent">
              <h3 className="text-sm font-medium text-gray-300 mb-2">🔗 Pipeline de Traçabilité</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded">Texte Source</span>
                <span className="text-gray-500">→</span>
                <span className="bg-green-900 text-green-200 px-2 py-1 rounded">GraphRAG</span>
                <span className="text-gray-500">→</span>
                <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded">Neo4j</span>
                <span className="text-gray-500">→</span>
                <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded">Visualisation 3D</span>
              </div>
            </div>

            {/* Main Text Content with Entity Highlighting */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="text-lg leading-relaxed text-gray-100 font-borges">
                {entities.length > 0 ? (
                  <HighlightedText
                    text={chunkText}
                    entities={entities}
                    onEntityClick={handleEntityClick}
                    showTooltip={true}
                    className="leading-loose text-lg"
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{chunkText}</div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-gray-400 mb-1">Longueur</h4>
                <p className="text-white">{chunkText.length} caractères</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-gray-400 mb-1">Entités Détectées</h4>
                <p className="text-white">{entities.length} entités</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-gray-400 mb-1">Source</h4>
                <p className="text-white">{bookId || 'Livre inconnu'}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 text-xs text-gray-500 text-center">
              <p>💡 Cliquez sur les entités surlignées pour explorer leurs connexions dans le graphe 3D</p>
              <p>🔒 Appuyez sur Échap ou cliquez à l&apos;extérieur pour fermer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render through portal
  return createPortal(modal, document.body)
}