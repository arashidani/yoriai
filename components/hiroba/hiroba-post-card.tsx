import { MessageCircle, UserRound, UsersRound, Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { displayNameColorClass, lunchStyleTag, mbtiColorTag } from './display-name-color'
import { HirobaDeletePostButton } from './hiroba-delete-post-button'
import { HirobaPostLikeButton } from './hiroba-post-like-button'
import type { HirobaPost } from './hiroba-post-list'
import { HirobaSaveButton } from './hiroba-save-button'

type HirobaPostCardProps = {
  post: HirobaPost
  isAdmin?: boolean
  canReply?: boolean
  onJoinRequired?: () => void
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

export function HirobaPostCard({
  post,
  isAdmin = false,
  canReply = true,
  onJoinRequired,
  onDeleted,
}: HirobaPostCardProps) {
  const canDelete = isAdmin || (post.isOwnPost && post.answerCount === 0)
  const lunchStyle = lunchStyleTag(post.lunchPreference)
  const mbtiTag = mbtiColorTag(post.displayNameColor)

  return (
    <div className="relative min-w-0 rounded-lg border border-input bg-background shadow-xs">
      {canDelete && onDeleted && (
        <div className="absolute top-3 right-3 z-10">
          <HirobaDeletePostButton postId={post.id} postTitle={post.title} onDeleted={onDeleted} />
        </div>
      )}
      <article className="p-4 pb-0">
        <div className="flex gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <UserRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {post.authorId ? (
                <Link
                  href={`/mypage/${post.authorId}`}
                  className={`text-paragraph-small font-bold hover:underline ${displayNameColorClass(post.displayNameColor)}`}
                >
                  {post.displayName}
                </Link>
              ) : (
                <span
                  className={`text-paragraph-small font-bold ${displayNameColorClass(post.displayNameColor)}`}
                >
                  {post.displayName}
                </span>
              )}
              {lunchStyle && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lunch-style-bg px-2 py-0.5 text-paragraph-mini font-bold text-lunch-style">
                  <Utensils className="size-3" aria-hidden />
                  {lunchStyle}
                </span>
              )}
              {mbtiTag && (
                <span
                  className={`rounded-full px-2 py-0.5 text-paragraph-mini font-bold ${mbtiTag.className}`}
                >
                  {mbtiTag.label}
                </span>
              )}
              <span
                className="text-paragraph-mini text-secondary-foreground"
                suppressHydrationWarning
              >
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <Link href={`/hiroba/${post.hirobaSlug}/posts/${post.id}`} className="block">
              <p className="pt-1 text-paragraph-small font-bold">{post.title}</p>
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
              {post.imageUrl && (
                <Image
                  src={post.imageUrl}
                  alt="投稿画像"
                  width={800}
                  height={600}
                  unoptimized
                  className="mt-4 max-h-96 w-full rounded-lg object-cover"
                />
              )}
            </Link>
          </div>
        </div>
      </article>
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 pl-16">
        {canReply ? (
          <Link
            href={`/hiroba/${post.hirobaSlug}/posts/${post.id}#answer-form`}
            className={actionChipClass}
          >
            <MessageCircle className="size-3" />
            返信
          </Link>
        ) : (
          <button type="button" onClick={onJoinRequired} className={actionChipClass}>
            <MessageCircle className="size-3" />
            返信
          </button>
        )}
        <HirobaSaveButton postId={post.id} initialSaved={post.saved} />
        {!post.isOwnPost && (
          <HirobaPostLikeButton
            postId={post.id}
            initialLiked={post.liked}
            initialLikeCount={post.likeCount}
          />
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-paragraph-mini text-muted-foreground">
          <UsersRound className="size-3" aria-hidden />
          {post.answerCount}
        </span>
      </div>
    </div>
  )
}
