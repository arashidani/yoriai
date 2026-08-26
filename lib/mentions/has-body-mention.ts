const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g

export function hasBodyMention(body: string, displayName: string) {
  const escapedDisplayName = displayName.replace(REGEXP_SPECIAL_CHARACTERS, '\\$&')
  return new RegExp(`(^|\\s)@${escapedDisplayName}(?=\\s|$)`).test(body)
}
