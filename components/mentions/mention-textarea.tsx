'use client'

import {
  type KeyboardEvent,
  type KeyboardEventHandler,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type MentionCandidate = { id: string; displayName: string }

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

  useEffect(() => {
    void loadCandidates()
      .then(setCandidates)
      .catch(() => setCandidates([]))
  }, [loadCandidates])

  const query = value.slice(0, cursor).match(/(?:^|\s)@([^\s@]*)$/)?.[1]
  const matches = useMemo(
    () =>
      query === undefined
        ? []
        : candidates.filter((candidate) => candidate.displayName.includes(query)).slice(0, 8),
    [candidates, query],
  )
  const isOpen = matches.length > 0 && query !== dismissedQuery

  function updateValue(nextValue: string, nextCursor: number) {
    onChange(nextValue)
    setCursor(nextCursor)
    setActiveIndex(0)
    setDismissedQuery(null)
    onSelectedIdsChange(
      selectedIds.filter((id) => {
        const candidate = candidates.find((item) => item.id === id)
        return candidate && nextValue.includes(`@${candidate.displayName}`)
      }),
    )
  }

  function selectCandidate(candidate: MentionCandidate) {
    const beforeCursor = value.slice(0, cursor)
    const at = beforeCursor.lastIndexOf('@')
    const inserted = `@${candidate.displayName} `
    const nextValue = `${value.slice(0, at)}${inserted}${value.slice(cursor)}`
    const nextCursor = at + inserted.length
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
        selectCandidate(matches[activeIndex])
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
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-invalid={ariaInvalid}
        onChange={(event) => updateValue(event.target.value, event.target.selectionStart)}
        onClick={(event) => setCursor(event.currentTarget.selectionStart)}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
        onBlur={onBlur}
      />
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
        >
          {matches.map((candidate, index) => (
            <button
              key={candidate.id}
              id={`${listboxId}-option-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              className={cn(
                'cursor-pointer px-3 py-2 text-left text-paragraph-small hover:bg-accent',
                index === activeIndex && 'bg-accent',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectCandidate(candidate)}
            >
              @{candidate.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
