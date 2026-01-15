'use client'

import { useState } from 'react'

interface ExpandableQuoteCardProps {
  quote: string
  index: number
  isActive: boolean
}

export default function ExpandableQuoteCard({ quote, index, isActive }: ExpandableQuoteCardProps) {
  return (
    <div
      className={`
        transition-all duration-700 ease-in-out
        ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'}
      `}
    >
      <div className={`
        p-4 rounded-lg
        bg-datack-secondary
        border border-datack-border
        ${isActive ? 'border-datack-yellow' : 'border-datack-border'}
      `}>
        <p className="text-datack-light italic text-sm leading-relaxed">
          {quote}
        </p>
      </div>
    </div>
  )
}
