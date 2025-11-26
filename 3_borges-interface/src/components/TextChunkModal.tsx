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
      className="borges-modal-overlay flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-borges-dark border border-borges-border shadow-borges-lg overflow-hidden">

        {/* Header - Basile Minimalism */}
        <div className="flex items-center justify-between p-6 border-b border-borges-border bg-borges-secondary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-h2 text-borges-light">
                Source Text
              </h2>
            </div>

            {bookId && (
              <div className="text-sm text-borges-light-muted">
                <span className="text-borges-accent">{bookId}</span>
                {chunkId && <span className="text-borges-muted ml-2">• {chunkId}</span>}
              </div>
            )}
          </div>

          {/* Relationship info if available */}
          {relationshipInfo && (
            <div className="hidden md:flex items-center gap-2 text-sm text-borges-light-muted">
              <span className="text-borges-light">{relationshipInfo.sourceNode}</span>
              <span className="text-borges-muted">→</span>
              <span className="text-borges-light">{relationshipInfo.targetNode}</span>
              <span className="text-borges-muted ml-2">({relationshipInfo.relationType})</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="borges-btn-ghost p-2 hover:bg-borges-dark-hover rounded-borges-sm transition-all"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">

            {/* Pipeline Traceability - Basile Minimalism */}
            <div className="mb-6 p-4 bg-borges-secondary rounded-borges-md border-l-4 border-borges-accent">
              <h3 className="text-sm font-medium text-borges-light-muted mb-2">Traceability Pipeline</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-borges-dark text-borges-light px-2 py-1 rounded-borges-sm">Source Text</span>
                <span className="text-borges-muted">→</span>
                <span className="bg-borges-dark text-borges-light px-2 py-1 rounded-borges-sm">GraphRAG</span>
                <span className="text-borges-muted">→</span>
                <span className="bg-borges-dark text-borges-light px-2 py-1 rounded-borges-sm">Neo4j</span>
                <span className="text-borges-muted">→</span>
                <span className="bg-borges-dark text-borges-accent px-2 py-1 rounded-borges-sm">3D Visualization</span>
              </div>
            </div>

            {/* Main Text Content with Entity Highlighting */}
            <div className="bg-borges-dark rounded-borges-md p-6 border border-borges-border">
              <div className="text-lg leading-relaxed text-borges-light">
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

            {/* Metadata - Basile Minimalism */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-borges-secondary p-4 rounded-borges-sm border border-borges-border">
                <h4 className="text-borges-muted mb-1">Length</h4>
                <p className="text-borges-light">{chunkText.length} characters</p>
              </div>

              <div className="bg-borges-secondary p-4 rounded-borges-sm border border-borges-border">
                <h4 className="text-borges-muted mb-1">Detected Entities</h4>
                <p className="text-borges-light">{entities.length} entities</p>
              </div>

              <div className="bg-borges-secondary p-4 rounded-borges-sm border border-borges-border">
                <h4 className="text-borges-muted mb-1">Source</h4>
                <p className="text-borges-light">{bookId || 'Unknown book'}</p>
              </div>
            </div>

            {/* Instructions - Basile Minimalism: no emoji */}
            <div className="mt-6 text-xs text-borges-muted text-center">
              <p>Click highlighted entities to explore their connections in the 3D graph</p>
              <p>Press Escape or click outside to close</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render through portal
  return createPortal(modal, document.body)
}