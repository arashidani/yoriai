'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

export type MentionCandidate = { id: string; displayName: string }

type MentionTextareaProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  loadCandidates: () => Promise<MentionCandidate[]>
  placeholder: string
  rows?: number
  disabled?: boolean
  ariaInvalid?: boolean
}

export function MentionTextarea({
  value,
  onChange,
  onBlur,
  selectedIds,
  onSelectedIdsChange,
  loadCandidates,
  placeholder,
  rows = 4,
  disabled = false,
  ariaInvalid = false,
}: MentionTextareaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [candidates, setCandidates] = useState<MentionCandidate[]>([])
  const [cursor, setCursor] = useState(0)

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

  function updateValue(nextValue: string, nextCursor: number) {
    onChange(nextValue)
    setCursor(nextCursor)
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
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(nextCursor, nextCursor))
  }

  return (
    <div className="relative">
      <Textarea
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        aria-invalid={ariaInvalid}
        onChange={(event) => updateValue(event.target.value, event.target.selectionStart)}
        onClick={(event) => setCursor(event.currentTarget.selectionStart)}
        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
        onBlur={onBlur}
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md">
          {matches.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-paragraph-small hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCandidate(candidate)}
              >
                @{candidate.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
