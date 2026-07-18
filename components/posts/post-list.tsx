'use client'

import { useState } from 'react'
import { PostCard } from './post-card'

type Author = {
  id: string
  name: string | null
  email: string
}

type Post = {
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

export function PostList({ posts: initialPosts, isAdmin }: PostListProps) {
  const [posts, setPosts] = useState(initialPosts)

  if (posts.length === 0) {
    return <p className="text-muted-foreground">まだ質問がありません。</p>
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}
    </div>
  )
}
