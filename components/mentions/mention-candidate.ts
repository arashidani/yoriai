export type MentionCandidate = { id: string; displayName: string }

export type MentionSelection = {
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  loadCandidates: () => Promise<MentionCandidate[]>
}
