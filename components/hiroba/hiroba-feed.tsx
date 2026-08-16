'use client'

import { SelectCategories } from '@/components/design-system/ui/select-categories'
import Link from 'next/link'
import { useState } from 'react'
import { KeywordInput } from '@/components/design-system/ui/keyword-input'
import { buttonVariants } from '@/components/ui/button'
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
          <div className="w-full min-w-0 sm:flex-1">
            <KeywordInput
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="キーワード検索"
            />
          </div>
          <SelectCategories
            categories={allTags}
            value={selectedTagIds[0] ?? null}
            onValueChange={(tagId) => setSelectedTagIds(tagId ? [tagId] : [])}
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
