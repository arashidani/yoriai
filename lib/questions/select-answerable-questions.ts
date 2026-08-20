type Question = { id: string }

function shuffle<T>(items: T[], random: () => number) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

/** スキル関連を優先し、不足分を「その他」候補から重複なしで補う。 */
export function selectAnswerableQuestions<T extends Question>(
  skillQuestions: T[],
  otherQuestions: T[],
  limit = 3,
  random: () => number = Math.random,
) {
  const selected = shuffle(skillQuestions, random).slice(0, limit)
  const selectedIds = new Set(selected.map((question) => question.id))
  const fallback = shuffle(
    otherQuestions.filter((question) => !selectedIds.has(question.id)),
    random,
  ).slice(0, Math.max(0, limit - selected.length))

  return [...selected, ...fallback]
}
