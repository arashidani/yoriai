import type { ReactNode } from 'react'

const mentionPattern = /(^|\s)(@[^\s@]+)/g

export function MentionText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(mentionPattern)) {
    const [, prefix, mention] = match
    const mentionStart = (match.index ?? 0) + prefix.length
    parts.push(text.slice(lastIndex, mentionStart))
    parts.push(
      <span key={mentionStart} className="rounded-sm bg-primary/10 px-0.5 font-medium text-primary">
        {mention}
      </span>,
    )
    lastIndex = mentionStart + mention.length
  }

  parts.push(text.slice(lastIndex))
  return parts
}
