type AnswerableQuestion = {
  id: string
  title: string
  displayAuthor: { displayName: string; avatarUrl: string | null }
}

function toSideQuestionData(question: AnswerableQuestion) {
  return {
    id: question.id,
    href: `/posts/${question.id}`,
    title: question.title,
    avatarSrc: question.displayAuthor.avatarUrl ?? undefined,
    avatarAlt: question.displayAuthor.displayName,
  }
}

export { toSideQuestionData }
