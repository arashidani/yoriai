'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import type { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import imageNone from '@/assets/image-none.svg'
import { lunchChipType, mbtiChipVariant } from '@/components/hiroba/profile-variants'
import { MentionText } from '@/components/mentions/mention-text'
import { client } from '@/lib/hono/client'
import { LikeButton } from './like-button'
import { LunchChip, type LunchChipType } from './lunch-chip'
import { MbtiChip, type MbtiChipVariant } from './mbti-chip'

export type HirobaAnswer = {
  id: string
  body: string
  authorId: string | null
  displayName: string
  displayNameColor: DisplayNameColor | null
  avatarUrl: string | null
  lunchPreference: LunchPreference | null
  isOwnAnswer: boolean
  likeCount: number
  createdAt: Date | string
}

function formatRelativeTime(input: Date | string) {
  const date = new Date(input)
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diffMinutes < 1) return 'たった今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}時間前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP')
}

type AnswerCardProps = {
  answer: HirobaAnswer
  liked: boolean
  lunchVariant?: LunchChipType
  mbtiVariant?: MbtiChipVariant
  mentionNames?: string[]
}

export function AnswerCard({
  answer,
  liked,
  lunchVariant,
  mbtiVariant,
  mentionNames = [],
}: AnswerCardProps) {
  const resolvedLunchVariant = lunchVariant ?? lunchChipType(answer.lunchPreference)
  const resolvedMbtiVariant = mbtiVariant ?? mbtiChipVariant(answer.displayNameColor)
  const [isLiked, setIsLiked] = useState(liked)
  const [likeCount, setLikeCount] = useState(answer.likeCount)
  const [pending, setPending] = useState(false)

  async function handleLikeToggle(next: boolean) {
    if (pending || answer.isOwnAnswer) return
    setPending(true)
    setIsLiked(next)
    setLikeCount((count) => count + (next ? 1 : -1))

    try {
      const res = next
        ? await client.api['hiroba-answers'][':id'].likes.$post({ param: { id: answer.id } })
        : await client.api['hiroba-answers'][':id'].likes.$delete({ param: { id: answer.id } })
      if (!res.ok) throw new Error('いいねの処理に失敗しました')
      const result = await res.json()
      setIsLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch {
      setIsLiked(!next)
      setLikeCount((count) => count + (next ? -1 : 1))
      toast.error('いいねの処理に失敗しました')
    } finally {
      setPending(false)
    }
  }

  const profileHref =
    answer.authorId && (answer.isOwnAnswer ? '/mypage' : `/mypage/${answer.authorId}`)

  const avatar = (
    <Image
      src={answer.avatarUrl || imageNone}
      alt=""
      width={30}
      height={30}
      unoptimized={!!answer.avatarUrl}
      className="w-7.5 h-7.5 shrink-0 rounded-sm object-cover"
    />
  )

  return (
    <div className="flex gap-3 w-full">
      {profileHref ? <Link href={profileHref}>{avatar}</Link> : avatar}

      <div className="flex-1 space-y-2 min-w-0">
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            {profileHref ? (
              <Link
                href={profileHref}
                className="text-caption-bold text-foreground hover:underline tracking-normal"
              >
                {answer.displayName}
              </Link>
            ) : (
              <p className="text-caption-bold text-foreground tracking-normal">
                {answer.displayName}
              </p>
            )}

            {resolvedLunchVariant && <LunchChip lunchType={resolvedLunchVariant} />}

            {resolvedMbtiVariant && <MbtiChip variant={resolvedMbtiVariant} />}

            <span
              className="text-caption text-muted-foreground tracking-normal"
              suppressHydrationWarning
            >
              {formatRelativeTime(answer.createdAt)}
            </span>
          </div>

          <p className="text-body-small whitespace-pre-wrap">
            {mentionNames.map((name) => (
              <span key={name} className="text-primary font-bold">
                {name}さん
              </span>
            ))}
            <MentionText text={answer.body} />
          </p>
        </div>
        {!answer.isOwnAnswer && (
          <LikeButton
            count={likeCount}
            pressed={isLiked}
            disabled={pending}
            onPressedChange={handleLikeToggle}
          />
        )}
      </div>
    </div>
  )
}
