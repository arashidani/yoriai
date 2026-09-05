'use client'

import {
  type QaFeedStatusFilter as QaFeedStatus,
  useQaFeedFilterStore,
} from '@/lib/stores/qa-feed-filter-store'
import { QaFeedStatusFilter } from './qa-feed-controls'
import { QaFilterBar, type QuestionTagCategory } from './qa-filter-bar'

const STATUS_FILTERS = [
  { id: 'all', label: '全て' },
  { id: 'open', label: '回答募集中' },
  { id: 'resolved', label: '解決済み' },
] as const

type QaFeedFiltersProps = {
  tagCategories: QuestionTagCategory[]
}

function QaFeedFilters({ tagCategories }: QaFeedFiltersProps) {
  const keyword = useQaFeedFilterStore((state) => state.keyword)
  const status = useQaFeedFilterStore((state) => state.status)
  const selectedCategoryIds = useQaFeedFilterStore((state) => state.selectedCategoryIds)
  const selectedTagIds = useQaFeedFilterStore((state) => state.selectedTagIds)
  const setKeyword = useQaFeedFilterStore((state) => state.setKeyword)
  const setStatus = useQaFeedFilterStore((state) => state.setStatus)
  const setSelectedCategoryIds = useQaFeedFilterStore((state) => state.setSelectedCategoryIds)
  const setSelectedTagIds = useQaFeedFilterStore((state) => state.setSelectedTagIds)

  return (
    <div className="sticky top-25 z-20 bg-background px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex flex-col gap-6">
        <QaFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          categories={tagCategories}
          selectedCategoryIds={selectedCategoryIds}
          onSelectedCategoryIdsChange={setSelectedCategoryIds}
          selectedTagIds={selectedTagIds}
          onSelectedTagIdsChange={setSelectedTagIds}
        />
        <QaFeedStatusFilter
          filters={[...STATUS_FILTERS]}
          value={status}
          onValueChange={(value: string) => setStatus(value as QaFeedStatus)}
        />
      </div>
    </div>
  )
}

export { QaFeedFilters }
