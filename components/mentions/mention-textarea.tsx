'use client'

import {
  type KeyboardEvent,
  type KeyboardEventHandler,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { MentionCandidate } from '@/components/mentions/mention-candidate'
import { MentionListbox } from '@/components/mentions/mention-listbox'
import { Textarea } from '@/components/ui/textarea'
import {
  filterMentionCandidates,
  mentionQueryBeforeCursor,
  mentionReplacement,
  mentionTokenBeforeCursor,
  selectedMentionIdsInBody,
} from '@/lib/mentions/mention-query'

export type { MentionCandidate } from '@/components/mentions/mention-candidate'

type MentionTextareaProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onSubmit?: () => void
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  loadCandidates: () => Promise<MentionCandidate[]>
  placeholder: string
  id?: string
  name?: string
  rows?: number
  disabled?: boolean
  ariaInvalid?: boolean
  className?: string
}

function isModEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing
}

export function MentionTextarea({
  value,
  onChange,
  onBlur,
  onSubmit,
  onKeyDown,
  selectedIds,
  onSelectedIdsChange,
  loadCandidates,
  placeholder,
  id,
  name = 'body',
  rows = 4,
  disabled = false,
  ariaInvalid = false,
  className,
}: MentionTextareaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const defaultId = useId()
  const listboxId = useId()
  const [candidates, setCandidates] = useState<MentionCandidate[]>([])
  const [cursor, setCursor] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    void loadCandidates()
      .then(setCandidates)
      .catch(() => setCandidates([]))
  }, [loadCandidates])

  const query = mentionQueryBeforeCursor(value.slice(0, cursor))
  const matches = useMemo(
    () => (query === undefined ? [] : filterMentionCandidates(candidates, query)),
    [candidates, query],
  )
  const isOpen = matches.length > 0 && query !== dismissedQuery
  const selectedIndex = matches.length === 0 ? 0 : activeIndex % matches.length

  useLayoutEffect(() => {
    if (!isOpen) return
    const rect = inputRef.current?.getBoundingClientRect()
    if (!rect) return
    setPopupPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 180),
    })
  }, [isOpen])

  function updateValue(nextValue: string, nextCursor: number) {
    onChange(nextValue)
    setCursor(nextCursor)
    setActiveIndex(0)
    setDismissedQuery(null)
    onSelectedIdsChange(selectedMentionIdsInBody(selectedIds, candidates, nextValue))
  }

  function selectCandidate(candidate: MentionCandidate) {
    const beforeCursor = value.slice(0, cursor)
    const token = mentionTokenBeforeCursor(beforeCursor)
    if (!token) return
    const start = beforeCursor.length - token.length
    const inserted = mentionReplacement(candidate.displayName)
    const nextValue = `${value.slice(0, start)}${inserted}${value.slice(cursor)}`
    const nextCursor = start + inserted.length
    onChange(nextValue)
    onSelectedIdsChange([...new Set([...selectedIds, candidate.id])])
    setCursor(nextCursor)
    setActiveIndex(0)
    setDismissedQuery(query ?? null)
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(nextCursor, nextCursor))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isModEnter(event)) {
      event.preventDefault()
      if (!disabled) {
        if (onSubmit) {
          onSubmit()
        } else {
          onKeyDown?.(event)
        }
      }
      return
    }

    if (isOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % matches.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + matches.length) % matches.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const candidate = matches[selectedIndex]
        if (candidate) selectCandidate(candidate)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setDismissedQuery(query ?? null)
        return
      }
    }

    onKeyDown?.(event)
  }

  return (
    <div className="relative">
      <Textarea
        ref={inputRef}
        id={id ?? defaultId}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={className}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen ? `${listboxId}-option-${selectedIndex}` : undefined}
        aria-invalid={ariaInvalid}
        onChange={(event) => updateValue(event.target.value, event.target.selectionStart)}
        onClick={(event) => setCursor(event.currentTarget.selectionStart)}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
        onBlur={onBlur}
      />
      {isOpen && (
        <MentionListbox
          listboxId={listboxId}
          matches={matches}
          selectedIndex={selectedIndex}
          onSelect={selectCandidate}
          onHover={setActiveIndex}
          position={popupPosition}
        />
      )}
    </div>
  )
}
