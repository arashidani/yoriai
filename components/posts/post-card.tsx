import { Bookmark, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { DeletePostButton } from './delete-post-button'
import type { Post } from './post-list'

type PostCardProps = {
  post: Post
  isAdmin?: boolean
  onDeleted?: (postId: string) => void
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

const actionChipClass =
  'inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1 text-paragraph-mini font-medium text-secondary-foreground'

export function PostCard({ post, isAdmin = false, onDeleted }: PostCardProps) {
  const excerpt = post.body.length > 100 ? `${post.body.slice(0, 100)}…` : post.body

  return (
    <div className="relative">
      <Link href={`/posts/${post.id}`} className="block">
        <article className="rounded-xl border border-input bg-background p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex gap-3">
            <div className="size-10 shrink-0 rounded-full bg-muted" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-paragraph-small font-bold">
                  {post.author ? (post.author.name ?? post.author.email) : '退会したユーザー'}
                </span>
                <span
                  className="text-paragraph-mini text-secondary-foreground"
                  suppressHydrationWarning
                >
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <p className="pt-1 text-paragraph-small">{post.title}</p>
              <p className="line-clamp-2 text-paragraph-small text-secondary-foreground">
                {excerpt}
              </p>
              {/* 返信・保存は未実装のため装飾のみ(a 内に button を置けない) */}
              <div className="flex items-center gap-3 pt-3">
                <span className={actionChipClass}>
                  <MessageCircle className="size-3" />
                  返信
                </span>
                <span className={actionChipClass}>
                  <Bookmark className="size-3" />
                  保存
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
      {isAdmin && onDeleted && (
        <div className="absolute right-3 bottom-3">
          <DeletePostButton postId={post.id} postTitle={post.title} onDeleted={onDeleted} />
        </div>
      )}
    </div>
  )
}
