'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { QaFeedTagFilter } from './qa-feed-controls'

type QaFilterBarProps = {
  keyword: string
  onKeywordChange: (keyword: string) => void
  tags: { id: string; name: string }[]
  selectedTagIds: string[]
  onSelectedTagIdsChange: (tagIds: string[]) => void
}

/** キーワード検索とカテゴリー選択。狭いときは縦積み、md 以上は横並び（キーワードが残り幅を占める）。 */
function QaFilterBar({
  keyword,
  onKeywordChange,
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
}: QaFilterBarProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center">
      <div className="relative min-w-0 w-full md:flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="キーワードを入力"
          aria-label="キーワード検索"
          className="h-11 min-w-0 border-3 border-input bg-background pl-9"
        />
      </div>
      <div className="min-w-0 w-full md:w-56 md:shrink-0">
        <QaFeedTagFilter
          tags={tags}
          selectedTagIds={selectedTagIds}
          onChange={onSelectedTagIdsChange}
        />
      </div>
    </div>
  )
}

export { QaFilterBar }
