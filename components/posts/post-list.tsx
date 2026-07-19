'use client'

import { useState } from 'react'
import { PostCard } from './post-card'

export type Author = {
  id: string
  name: string | null
  email: string
}

export type Post = {
  id: string
  title: string
  body: string
  author: Author | null
  createdAt: Date | string
}

type PostListProps = {
  posts: Post[]
  isAdmin: boolean
}

export function PostList({ posts, isAdmin }: PostListProps) {
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const visiblePosts = posts.filter((post) => !deletedIds.includes(post.id))

  if (visiblePosts.length === 0) {
    return <p className="text-secondary-foreground">まだ質問がありません。</p>
  }

  return (
    <div className="grid gap-4">
      {visiblePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  )
}
