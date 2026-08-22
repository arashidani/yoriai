import Link from 'next/link'
import type { DisplayNameColor } from '@/app/generated/prisma/enums'
import { HirobaAnswerLikeButton } from '@/components/hiroba/hiroba-answer-like-button'
import { displayNameColorClass } from './display-name-color'

export type HirobaAnswer = {
  id: string
  body: string
  authorId: string | null
  displayName: string
  displayNameColor: DisplayNameColor | null
  isOwnAnswer: boolean
  likeCount: number
  createdAt: Date | string
}

type HirobaAnswerCardProps = {
  answer: HirobaAnswer
  liked: boolean
}

export function HirobaAnswerCard({ answer, liked }: HirobaAnswerCardProps) {
  return (
    <article className="rounded-xl border border-input bg-background p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-paragraph-mini font-bold"
          aria-hidden
        >
          {answer.displayName.slice(0, 1)}
        </div>
        {answer.authorId ? (
          <Link
            href={`/mypage/${answer.authorId}`}
            className={`text-paragraph-small font-bold hover:underline ${displayNameColorClass(answer.displayNameColor)}`}
          >
            {answer.displayName}
          </Link>
        ) : (
          <span
            className={`text-paragraph-small font-bold ${displayNameColorClass(answer.displayNameColor)}`}
          >
            {answer.displayName}
          </span>
        )}
        <span className="text-paragraph-mini text-secondary-foreground" suppressHydrationWarning>
          {new Date(answer.createdAt).toLocaleDateString('ja-JP')}
        </span>
      </div>
      <p className="whitespace-pre-wrap pt-3 text-paragraph-small">{answer.body}</p>
      {!answer.isOwnAnswer && (
        <div className="pt-3">
          <HirobaAnswerLikeButton
            answerId={answer.id}
            initialLiked={liked}
            initialLikeCount={answer.likeCount}
          />
        </div>
      )}
    </article>
  )
}
