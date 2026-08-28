export type UserTextSegment =
  | { type: 'text'; value: string; start: number }
  | { type: 'mention'; value: string; start: number }
  | { type: 'url'; value: string; href: string; start: number }

const mentionPattern = /(^|\s)(@[^\s@]+)/g
/** http(s) のみ。ASCII 範囲で切り、日本語や全角記号に食い込まない */
const urlPattern = /https?:\/\/[!-~]+/gi

function countChar(value: string, char: string) {
  return value.split(char).length - 1
}

function stripUnmatchedClosers(value: string) {
  let next = value
  while (
    (countChar(next, ')') > countChar(next, '(') && next.endsWith(')')) ||
    (countChar(next, ']') > countChar(next, '[') && next.endsWith(']')) ||
    (countChar(next, '}') > countChar(next, '{') && next.endsWith('}'))
  ) {
    next = next.slice(0, -1)
  }
  return next
}

function toSafeHttpUrl(raw: string): { value: string; href: string } | null {
  const value = stripUnmatchedClosers(raw).replace(/[.,;:!?]+$/u, '')
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return { value, href: url.href }
  } catch {
    return null
  }
}

function overlaps(start: number, end: number, ranges: Array<{ start: number; end: number }>) {
  return ranges.some((range) => start < range.end && end > range.start)
}

export function parseUserText(text: string): UserTextSegment[] {
  const urlRanges: Array<{ start: number; end: number; value: string; href: string }> = []

  for (const match of text.matchAll(urlPattern)) {
    const parsed = toSafeHttpUrl(match[0])
    if (!parsed) continue
    const start = match.index ?? 0
    urlRanges.push({
      start,
      end: start + parsed.value.length,
      value: parsed.value,
      href: parsed.href,
    })
  }

  const mentionRanges: Array<{ start: number; end: number; value: string }> = []

  for (const match of text.matchAll(mentionPattern)) {
    const [, prefix, mention] = match
    const start = (match.index ?? 0) + prefix.length
    const end = start + mention.length
    if (overlaps(start, end, urlRanges)) continue
    mentionRanges.push({ start, end, value: mention })
  }

  const marks = [
    ...urlRanges.map((range) => ({ ...range, kind: 'url' as const })),
    ...mentionRanges.map((range) => ({ ...range, kind: 'mention' as const })),
  ].sort((a, b) => a.start - b.start)

  const segments: UserTextSegment[] = []
  let lastIndex = 0

  for (const mark of marks) {
    if (mark.start < lastIndex) continue
    if (mark.start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, mark.start), start: lastIndex })
    }
    if (mark.kind === 'url') {
      segments.push({ type: 'url', value: mark.value, href: mark.href, start: mark.start })
    } else {
      segments.push({ type: 'mention', value: mark.value, start: mark.start })
    }
    lastIndex = mark.end
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex), start: lastIndex })
  }

  return segments
}
