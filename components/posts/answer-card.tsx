import { AnswerLikeButton } from '@/components/posts/answer-like-button'

export type Answer = {
  id: string
  body: string
  displayName: string
  isOwnAnswer: boolean
  likeCount: number
  createdAt: Date | string
}

type AnswerCardProps = {
  answer: Answer
  liked: boolean
}

export function AnswerCard({ answer, liked }: AnswerCardProps) {
  return (
    <article className="rounded-xl border border-input bg-background p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-paragraph-mini font-bold"
          aria-hidden
        >
          {answer.displayName.slice(0, 1)}
        </div>
        <span className="text-paragraph-small font-bold">{answer.displayName}</span>
        <span className="text-paragraph-mini text-secondary-foreground" suppressHydrationWarning>
          {new Date(answer.createdAt).toLocaleDateString('ja-JP')}
        </span>
      </div>
      <p className="whitespace-pre-wrap pt-3 text-paragraph-small">{answer.body}</p>
      {!answer.isOwnAnswer && (
        <div className="pt-3">
          <AnswerLikeButton
            answerId={answer.id}
            initialLiked={liked}
            initialLikeCount={answer.likeCount}
          />
        </div>
      )}
    </article>
  )
}
