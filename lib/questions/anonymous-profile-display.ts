export function anonymousProfileDisplayName(displayName: string, aliasNumber: number): string {
  return aliasNumber > 1 ? `${displayName}#${aliasNumber}` : displayName
}

export function avatarUrlForAlias(avatarUrls: string[], aliasNumber: number): string | null {
  if (avatarUrls.length === 0) return null
  return avatarUrls[(aliasNumber - 1) % avatarUrls.length]
}
