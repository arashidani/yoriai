'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { buttonVariants as designButtonVariants } from '@/components/design-system/button'
import { JoinButton } from '@/components/design-system/ui/join-button'
import { SquareIcon } from '@/components/design-system/ui/square-icon'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { client } from '@/lib/hono/client'
import {
  ACCEPTED_HIROBA_POST_IMAGE_TYPES,
  HirobaPostImageClientValidationError,
  prepareHirobaPostImageForUpload,
} from '@/lib/image/process-hiroba-post-image-client'
import type { CreateHirobaPostInput } from '@/lib/schemas/hiroba'
import { cn } from '@/lib/utils'
import { AssistBanner } from '../design-system/ui/assist-banner'
import { type HirobaPost, PostCard } from '../design-system/ui/post-card'
import { TextareaFocus } from '../design-system/ui/textarea-focus'

type HirobaFeedProps = {
  hiroba: HirobaCatalogItem
  posts: HirobaPost[]
  initialJoined: boolean
  canJoin: boolean
  isAdmin: boolean
}

const bannerTones = {
  pickup: 'bg-hiroba-pickup-border text-hiroba-pickup-foreground',
  active: 'bg-hiroba-active-border text-hiroba-active-foreground',
  indoor: 'bg-hiroba-indoor-border text-hiroba-indoor-foreground',
  maniac: 'bg-hiroba-maniac-border text-hiroba-maniac-foreground',
  food: 'bg-hiroba-food-border text-hiroba-food-foreground',
  knowhow: 'bg-hiroba-knowhow-border text-hiroba-knowhow-foreground',
  mbtiGreen: 'bg-hiroba-mbti-green-border text-hiroba-mbti-green-foreground',
  mbtiBlue: 'bg-hiroba-mbti-blue-border text-hiroba-mbti-blue-foreground',
  mbtiYellow: 'bg-hiroba-mbti-yellow-border text-hiroba-mbti-yellow-foreground',
  mbtiPurple: 'bg-hiroba-mbti-purple-border text-hiroba-mbti-purple-foreground',
} as const

/** ひろばの紹介、参加導線、投稿フィード、補助情報をまとめた詳細画面。 */
export function HirobaFeed({ hiroba, posts, initialJoined, canJoin, isAdmin }: HirobaFeedProps) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [localPosts, setLocalPosts] = useState(posts)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postImagePreviewUrl, setPostImagePreviewUrl] = useState<string | null>(null)
  const isSubmittingPostRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)

  function handlePostImageSelect(file: File) {
    setPostImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function clearPostImagePreview() {
    setPostImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  async function toggleMembership() {
    if (isUpdatingMembership) return
    setIsUpdatingMembership(true)
    setMembershipError(null)

    try {
      const res = await client.api.hiroba[':slug'].membership.$post({
        param: { slug: hiroba.slug },
      })
      if (!res.ok) {
        setMembershipError('参加状態を更新できませんでした。')
        return
      }
      const data = await res.json()
      setJoined(data.joined)
      router.refresh()
    } catch {
      setMembershipError('通信に失敗しました。もう一度お試しください。')
    } finally {
      setIsUpdatingMembership(false)
    }
  }

  async function handleCreatePost({
    image,
    ...data
  }: CreateHirobaPostInput & { image: File | null }) {
    if (isSubmittingPostRef.current) return

    isSubmittingPostRef.current = true
    setIsSubmittingPost(true)
    setPostError(null)

    const requestBody = JSON.stringify(data)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.hiroba[':slug'].posts.$post({
        param: { slug: hiroba.slug },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        setPostError('error' in body ? body.error : '投稿に失敗しました')
        return
      }

      const { post } = await res.json()
      let imageUrl = post.imageUrl

      if (image) {
        try {
          const preparedImage = await prepareHirobaPostImageForUpload(image)
          const imageRes = await client.api['hiroba-posts'][':id'].image.$put({
            param: { id: post.id },
            form: { file: preparedImage },
          })
          if (imageRes.ok) {
            imageUrl = (await imageRes.json()).post.imageUrl
          }
        } catch (error) {
          setPostError(
            error instanceof HirobaPostImageClientValidationError
              ? error.message
              : '画像のアップロードに失敗しました',
          )
        } finally {
          clearPostImagePreview()
        }
      }

      const newPost: HirobaPost = {
        id: post.id,
        hirobaSlug: hiroba.slug,
        title: post.title,
        body: post.body,
        imageUrl,
        authorId: post.authorId,
        // API のレスポンスは publicPostAuthorSelect なので email を含まない
        displayName: post.author?.username ?? post.author?.name ?? '削除されたユーザー',
        displayNameColor: post.author?.displayNameColor ?? null,
        avatarUrl: post.author?.avatarUrl ?? null,
        lunchPreference: post.author?.lunchPreference ?? null,
        isOwnPost: true,
        likeCount: post.likeCount,
        liked: false,
        saved: false,
        answerCount: post.answerCount,
        tags: post.tags ?? [],
        createdAt: post.createdAt,
      }
      setLocalPosts((prev) => [newPost, ...prev])
    } catch {
      setPostError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingPostRef.current = false
      setIsSubmittingPost(false)
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <section>
        <div className={cn('h-25 rounded-lg', bannerTones[hiroba.category])} />

        <div className="relative -mt-10 flex justify-between items-end gap-4 pl-6 mb-8">
          <div>
            <SquareIcon size="large" hirobaIcon={hiroba.icon} category={hiroba.category} />
            <h1 className="mt-3 text-foreground text-heading-1">{hiroba.name}</h1>
          </div>

          <div className="flex flex-wrap gap-3 pb-1">
            <Link
              href="/hiroba"
              className={designButtonVariants({ variant: 'secondary', size: 'large' })}
            >
              一覧に戻る
            </Link>

            {canJoin && (
              <JoinButton
                pressed={joined}
                disabled={joined || isUpdatingMembership}
                onPressedChange={(nextPressed) => {
                  if (nextPressed) void toggleMembership()
                }}
              />
            )}
          </div>
        </div>
        {membershipError && (
          <p role="alert" className="mb-4 text-paragraph-small text-destructive">
            {membershipError}
          </p>
        )}
      </section>

      <section className="px-3 space-y-4">
        {!canJoin ? (
          <AssistBanner variant="support">
            自分のMBTIのひろばでのみ、投稿・返信・いいねができます。
          </AssistBanner>
        ) : !joined ? (
          <AssistBanner variant="support">
            広場に参加すると投稿、返信、いいねができるようになります。
          </AssistBanner>
        ) : (
          <div>
            <div className="mb-4">
              {postError && (
                <p role="alert" className="mb-2 text-paragraph-small text-destructive">
                  {postError}
                </p>
              )}

              <TextareaFocus
                onSubmit={handleCreatePost}
                isSubmitting={isSubmittingPost}
                onImageSelect={handlePostImageSelect}
                imagePreviewUrl={postImagePreviewUrl}
                onImageClear={clearPostImagePreview}
                acceptedImageTypes={ACCEPTED_HIROBA_POST_IMAGE_TYPES}
              />
            </div>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-4">
          {localPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              joined={joined}
              postHref={`/hiroba/${hiroba.slug}/posts/${post.id}`}
              isAdmin={isAdmin}
              onDeleted={(deletedId) =>
                setLocalPosts((prev) => prev.filter((item) => item.id !== deletedId))
              }
            />
          ))}
        </div>
      </section>
    </div>
  )
}
