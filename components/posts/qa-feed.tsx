'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import type { Post } from './post-list'
import { PostList } from './post-list'
import { QaFeedCategorySelect, QaFeedStatusFilter } from './qa-feed-controls'

// TODO: カテゴリーは仮データ。バックエンド実装後に posts のフィールドへ接続する
const CATEGORIES = ['総務・労務', '経理', 'IT・システム', 'その他']

const STATUS_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: 'resolved', label: '解決済み' },
  { id: 'unanswered', label: '未回答' },
]

const STATUS_PREDICATES: Record<string, (post: Post) => boolean> = {
  all: () => true,
  resolved: (post) => post.status === 'RESOLVED',
  unanswered: (post) => post.status === 'OPEN',
}

type QaFeedProps = {
  posts: Post[]
  isAdmin: boolean
}

/** 検索・フィルタ行と質問一覧。キーワードはタイトル・本文に対する部分一致、ステータスは post.status との一致で絞り込む。 */
export function QaFeed({ posts, isAdmin }: QaFeedProps) {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  const filteredPosts = posts
    .filter(STATUS_PREDICATES[status] ?? STATUS_PREDICATES.all)
    .filter((post) => !keyword || post.title.includes(keyword) || post.body.includes(keyword))

  return (
    <>
      <div className="sticky top-25 z-20 border-b border-input bg-background px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワードを入力"
              aria-label="キーワード検索"
              className="h-10 bg-background pl-9"
            />
          </div>
          <QaFeedCategorySelect categories={CATEGORIES} />
          <QaFeedStatusFilter filters={STATUS_FILTERS} value={status} onValueChange={setStatus} />
        </div>
      </div>
      <div className="flex-1 px-8 py-6">
        <PostList posts={filteredPosts} isAdmin={isAdmin} />
      </div>
    </>
  )
}
