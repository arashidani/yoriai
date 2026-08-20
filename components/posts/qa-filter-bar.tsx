'use client'

import { ChevronDownIcon } from 'lucide-react'
import { KeywordInput } from '@/components/design-system/ui/keyword-input'

export type QuestionTagCategory = {
  id: string
  name: string
  tags: { id: string; name: string }[]
}

type QaFilterBarProps = {
  keyword: string
  onKeywordChange: (keyword: string) => void
  categories: QuestionTagCategory[]
  selectedCategoryIds?: string[]
  onSelectedCategoryIdsChange?: (categoryIds: string[]) => void
  selectedTagIds: string[]
  onSelectedTagIdsChange: (tagIds: string[]) => void
}

/** キーワード検索とカテゴリー選択。狭いときは縦積み、md 以上は横並び（キーワードが残り幅を占める）。 */
function QaFilterBar({
  keyword,
  onKeywordChange,
  categories,
  selectedCategoryIds = [],
  onSelectedCategoryIdsChange = () => undefined,
  selectedTagIds,
  onSelectedTagIdsChange,
}: QaFilterBarProps) {
  const selectionCount = selectedCategoryIds.length + selectedTagIds.length

  function toggle(ids: string[], id: string, onChange: (nextIds: string[]) => void) {
    onChange(ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id])
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center">
      <div className="min-w-0 w-full md:flex-1">
        <KeywordInput
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          aria-label="キーワード検索"
        />
      </div>
      <div className="relative min-w-0 w-full md:w-64 md:shrink-0">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border-2 border-input bg-card p-3 text-paragraph-small font-medium text-foreground">
            <span className="flex-1">
              {selectionCount === 0 ? 'カテゴリーを選択' : `${selectionCount}件選択中`}
            </span>
            <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-50 mt-1 max-h-96 w-full min-w-64 overflow-y-auto rounded-lg border bg-background p-3 shadow-lg">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2 py-2 first:pt-0 last:pb-0">
                <label className="flex cursor-pointer items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() =>
                      toggle(selectedCategoryIds, category.id, onSelectedCategoryIdsChange)
                    }
                  />
                  {category.name}
                </label>
                <div className="space-y-2 border-l pl-6">
                  {category.tags.map((tag) => (
                    <label key={tag.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => toggle(selectedTagIds, tag.id, onSelectedTagIdsChange)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}

export { QaFilterBar }
