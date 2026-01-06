'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import HighlightedText from './HighlightedText'
import type { CitizenQuote } from './CitizenQuotesPanel'

/**
 * ExpandableQuoteCard - Individual citizen quote card
 *
 * Displays citizen text with expand/collapse functionality
 * Highlights entities mentioned in the quote
 * Shows commune badge and entity count
 *
 * Constitution Principle II: Civic Provenance Chain
 * Constitution Principle VIII: Mobile-First Responsiveness (44x44px touch targets)
 *
 * Feature: 001-interactive-graphrag-refinement
 * Task: T003
 */

interface ExpandableQuoteCardProps {
  /** Citizen quote data */
  quote: CitizenQuote
  /** Callback when card is clicked (not expanded/collapsed) */
  onClick?: () => void
  /** Callback when an entity mention is clicked */
  onEntityClick?: (entityId: string) => void
  /** Whether this quote card should be visually highlighted */
  isHighlighted?: boolean
}

export default function ExpandableQuoteCard({
  quote,
  onClick,
  onEntityClick,
  isHighlighted = false
}: ExpandableQuoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onClick
    setIsExpanded(!isExpanded)
  }

  const handleCardClick = () => {
    onClick?.()
  }

  // Truncate text for collapsed state (first 2 lines ~ 100 chars)
  const truncatedText = quote.text.length > 100
    ? quote.text.slice(0, 100) + '...'
    : quote.text

  return (
    <div
      className={`
        group relative bg-datack-black/50 border rounded-lg overflow-hidden
        transition-all duration-200
        hover:border-datack-yellow/40 hover:bg-datack-black/70
        ${isHighlighted ? 'border-datack-yellow/60 bg-datack-yellow/5' : 'border-datack-border'}
      `}
    >
      {/* Commune badge - always visible */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-datack-border/50 bg-datack-black/30">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-datack-secondary border border-datack-border rounded text-xs">
            <MapPin className="w-3 h-3 text-datack-muted" />
            <span className="text-datack-light font-medium">
              {quote.commune_name}
            </span>
          </div>
          {quote.entity_ids.length > 0 && (
            <span className="text-xs text-datack-muted">
              {quote.entity_ids.length} {quote.entity_ids.length === 1 ? 'entité' : 'entités'}
            </span>
          )}
        </div>

        {/* Expand/Collapse button - 44x44px touch target */}
        <button
          onClick={handleToggleExpand}
          className="p-2 hover:bg-datack-border/20 rounded transition-colors touch-manipulation"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={isExpanded ? "Collapse quote" : "Expand quote"}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-datack-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-datack-muted" />
          )}
        </button>
      </div>

      {/* Quote text - clickable to focus in graph */}
      <div
        onClick={handleCardClick}
        className="px-3 py-3 cursor-pointer"
      >
        {isExpanded ? (
          // Expanded: Full text - TODO: Add entity highlighting when entity data structure is available
          <div className="text-sm text-datack-muted leading-relaxed whitespace-pre-wrap">
            {quote.text}
          </div>
        ) : (
          // Collapsed: Truncated text, plain
          <p className="text-sm text-datack-muted leading-relaxed line-clamp-2">
            {truncatedText}
          </p>
        )}
      </div>

      {/* Highlight indicator (left border accent) */}
      {isHighlighted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-datack-yellow" />
      )}

      {/* Click-through hint on hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-datack-yellow/70">
          Cliquer pour localiser dans le graphe
        </span>
      </div>
    </div>
  )
}
