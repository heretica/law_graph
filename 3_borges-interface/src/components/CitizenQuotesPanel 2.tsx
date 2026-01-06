'use client'

import { useState, useMemo } from 'react'
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import ExpandableQuoteCard from './ExpandableQuoteCard'
import CommuneFilterChips from './CommuneFilterChips'

/**
 * CitizenQuotesPanel - Panel des Réponses Citoyennes
 *
 * Displays citizen quotes from source chunks with commune attribution
 * Supports filtering by commune and quote-to-graph highlighting
 *
 * Constitution Principle II: Civic Provenance Chain
 * Constitution Principle VIII: Mobile-First Responsiveness
 *
 * Feature: 001-interactive-graphrag-refinement
 * Task: T001
 */

export interface CitizenQuote {
  id: string
  text: string
  commune_id: string
  commune_name: string
  entity_ids: string[]
  chunk_id: string
}

interface CitizenQuotesPanelProps {
  /** Array of citizen quotes to display */
  quotes: CitizenQuote[]
  /** Callback when a quote is clicked - opens in graph */
  onQuoteClick?: (quoteId: string, entityIds: string[]) => void
  /** Callback when an entity within a quote is clicked */
  onEntityClick?: (entityId: string) => void
  /** Currently selected communes for filtering */
  selectedCommunes: string[]
  /** Callback when commune filter changes */
  onCommuneFilterChange?: (communeIds: string[]) => void
  /** Whether the panel is collapsed (desktop) */
  isCollapsed?: boolean
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void
  /** Currently highlighted entity ID (for bidirectional highlighting) */
  highlightedEntityId?: string | null
}

export default function CitizenQuotesPanel({
  quotes,
  onQuoteClick,
  onEntityClick,
  selectedCommunes,
  onCommuneFilterChange,
  isCollapsed = false,
  onToggleCollapse,
  highlightedEntityId
}: CitizenQuotesPanelProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // Filter quotes by selected communes
  const filteredQuotes = useMemo(() => {
    if (selectedCommunes.length === 0) {
      return quotes
    }
    return quotes.filter(quote => selectedCommunes.includes(quote.commune_id))
  }, [quotes, selectedCommunes])

  // Extract unique communes from quotes for filter chips
  const uniqueCommunes = useMemo(() => {
    const communeMap = new Map<string, { id: string; name: string }>()
    quotes.forEach(quote => {
      if (!communeMap.has(quote.commune_id)) {
        communeMap.set(quote.commune_id, {
          id: quote.commune_id,
          name: quote.commune_name
        })
      }
    })
    return Array.from(communeMap.values())
  }, [quotes])

  const handleQuoteCardClick = (quote: CitizenQuote) => {
    onQuoteClick?.(quote.id, quote.entity_ids)
  }

  const handleEntityClickInQuote = (entityId: string) => {
    onEntityClick?.(entityId)
  }

  if (quotes.length === 0) {
    return null // Don't show panel if no quotes available
  }

  return (
    <>
      {/* Desktop: Right sidebar panel */}
      <div className="hidden md:flex md:flex-col h-full bg-datack-black border-l border-datack-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-datack-border bg-datack-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-datack-light">
              Réponses Citoyennes
            </h2>
            <span className="text-xs text-datack-muted">
              ({filteredQuotes.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="p-1.5 hover:bg-datack-border/20 rounded transition-colors"
              aria-label="Toggle commune filter"
            >
              <Filter className="w-4 h-4 text-datack-yellow" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 hover:bg-datack-border/20 rounded transition-colors"
                aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {isCollapsed ? (
                  <ChevronUp className="w-4 h-4 text-datack-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-datack-muted" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Commune filter chips */}
        {isFilterExpanded && (
          <div className="px-4 py-3 border-b border-datack-border bg-datack-black/30">
            <CommuneFilterChips
              communes={uniqueCommunes}
              selectedCommunes={selectedCommunes}
              onSelectionChange={onCommuneFilterChange}
            />
          </div>
        )}

        {/* Scrollable quote list */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-datack-muted">
                  Aucune réponse citoyenne pour les communes sélectionnées
                </p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <ExpandableQuoteCard
                  key={quote.id}
                  quote={quote}
                  onClick={() => handleQuoteCardClick(quote)}
                  onEntityClick={handleEntityClickInQuote}
                  isHighlighted={quote.entity_ids.includes(highlightedEntityId || '')}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-datack-black border-t border-datack-border max-h-[70vh] flex flex-col">
        {/* Header - always visible */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-datack-border bg-datack-black/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-datack-light">
              Réponses Citoyennes
            </h2>
            <span className="text-xs text-datack-muted">
              ({filteredQuotes.length})
            </span>
          </div>
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="p-2 hover:bg-datack-border/20 rounded transition-colors"
            aria-label="Toggle filter"
          >
            <Filter className="w-5 h-5 text-datack-yellow" />
          </button>
        </div>

        {/* Commune filter chips - collapsible on mobile */}
        {isFilterExpanded && (
          <div className="px-4 py-3 border-b border-datack-border bg-datack-black/50 overflow-x-auto">
            <CommuneFilterChips
              communes={uniqueCommunes}
              selectedCommunes={selectedCommunes}
              onSelectionChange={onCommuneFilterChange}
            />
          </div>
        )}

        {/* Scrollable quote list - swipeable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-datack-muted">
                Aucune réponse citoyenne disponible
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <ExpandableQuoteCard
                key={quote.id}
                quote={quote}
                onClick={() => handleQuoteCardClick(quote)}
                onEntityClick={handleEntityClickInQuote}
                isHighlighted={quote.entity_ids.includes(highlightedEntityId || '')}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
