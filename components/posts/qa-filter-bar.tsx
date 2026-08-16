'use client'

import { KeywordInput } from '@/components/design-system/ui/keyword-input'
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
      <div className="min-w-0 w-full md:flex-1">
        <KeywordInput
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          aria-label="キーワード検索"
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
