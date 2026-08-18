'use client'

import { useState } from 'react'
import { HirobaPostCard } from './hiroba-post-card'

export type HirobaPost = {
  id: string
  hirobaSlug: string
  title: string
  body: string
  displayName: string
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
}

export function HirobaPostList({ posts, isAdmin }: HirobaPostListProps) {
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const visiblePosts = posts.filter((post) => !deletedIds.includes(post.id))

  if (visiblePosts.length === 0) {
    return <p className="text-secondary-foreground">まだ投稿がありません。</p>
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      {visiblePosts.map((post, index) => (
        <HirobaPostCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          showImagePlaceholder={index === 0 || index === 4}
          onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  )
}
