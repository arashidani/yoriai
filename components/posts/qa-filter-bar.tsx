'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useRef } from 'react'
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

type CategoryCheckboxProps = {
  id: string
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}

function CategoryCheckbox({ id, checked, indeterminate, onChange }: CategoryCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <input
      ref={(node) => {
        ref.current = node
        if (node) node.indeterminate = indeterminate
      }}
      id={id}
      type="checkbox"
      checked={checked}
      aria-checked={indeterminate ? 'mixed' : checked}
      onChange={onChange}
    />
  )
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
  const sortedCategories = [...categories].sort(
    (left, right) => right.tags.length - left.tags.length,
  )
  const selectionCount =
    selectedTagIds.length +
    selectedCategoryIds.filter((categoryId) => {
      const category = categories.find(({ id }) => id === categoryId)
      return !category?.tags.some(({ id }) => selectedTagIds.includes(id))
    }).length

  function toggleCategory(category: QuestionTagCategory) {
    const childIds = category.tags.map((tag) => tag.id)
    const allChildrenSelected =
      childIds.length > 0 && childIds.every((id) => selectedTagIds.includes(id))
    const shouldDeselect = selectedCategoryIds.includes(category.id) || allChildrenSelected

    onSelectedCategoryIdsChange(
      shouldDeselect
        ? selectedCategoryIds.filter((id) => id !== category.id)
        : [...selectedCategoryIds, category.id],
    )
    onSelectedTagIdsChange(
      shouldDeselect
        ? selectedTagIds.filter((id) => !childIds.includes(id))
        : [...new Set([...selectedTagIds, ...childIds])],
    )
  }

  function toggleTag(category: QuestionTagCategory, tagId: string) {
    const nextTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]
    const childIds = category.tags.map((tag) => tag.id)
    const allChildrenSelected =
      childIds.length > 0 && childIds.every((id) => nextTagIds.includes(id))
    const nextCategoryIds = allChildrenSelected
      ? [...new Set([...selectedCategoryIds, category.id])]
      : selectedCategoryIds.filter((id) => id !== category.id)

    onSelectedTagIdsChange(nextTagIds)
    onSelectedCategoryIdsChange(nextCategoryIds)
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
            {sortedCategories.map((category) => (
              <div key={category.id} className="space-y-2 py-2 first:pt-0 last:pb-0">
                <label
                  htmlFor={`category-${category.id}`}
                  className="flex cursor-pointer items-center gap-2 font-medium"
                >
                  <CategoryCheckbox
                    id={`category-${category.id}`}
                    checked={
                      selectedCategoryIds.includes(category.id) ||
                      (category.tags.length > 0 &&
                        category.tags.every((tag) => selectedTagIds.includes(tag.id)))
                    }
                    indeterminate={
                      category.tags.some((tag) => selectedTagIds.includes(tag.id)) &&
                      !category.tags.every((tag) => selectedTagIds.includes(tag.id))
                    }
                    onChange={() => toggleCategory(category)}
                  />
                  {category.name}
                </label>
                {!(category.name === 'その他' && category.tags.length === 1) && (
                  <div className="space-y-2 border-l pl-6">
                    {category.tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTag(category, tag.id)}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}

export { QaFilterBar }
