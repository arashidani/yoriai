import type { MentionCandidate } from '@/components/mentions/mention-candidate'
import { hasBodyMention } from '@/lib/mentions/has-body-mention'

const MENTION_AT_CURSOR = /(?:^|\s)(@[^\s@]*)$/

export function mentionTokenBeforeCursor(textBeforeCursor: string): string | undefined {
  return textBeforeCursor.match(MENTION_AT_CURSOR)?.[1]
}

export function mentionQueryBeforeCursor(textBeforeCursor: string): string | undefined {
  const token = mentionTokenBeforeCursor(textBeforeCursor)
  return token === undefined ? undefined : token.slice(1)
}

export function filterMentionCandidates(
  candidates: MentionCandidate[],
  query: string,
): MentionCandidate[] {
  return candidates.filter((candidate) => candidate.displayName.includes(query)).slice(0, 8)
}

export function selectedMentionIdsInBody(
  selectedIds: string[],
  candidates: MentionCandidate[],
  body: string,
): string[] {
  return selectedIds.filter((id) => {
    const candidate = candidates.find((item) => item.id === id)
    return Boolean(candidate && hasBodyMention(body, candidate.displayName))
  })
}

export function mentionReplacement(displayName: string): string {
  return `@${displayName} `
}

export function mentionTriggerToInsert(textBeforeCursor: string): string {
  if (mentionQueryBeforeCursor(textBeforeCursor) !== undefined) return ''
  return textBeforeCursor.length === 0 || /\s$/.test(textBeforeCursor) ? '@' : ' @'
}
