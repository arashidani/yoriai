import { create } from 'zustand'

export type QaFeedStatusFilter = 'all' | 'open' | 'resolved'

const DEFAULT_STATE = {
  keyword: '',
  status: 'all' as QaFeedStatusFilter,
  selectedCategoryIds: [] as string[],
  selectedTagIds: [] as string[],
  page: 1,
}

type QaFeedFilterState = typeof DEFAULT_STATE & {
  setKeyword: (keyword: string) => void
  setStatus: (status: QaFeedStatusFilter) => void
  setSelectedCategoryIds: (categoryIds: string[]) => void
  setSelectedTagIds: (tagIds: string[]) => void
  setPage: (page: number) => void
  resetFilters: () => void
}

export const useQaFeedFilterStore = create<QaFeedFilterState>((set) => ({
  ...DEFAULT_STATE,
  setKeyword: (keyword) => set({ keyword, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setSelectedCategoryIds: (selectedCategoryIds) => set({ selectedCategoryIds, page: 1 }),
  setSelectedTagIds: (selectedTagIds) => set({ selectedTagIds, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(DEFAULT_STATE),
}))
