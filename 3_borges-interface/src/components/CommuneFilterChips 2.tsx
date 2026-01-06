'use client'

import { X } from 'lucide-react'

/**
 * CommuneFilterChips - Filterable commune chips for CitizenQuotesPanel
 *
 * Displays commune names as removable chips for filtering citizen quotes
 * Shows "All communes (N)" when no filter is active
 *
 * Constitution Principle IV: Commune-Centric Architecture
 * Constitution Principle VIII: Mobile-First Responsiveness (horizontal scroll)
 *
 * Feature: 001-interactive-graphrag-refinement
 * Task: T002
 */

interface Commune {
  id: string
  name: string
}

interface CommuneFilterChipsProps {
  /** Available communes to filter by */
  communes: Commune[]
  /** Currently selected commune IDs */
  selectedCommunes: string[]
  /** Callback when selection changes */
  onSelectionChange?: (communeIds: string[]) => void
}

export default function CommuneFilterChips({
  communes,
  selectedCommunes,
  onSelectionChange
}: CommuneFilterChipsProps) {
  const handleToggleCommune = (communeId: string) => {
    if (selectedCommunes.includes(communeId)) {
      // Remove commune from selection
      onSelectionChange?.(selectedCommunes.filter(id => id !== communeId))
    } else {
      // Add commune to selection
      onSelectionChange?.([...selectedCommunes, communeId])
    }
  }

  const handleClearAll = () => {
    onSelectionChange?.([])
  }

  const selectedCommuneNames = communes
    .filter(c => selectedCommunes.includes(c.id))
    .map(c => c.name)

  // If no communes selected, show "All communes" chip
  if (selectedCommunes.length === 0) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-datack-secondary border border-datack-border rounded-full text-xs">
          <span className="text-datack-light font-medium">
            Toutes les communes ({communes.length})
          </span>
        </div>
        <button
          onClick={() => {
            // Show commune selection dropdown or toggle first few communes
            if (communes.length > 0) {
              onSelectionChange?.([communes[0].id])
            }
          }}
          className="text-xs text-datack-muted hover:text-datack-yellow transition-colors"
        >
          Filtrer par commune
        </button>
      </div>
    )
  }

  // Show selected commune chips (max 3 visible, then "+N more")
  const visibleChips = selectedCommuneNames.slice(0, 3)
  const overflowCount = selectedCommuneNames.length - 3

  return (
    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap overflow-x-auto">
      {/* Mobile: horizontal scrollable */}
      <div className="flex items-center gap-2 md:flex-wrap overflow-x-auto no-scrollbar">
        {visibleChips.map((name) => {
          const commune = communes.find(c => c.name === name)
          if (!commune) return null

          return (
            <div
              key={commune.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-datack-secondary border border-datack-border rounded-full text-xs whitespace-nowrap flex-shrink-0"
            >
              <span className="text-datack-light font-medium">{name}</span>
              <button
                onClick={() => handleToggleCommune(commune.id)}
                className="hover:bg-datack-border/50 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${name} filter`}
              >
                <X className="w-3 h-3 text-datack-muted" />
              </button>
            </div>
          )
        })}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div className="inline-flex items-center px-3 py-1.5 bg-datack-border/20 border border-datack-border rounded-full text-xs whitespace-nowrap flex-shrink-0">
            <span className="text-datack-muted">+{overflowCount} more</span>
          </div>
        )}
      </div>

      {/* Clear all button */}
      <button
        onClick={handleClearAll}
        className="text-xs text-datack-muted hover:text-datack-yellow transition-colors whitespace-nowrap flex-shrink-0"
      >
        Effacer tout
      </button>

      {/* CSS for hiding scrollbar while maintaining scroll functionality */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
