'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { QaFeedTagFilter } from '@/components/posts/qa-feed-controls'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { HirobaPost } from './hiroba-post-list'
import { HirobaPostList } from './hiroba-post-list'

type HirobaFeedProps = {
  hirobaSlug: string
  posts: HirobaPost[]
  isAdmin: boolean
  allTags: { id: string; name: string }[]
}

/** 検索・フィルタ行とひろば投稿一覧。キーワードはタイトル・本文に対する部分一致、タグは択一で絞り込む。 */
export function HirobaFeed({ hirobaSlug, posts, isAdmin, allTags }: HirobaFeedProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const filteredPosts = posts
    .filter((post) => !keyword || post.title.includes(keyword) || post.body.includes(keyword))
    .filter((post) => selectedTagIds.every((id) => post.tags.some((tag) => tag.id === id)))

  return (
    <>
      <div className="sticky top-25 z-20 bg-background px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワードを入力"
              aria-label="キーワード検索"
              className="h-11 border-3 border-input bg-background pl-9"
            />
          </div>
          <QaFeedTagFilter
            tags={allTags}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
          <Link
            href={`/hiroba/${hirobaSlug}/new`}
            className={buttonVariants({ size: 'default', className: 'shrink-0 rounded-full' })}
          >
            投稿する
          </Link>
        </div>
      </div>
      <div className="flex-1 px-8 py-6">
        <HirobaPostList posts={filteredPosts} isAdmin={isAdmin} />
      </div>
    </>
  )
}
