'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MentionCandidate } from '@/components/mentions/mention-candidate'
import { cn } from '@/lib/utils'

type MentionListboxProps = {
  listboxId: string
  matches: MentionCandidate[]
  selectedIndex: number
  onSelect: (candidate: MentionCandidate) => void
  onHover: (index: number) => void
  position: { top: number; left: number }
}

export function MentionListbox({
  listboxId,
  matches,
  selectedIndex,
  onSelect,
  onHover,
  position,
}: MentionListboxProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const style: CSSProperties = {
    top: position.top,
    left: position.left,
  }

  return createPortal(
    <div
      id={listboxId}
      role="listbox"
      tabIndex={-1}
      className="fixed z-50 max-h-60 min-w-36 overflow-y-auto rounded-lg border border-border-4 bg-card p-1 text-card-foreground shadow-md"
      style={style}
    >
      {matches.map((candidate, index) => (
        <button
          key={candidate.id}
          id={`${listboxId}-option-${index}`}
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={index === selectedIndex}
          className={cn(
            'flex w-full min-h-9 cursor-pointer items-center rounded-md p-3 text-left text-paragraph-small outline-hidden select-none',
            index === selectedIndex
              ? 'bg-secondary-hover text-foreground'
              : 'hover:bg-secondary-hover',
          )}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onSelect(candidate)
          }}
          onMouseEnter={() => onHover(index)}
        >
          @{candidate.displayName}
        </button>
      ))}
    </div>,
    document.body,
  )
}
