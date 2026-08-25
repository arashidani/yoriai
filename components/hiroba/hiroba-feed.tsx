'use client'

import { ArrowLeft, Bot, Flame, Info, Sparkles, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import { client } from '@/lib/hono/client'
import { cn } from '@/lib/utils'
import { HirobaCard } from './hiroba-card'
import { HirobaIcon } from './hiroba-icon'
import type { HirobaPost } from './hiroba-post-list'
import { HirobaPostList } from './hiroba-post-list'

type HirobaFeedProps = {
  hiroba: HirobaCatalogItem
  posts: HirobaPost[]
  popularPosts: { id: string; hirobaSlug: string; title: string; body: string }[]
  isAdmin: boolean
  initialJoined: boolean
}

const bannerTones = {
  yellow: 'bg-hiroba-yellow-border text-hiroba-yellow-foreground',
  blue: 'bg-hiroba-blue-border text-hiroba-blue-foreground',
  purple: 'bg-hiroba-purple-border text-hiroba-purple-foreground',
  rose: 'bg-hiroba-rose-border text-hiroba-rose-foreground',
  lime: 'bg-hiroba-lime-border text-hiroba-lime-foreground',
  mint: 'bg-hiroba-mint-border text-hiroba-mint-foreground',
} as const

/** ひろばの紹介、参加導線、投稿フィード、補助情報をまとめた詳細画面。 */
export function HirobaFeed({
  hiroba,
  posts,
  popularPosts,
  isAdmin,
  initialJoined,
}: HirobaFeedProps) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const popularHirobas = HIROBA_CATALOG.filter((item) => item.slug !== hiroba.slug).slice(0, 3)

  async function toggleMembership() {
    if (isUpdatingMembership) return
    setIsUpdatingMembership(true)
    setMembershipError(null)

    try {
      const res = joined
        ? await client.api.hiroba[':slug'].membership.$delete({ param: { slug: hiroba.slug } })
        : await client.api.hiroba[':slug'].membership.$post({ param: { slug: hiroba.slug } })
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

  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid min-w-0 grid-cols-1 items-start gap-7 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            <section>
              <div className={cn('h-24 rounded-xl', bannerTones[hiroba.tone])} />
              <div className="relative -mt-8 flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div
                    className={cn(
                      'flex size-18 items-center justify-center rounded-full border-4 border-background',
                      bannerTones[hiroba.tone],
                    )}
                  >
                    <HirobaIcon name={hiroba.icon} className="size-9" aria-hidden />
                  </div>
                  <h1 className="mt-3 font-heading text-heading-2">{hiroba.name}</h1>
                </div>
                <div className="flex flex-wrap gap-3 pb-1">
                  <button
                    type="button"
                    aria-pressed={joined}
                    onClick={toggleMembership}
                    disabled={isUpdatingMembership}
                    className={buttonVariants({
                      variant: joined ? 'outline' : 'default',
                      className: 'rounded-full px-6',
                    })}
                  >
                    <UserRound className="size-4" aria-hidden />
                    {joined ? '参加中' : '参加する'}
                  </button>
                  <Link
                    href="/hiroba"
                    className={buttonVariants({
                      variant: 'outline',
                      className: 'rounded-full px-6',
                    })}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    一覧に戻る
                  </Link>
                </div>
              </div>
              {membershipError && (
                <p role="alert" className="mt-3 px-4 text-paragraph-small text-destructive">
                  {membershipError}
                </p>
              )}
              <div className="mt-6 flex items-start gap-2 rounded-lg bg-hiroba-blue-soft px-4 py-3 text-hiroba-blue-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p className="text-paragraph-small">
                  ひろばに参加すると投稿、返信、いいねができるようになります。
                </p>
              </div>
            </section>

            <section className="mt-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-heading text-heading-3">みんなの投稿</h2>
                <Link
                  href={`/hiroba/${hiroba.slug}/new`}
                  className={buttonVariants({
                    size: 'default',
                    className: 'shrink-0 rounded-full',
                  })}
                >
                  投稿する
                </Link>
              </div>
              <HirobaPostList posts={posts} isAdmin={isAdmin} />
            </section>
          </div>

          <aside className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:sticky xl:top-6 xl:grid-cols-1">
            <section className="rounded-xl bg-hiroba-blue-soft p-5 text-hiroba-blue-foreground">
              <h2 className="mb-2 flex items-center gap-2 font-heading text-heading-4">
                <Bot className="size-5" aria-hidden />
                AI要約
              </h2>
              <p className="text-paragraph-small">
                {hiroba.description} お気に入りの話題や新しい発見を、気軽に共有できます。
              </p>
              <p className="mt-3 flex items-center gap-1 text-paragraph-mini opacity-75">
                <Sparkles className="size-3" aria-hidden />
                サンプル要約
              </p>
            </section>

            <section className="rounded-xl bg-background-subtle p-5">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-heading-4">
                <Flame className="size-5 text-primary" aria-hidden />
                人気のひろば
              </h2>
              <div className="grid min-w-0 grid-cols-1 gap-2">
                {popularHirobas.map((item) => (
                  <HirobaCard key={item.id} hiroba={item} />
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-background-subtle p-5 sm:col-span-2 xl:col-span-1">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-heading-4">
                <Flame className="size-5 text-primary" aria-hidden />
                人気の投稿
              </h2>
              {popularPosts.length === 0 ? (
                <p className="text-paragraph-small text-secondary-foreground">
                  投稿が集まると、ここに人気の投稿が表示されます。
                </p>
              ) : (
                <div className="grid min-w-0 grid-cols-1 gap-2">
                  {popularPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/hiroba/${post.hirobaSlug}/posts/${post.id}`}
                      className="min-w-0 rounded-lg border border-input bg-background p-3 hover:border-primary"
                    >
                      <p className="truncate text-paragraph-small font-bold">{post.title}</p>
                      <p className="truncate text-paragraph-mini text-secondary-foreground">
                        {post.body}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
