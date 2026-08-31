'use client'

import type { Editor } from '@tiptap/react'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MentionCandidate, MentionSelection } from '@/components/mentions/mention-candidate'
import {
  filterMentionCandidates,
  mentionQueryBeforeCursor,
  mentionReplacement,
  mentionTokenBeforeCursor,
  mentionTriggerToInsert,
  selectedMentionIdsInBody,
} from '@/lib/mentions/mention-query'

function textBeforeCursor(editor: Editor) {
  return editor.state.doc.textBetween(0, editor.state.selection.from, '\n', '\n')
}

export function useRichTextMentions({
  editor,
  mentions,
}: {
  editor: Editor | null
  mentions?: MentionSelection
}) {
  const listboxId = useId()
  const [candidates, setCandidates] = useState<MentionCandidate[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const dismissedQueryRef = useRef<string | null>(null)
  const keepDismissedQueryRef = useRef(false)
  const candidatesRef = useRef(candidates)
  const mentionsRef = useRef(mentions)
  const mentionRangeRef = useRef<{ from: number; to: number } | null>(null)

  dismissedQueryRef.current = dismissedQuery
  candidatesRef.current = candidates
  mentionsRef.current = mentions

  const loadCandidates = mentions?.loadCandidates

  useEffect(() => {
    if (!loadCandidates) return
    void loadCandidates()
      .then(setCandidates)
      .catch(() => setCandidates([]))
  }, [loadCandidates])

  const query = editor && mentions ? mentionQueryBeforeCursor(textBeforeCursor(editor)) : undefined
  const matches = useMemo(
    () => (query === undefined ? [] : filterMentionCandidates(candidates, query)),
    [candidates, query],
  )
  const isOpen = Boolean(mentions) && matches.length > 0 && query !== dismissedQuery
  const selectedIndex = matches.length === 0 ? 0 : activeIndex % matches.length

  if (editor && mentions) {
    const to = editor.state.selection.from
    const token = mentionTokenBeforeCursor(textBeforeCursor(editor))
    mentionRangeRef.current = token ? { from: to - token.length, to } : null
  } else {
    mentionRangeRef.current = null
  }

  const caretPos = editor?.state.selection.from

  useLayoutEffect(() => {
    if (!editor || !isOpen) return

    function updatePosition() {
      if (!editor) return
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      setPopupPosition({
        top: coords.bottom + 4,
        left: Math.min(coords.left, window.innerWidth - 180),
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [caretPos, editor, isOpen])

  function selectCandidate(candidate: MentionCandidate) {
    if (!editor) return
    const range = mentionRangeRef.current
    if (!range) return
    keepDismissedQueryRef.current = true
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(mentionReplacement(candidate.displayName), range.from, range.to)
        return true
      })
      .run()
    mentions?.onSelectedIdsChange([...new Set([...(mentions.selectedIds ?? []), candidate.id])])
    setDismissedQuery(candidate.displayName)
  }

  function insertTrigger() {
    if (!editor || !mentions) return
    const trigger = mentionTriggerToInsert(textBeforeCursor(editor))
    editor.chain().focus().run()
    if (!trigger) return
    editor
      .chain()
      .command(({ tr }) => {
        tr.insertText(trigger)
        return true
      })
      .run()
  }

  function onDocumentChange(markdown: string) {
    const mention = mentionsRef.current
    if (!mention) return
    if (keepDismissedQueryRef.current) {
      keepDismissedQueryRef.current = false
    } else if (dismissedQueryRef.current !== null) {
      setDismissedQuery(null)
    }
    setActiveIndex(0)
    mention.onSelectedIdsChange(
      selectedMentionIdsInBody(mention.selectedIds, candidatesRef.current, markdown),
    )
  }

  function handleKeyDown(event: KeyboardEvent): boolean {
    if (!isOpen || event.isComposing) return false
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % Math.max(matches.length, 1))
      return true
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + matches.length) % Math.max(matches.length, 1))
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const candidate = matches[selectedIndex]
      if (candidate) selectCandidate(candidate)
      return true
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setDismissedQuery(query ?? null)
      return true
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      setDismissedQuery(query ?? null)
      return false
    }
    return false
  }

  const handleKeyDownRef = useRef(handleKeyDown)
  handleKeyDownRef.current = handleKeyDown
  const onDocumentChangeRef = useRef(onDocumentChange)
  onDocumentChangeRef.current = onDocumentChange

  useEffect(() => {
    const dom = editor?.view.dom
    if (!dom || !mentions) return
    dom.setAttribute('aria-expanded', String(isOpen))
    if (isOpen) {
      dom.setAttribute('aria-controls', listboxId)
      dom.setAttribute('aria-activedescendant', `${listboxId}-option-${selectedIndex}`)
    } else {
      dom.removeAttribute('aria-controls')
      dom.removeAttribute('aria-activedescendant')
    }
  }, [editor, isOpen, listboxId, mentions, selectedIndex])

  return {
    isOpen,
    listboxId,
    matches,
    selectedIndex,
    selectCandidate,
    setActiveIndex,
    insertTrigger,
    popupPosition,
    handleKeyDownRef,
    onDocumentChangeRef,
  }
}
