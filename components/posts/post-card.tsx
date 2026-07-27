import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { QuestionLikeButton } from '@/components/posts/question-like-button'
import { SaveButton } from '@/components/posts/save-button'
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
  const canDelete = isAdmin || (post.isOwnQuestion && post.answerCount === 0)

  return (
    <div className="relative rounded-xl border border-input bg-background shadow-xs transition-shadow hover:shadow-md">
      {canDelete && onDeleted && (
        <div className="absolute top-3 right-3 z-10">
          <DeletePostButton postId={post.id} postTitle={post.title} onDeleted={onDeleted} />
        </div>
      )}
      <Link href={`/posts/${post.id}`} className="block p-5 pb-0">
        <article>
          <div className="flex gap-3">
            <div className="size-10 shrink-0 rounded-full bg-muted" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-paragraph-small font-bold">{post.displayName}</span>
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
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-muted px-2 py-0.5 text-paragraph-mini text-muted-foreground"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
      <div className="flex items-center gap-3 px-5 pt-3 pb-5 pl-[3.25rem]">
        <Link href={`/posts/${post.id}#answer-form`} className={actionChipClass}>
          <MessageCircle className="size-3" />
          返信
        </Link>
        <SaveButton postId={post.id} initialSaved={post.saved} />
        {!post.isOwnQuestion && (
          <QuestionLikeButton
            postId={post.id}
            initialLiked={post.liked}
            initialLikeCount={post.likeCount}
          />
        )}
      </div>
    </div>
  )
}
