type AnswerableQuestion = {
  id: string
  title: string
}

function toSideQuestionData(question: AnswerableQuestion) {
  return {
    id: question.id,
    href: `/posts/${question.id}`,
    title: question.title,
  }
}

export { toSideQuestionData }
