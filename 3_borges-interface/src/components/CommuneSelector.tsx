'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

/**
 * Commune Selector Component
 * Feature: Commune filtering for targeted queries
 *
 * Allows users to select one or multiple communes to narrow query focus
 * and enable comparative analysis between selected communes.
 *
 * Constitution Alignment:
 * - Principle #2: Commune-Centric Architecture
 * - Principle #3: Cross-Commune Analysis
 */

export interface Commune {
  id: string
  name: string
  entity_count?: number
}

interface CommuneSelectorProps {
  communes: Commune[]
  selectedCommunes: string[]
  onSelectionChange: (communeIds: string[]) => void
  disabled?: boolean
  className?: string
}

export default function CommuneSelector({
  communes,
  selectedCommunes,
  onSelectionChange,
  disabled = false,
  className = '',
}: CommuneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter communes by search
  const filteredCommunes = useMemo(() => {
    if (!searchFilter.trim()) return communes
    const search = searchFilter.toLowerCase()
    return communes.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.id.toLowerCase().includes(search)
    )
  }, [communes, searchFilter])

  // Toggle single commune selection
  const toggleCommune = (communeId: string) => {
    if (selectedCommunes.includes(communeId)) {
      onSelectionChange(selectedCommunes.filter(id => id !== communeId))
    } else {
      onSelectionChange([...selectedCommunes, communeId])
    }
  }

  // Toggle all communes
  const toggleAll = () => {
    if (selectedCommunes.length === communes.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(communes.map(c => c.id))
    }
  }

  // Clear selection
  const clearSelection = () => {
    onSelectionChange([])
    setSearchFilter('')
  }

  // Display text for the trigger button
  const displayText = useMemo(() => {
    if (selectedCommunes.length === 0) {
      return `Toutes (${communes.length})`
    } else if (selectedCommunes.length === 1) {
      const commune = communes.find(c => c.id === selectedCommunes[0])
      return commune?.name || selectedCommunes[0]
    } else if (selectedCommunes.length === communes.length) {
      return `Toutes (${communes.length})`
    } else {
      return `${selectedCommunes.length} communes`
    }
  }, [selectedCommunes, communes])

  const isAllSelected = selectedCommunes.length === communes.length

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-datack-dark border border-datack-border rounded-datack-sm
          text-sm text-datack-light
          hover:border-datack-yellow/50 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[140px] max-w-[200px]
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4 text-datack-yellow flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="truncate flex-1 text-left">{displayText}</span>
        <svg
          className={`w-4 h-4 text-datack-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-1 z-50
            w-72 max-h-80 overflow-hidden
            bg-datack-dark border border-datack-border rounded-datack-sm
            shadow-lg shadow-black/50
          "
        >
          {/* Search Filter */}
          <div className="p-2 border-b border-datack-border">
            <input
              type="text"
              placeholder="Filtrer les communes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="
                w-full px-3 py-2
                bg-datack-black border border-datack-border rounded-datack-sm
                text-sm text-datack-light placeholder-datack-muted
                focus:outline-none focus:border-datack-yellow/50
              "
              autoFocus
            />
          </div>

          {/* Select All / Clear */}
          <div className="px-2 py-1 border-b border-datack-border flex gap-2">
            <button
              type="button"
              onClick={toggleAll}
              className="
                flex-1 px-2 py-1.5 text-xs rounded-datack-sm
                text-datack-light hover:bg-datack-secondary transition-colors
                flex items-center gap-2
              "
            >
              <span className={`
                w-4 h-4 border rounded-sm flex items-center justify-center
                ${isAllSelected ? 'bg-datack-yellow border-datack-yellow' : 'border-datack-border'}
              `}>
                {isAllSelected && (
                  <svg className="w-3 h-3 text-datack-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              Toutes les communes
            </button>
            {selectedCommunes.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="
                  px-2 py-1.5 text-xs rounded-datack-sm
                  text-datack-muted hover:text-datack-light hover:bg-datack-secondary transition-colors
                "
                title="Effacer la sélection"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Commune List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCommunes.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-datack-muted">
                Aucune commune trouvée
              </div>
            ) : (
              filteredCommunes.map((commune) => {
                const isSelected = selectedCommunes.includes(commune.id)
                return (
                  <button
                    key={commune.id}
                    type="button"
                    onClick={() => toggleCommune(commune.id)}
                    className={`
                      w-full px-3 py-2 text-left text-sm
                      flex items-center gap-3
                      hover:bg-datack-secondary transition-colors
                      ${isSelected ? 'bg-datack-secondary/50' : ''}
                    `}
                  >
                    <span className={`
                      w-4 h-4 border rounded-sm flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-datack-yellow border-datack-yellow' : 'border-datack-border'}
                    `}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-datack-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`flex-1 ${isSelected ? 'text-datack-yellow' : 'text-datack-light'}`}>
                      {commune.name}
                    </span>
                    {commune.entity_count !== undefined && (
                      <span className="text-xs text-datack-muted">
                        {commune.entity_count} entités
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer - Selection count */}
          {selectedCommunes.length > 0 && selectedCommunes.length < communes.length && (
            <div className="px-3 py-2 border-t border-datack-border text-xs text-datack-muted">
              {selectedCommunes.length} commune{selectedCommunes.length > 1 ? 's' : ''} sélectionnée{selectedCommunes.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Mobile-optimized commune selector for the side menu
 */
export function CommuneSelectorMobile({
  communes,
  selectedCommunes,
  onSelectionChange,
  disabled = false,
}: CommuneSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const filteredCommunes = useMemo(() => {
    if (!searchFilter.trim()) return communes
    const search = searchFilter.toLowerCase()
    return communes.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.id.toLowerCase().includes(search)
    )
  }, [communes, searchFilter])

  const toggleCommune = (communeId: string) => {
    if (selectedCommunes.includes(communeId)) {
      onSelectionChange(selectedCommunes.filter(id => id !== communeId))
    } else {
      onSelectionChange([...selectedCommunes, communeId])
    }
  }

  const toggleAll = () => {
    if (selectedCommunes.length === communes.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(communes.map(c => c.id))
    }
  }

  const selectionLabel = useMemo(() => {
    if (selectedCommunes.length === 0 || selectedCommunes.length === communes.length) {
      return `Toutes les communes (${communes.length})`
    }
    return `${selectedCommunes.length} commune${selectedCommunes.length > 1 ? 's' : ''} sélectionnée${selectedCommunes.length > 1 ? 's' : ''}`
  }, [selectedCommunes, communes])

  return (
    <div className="mobile-nav-item">
      <label className="text-datack-gray text-sm mb-2 block">Communes</label>

      {/* Accordion Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="
          w-full text-left text-datack-light text-sm
          bg-datack-dark p-3 rounded-datack-sm
          border border-datack-border
          flex items-center justify-between
          disabled:opacity-50
        "
      >
        <span>{selectionLabel}</span>
        <svg
          className={`w-5 h-5 text-datack-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded List */}
      {isExpanded && (
        <div className="mt-2 bg-datack-dark rounded-datack-sm border border-datack-border overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-datack-border">
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="
                w-full px-3 py-2
                bg-datack-black border border-datack-border rounded-datack-sm
                text-sm text-datack-light placeholder-datack-muted
                focus:outline-none focus:border-datack-yellow/50
              "
            />
          </div>

          {/* Select All */}
          <button
            type="button"
            onClick={toggleAll}
            className="
              w-full px-3 py-3 text-left text-sm
              flex items-center gap-3 border-b border-datack-border
              hover:bg-datack-secondary transition-colors
            "
          >
            <span className={`
              w-5 h-5 border rounded-sm flex items-center justify-center
              ${selectedCommunes.length === communes.length ? 'bg-datack-yellow border-datack-yellow' : 'border-datack-border'}
            `}>
              {selectedCommunes.length === communes.length && (
                <svg className="w-3 h-3 text-datack-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-datack-light">Toutes les communes</span>
          </button>

          {/* Scrollable List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCommunes.map((commune) => {
              const isSelected = selectedCommunes.includes(commune.id)
              return (
                <button
                  key={commune.id}
                  type="button"
                  onClick={() => toggleCommune(commune.id)}
                  className={`
                    w-full px-3 py-3 text-left text-sm
                    flex items-center gap-3
                    hover:bg-datack-secondary transition-colors
                    ${isSelected ? 'bg-datack-secondary/50' : ''}
                  `}
                >
                  <span className={`
                    w-5 h-5 border rounded-sm flex items-center justify-center
                    ${isSelected ? 'bg-datack-yellow border-datack-yellow' : 'border-datack-border'}
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-datack-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={isSelected ? 'text-datack-yellow' : 'text-datack-light'}>
                    {commune.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
