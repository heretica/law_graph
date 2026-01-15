'use client'

import { XMarkIcon } from '@heroicons/react/24/solid'

export interface Commune {
  id: string
  name: string
  entity_count?: number
}

interface CommuneFilterChipsProps {
  selectedCommunes: string[]
  availableCommunes: Commune[]
  onRemove: (communeId: string) => void
  maxCommunes?: number
}

export default function CommuneFilterChips({
  selectedCommunes,
  availableCommunes,
  onRemove,
  maxCommunes = 50
}: CommuneFilterChipsProps) {
  // If no communes selected or all selected, show "all" chip
  if (selectedCommunes.length === 0 || selectedCommunes.length === maxCommunes) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-datack-secondary border border-datack-border rounded-full text-xs">
          <span className="text-datack-light font-medium">
            Toutes les communes ({maxCommunes})
          </span>
        </div>
      </div>
    )
  }

  // Get commune objects for selected IDs
  const selectedCommuneObjects = availableCommunes.filter(c =>
    selectedCommunes.includes(c.id)
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {selectedCommuneObjects.map((commune) => (
        <div
          key={commune.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-datack-secondary border border-datack-border rounded-full text-xs group hover:border-datack-yellow transition-colors"
        >
          <span className="text-datack-light font-medium">
            {commune.name}
          </span>
          <button
            onClick={() => onRemove(commune.id)}
            className="p-0.5 hover:bg-datack-border rounded-full transition-colors"
            aria-label={`Retirer ${commune.name}`}
          >
            <XMarkIcon className="w-3 h-3 text-datack-muted group-hover:text-datack-yellow transition-colors" />
          </button>
        </div>
      ))}
    </div>
  )
}
