'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Post } from './post-list'
import { PostList } from './post-list'

// TODO: カテゴリー・ステータスは仮データ。バックエンド実装後に posts のフィールドへ接続する
const CATEGORIES = ['総務・労務', '経理', 'IT・システム', 'その他']

// TODO: ステータスでの絞り込みはバックエンド実装後に posts のフィールドへ接続する
const STATUS_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: 'resolved', label: '解決済み' },
  { id: 'unanswered', label: '未回答' },
]

type QaFeedProps = {
  posts: Post[]
  isAdmin: boolean
}

/** 検索・フィルタ行と質問一覧。キーワードはタイトル・本文に対する部分一致。 */
export function QaFeed({ posts, isAdmin }: QaFeedProps) {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  const filteredPosts = keyword
    ? posts.filter((post) => post.title.includes(keyword) || post.body.includes(keyword))
    : posts

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
          <Select>
            <SelectTrigger className="h-10 w-full bg-background data-[size=default]:h-10 sm:flex-1">
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            value={[status]}
            onValueChange={(value) => {
              const next = value.at(-1)
              if (typeof next === 'string') setStatus(next)
            }}
            spacing={0}
            aria-label="ステータスで絞り込み"
            className="grid h-10 w-full grid-cols-3 rounded-lg border-2 border-input bg-background sm:flex sm:w-fit sm:shrink-0"
          >
            {STATUS_FILTERS.map(({ id, label }) => (
              <ToggleGroupItem
                key={id}
                value={id}
                className="h-full min-w-0 px-2 text-paragraph-small font-medium whitespace-nowrap text-secondary-foreground not-last:border-r-2 not-last:border-input aria-pressed:bg-secondary-hover aria-pressed:font-bold sm:px-3"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="flex-1 px-8 py-6">
        <PostList posts={filteredPosts} isAdmin={isAdmin} />
      </div>
    </>
  )
}
