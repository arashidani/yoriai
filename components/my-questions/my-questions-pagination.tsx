'use client'

import { Pagination } from '@/components/design-system/ui/pagination'
import { useMyQuestionsNavigation } from '@/components/my-questions/my-questions-navigation'
import { cn } from '@/lib/utils'

type MyQuestionsPaginationProps = {
  className?: string
  page: number
  totalPages: number
  total: number
  pageSize: number
  tab: 'posted' | 'saved'
}

export function MyQuestionsPagination({
  className,
  page,
  totalPages,
  total,
  pageSize,
  tab,
}: MyQuestionsPaginationProps) {
  const { navigate, isPending } = useMyQuestionsNavigation()
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  function handlePageChange(nextPage: number) {
    navigate(`/my-questions?tab=${tab}&page=${nextPage}`)
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Pagination
        page={page}
        totalPages={totalPages}
        disabled={isPending}
        onPageChange={handlePageChange}
      />
      <p className="text-paragraph-small text-muted-foreground">
        {total}件中 {start}~{end}件を表示
      </p>
    </div>
  )
}
