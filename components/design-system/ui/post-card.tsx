'use client'

import { cva } from 'class-variance-authority'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import type { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import imageNone from '@/assets/image-none.svg'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { lunchChipType, mbtiChipVariant } from '@/components/hiroba/profile-variants'
import { MentionText } from '@/components/mentions/mention-text'
import { client } from '@/lib/hono/client'
import { cn } from '@/lib/utils'
import { LunchChip, type LunchChipType } from './lunch-chip'
import { MbtiChip, type MbtiChipVariant } from './mbti-chip'

export type HirobaPost = {
  id: string
  hirobaSlug: string
  title: string
  body: string
  imageUrl: string | null
  authorId: string | null
  displayName: string
  displayNameColor: DisplayNameColor | null
  avatarUrl: string | null
  lunchPreference: LunchPreference | null
  isOwnPost: boolean
  likeCount: number
  liked: boolean
  saved: boolean
  answerCount: number
  tags: { id: string; name: string }[]
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

type PostCardState = 'default' | 'muted'

type PostCardProps = {
  post: HirobaPost
  lunchVariant?: LunchChipType
  mbtiVariant?: MbtiChipVariant
  border?: 'default' | 'none'
  /** default: いいねをトグルできる / muted: 表示専用（塗りつぶしの肉球） */
  state?: PostCardState
  joined: boolean
  className?: string
  /** 指定するとカード全体（余白含む）がこのURL（投稿詳細）へのリンクになる。ホバー背景と cursor-pointer が付く */
  postHref?: string
}

const postCardVariants = cva('flex items-start gap-3 transition-colors', {
  variants: {
    border: {
      default: 'border-2 border-neutral-200 p-4 rounded-lg bg-surface',
      none: 'border-none',
    },
    interactive: {
      true: 'relative cursor-pointer hover:bg-ghost-hover',
      false: '',
    },
  },
  defaultVariants: {
    border: 'default',
    interactive: false,
  },
})

export function PostCard({
  post,
  lunchVariant,
  mbtiVariant,
  border,
  state = 'default',
  joined,
  className,
  postHref,
}: PostCardProps) {
  const resolvedLunchVariant = lunchVariant ?? lunchChipType(post.lunchPreference)
  const resolvedMbtiVariant = mbtiVariant ?? mbtiChipVariant(post.displayNameColor)
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [pending, setPending] = useState(false)

  async function handleLikeToggle(next: boolean) {
    if (pending) return
    setPending(true)
    setLiked(next)
    setLikeCount((count) => count + (next ? 1 : -1))

    try {
      const res = next
        ? await client.api['hiroba-posts'][':id'].likes.$post({ param: { id: post.id } })
        : await client.api['hiroba-posts'][':id'].likes.$delete({ param: { id: post.id } })
      if (!res.ok) throw new Error('いいねの処理に失敗しました')
      const result = await res.json()
      setLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch {
      setLiked(!next)
      setLikeCount((count) => count + (next ? -1 : 1))
      toast.error('いいねの処理に失敗しました')
    } finally {
      setPending(false)
    }
  }

  const body = (
    <div className="space-y-3">
      <p className="whitespace-pre-line text-body-small">
        <MentionText
          text={post.body}
          linkClassName={postHref ? 'relative z-10 pointer-events-auto' : undefined}
        />
      </p>

      {post.imageUrl && (
        <Image
          src={post.imageUrl}
          alt=""
          width={0}
          height={0}
          sizes="100vw"
          unoptimized
          className="w-full h-65 object-cover rounded-lg"
        />
      )}
    </div>
  )

  const profileHref = post.authorId && (post.isOwnPost ? '/mypage' : `/mypage/${post.authorId}`)

  const avatar = (
    <Image
      src={post.avatarUrl || imageNone}
      alt=""
      width={42}
      height={42}
      unoptimized={!!post.avatarUrl}
      className="w-10.5 h-10.5 shrink-0 rounded-[5.6px] object-cover"
    />
  )

  return (
    <div className={cn(postCardVariants({ border, interactive: !!postHref }), className)}>
      {postHref && (
        <Link href={postHref} className="absolute inset-0" aria-label={post.title} tabIndex={-1} />
      )}

      {profileHref ? (
        <Link
          href={profileHref}
          aria-label={`${post.displayName}のプロフィール`}
          className="relative z-10 shrink-0"
        >
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <div className={cn('flex-1 min-w-0 space-y-2 pr-10', postHref && 'pointer-events-none')}>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <p className="text-label text-foreground tracking-normal">{post.displayName}</p>

            {resolvedLunchVariant && <LunchChip lunchType={resolvedLunchVariant} />}

            {resolvedMbtiVariant && <MbtiChip variant={resolvedMbtiVariant} />}

            <div
              className="text-caption text-muted-foreground tracking-normal"
              suppressHydrationWarning
            >
              {formatRelativeTime(post.createdAt)}
            </div>
          </div>

          {body}
        </div>

        <div className="flex gap-2">
          <CommentCount count={post.answerCount} />

          <LikeButton
            className={postHref ? 'relative z-10 pointer-events-auto' : undefined}
            state={state}
            count={likeCount}
            pressed={liked}
            disabled={!joined || pending}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onPressedChange={handleLikeToggle}
          />
        </div>
      </div>
    </div>
  )
}
