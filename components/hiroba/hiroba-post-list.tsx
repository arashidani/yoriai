'use client'

import { useState } from 'react'
import type { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import { HirobaPostCard } from './hiroba-post-card'

export type HirobaPost = {
  id: string
  hirobaSlug: string
  title: string
  imageUrl: string | null
  authorId: string | null
  displayName: string
  displayNameColor: DisplayNameColor | null
  lunchPreference: LunchPreference | null
  isOwnPost: boolean
  likeCount: number
  liked: boolean
  saved: boolean
  answerCount: number
  tags: { id: string; name: string }[]
  createdAt: Date | string
}

type HirobaPostListProps = {
  posts: HirobaPost[]
  isAdmin: boolean
  canReply?: boolean
  onJoinRequired?: () => void
}

export function HirobaPostList({
  posts,
  isAdmin,
  canReply = true,
  onJoinRequired,
}: HirobaPostListProps) {
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const visiblePosts = posts.filter((post) => !deletedIds.includes(post.id))

  if (visiblePosts.length === 0) {
    return <p className="text-secondary-foreground">まだ投稿がありません。</p>
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      {visiblePosts.map((post) => (
        <HirobaPostCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          canReply={canReply}
          onJoinRequired={onJoinRequired}
          onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  )
}
