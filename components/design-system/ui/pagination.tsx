import { ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'

import { cn } from '@/lib/utils'

type PageItem = number | 'ellipsis'

function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

type PaginationProps = {
  className?: string
  page: number
  totalPages: number
  disabled?: boolean
  onPageChange: (page: number) => void
}

function Pagination({
  className,
  page,
  totalPages,
  disabled = false,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pageItems = getPageItems(page, totalPages)

  return (
    <nav
      data-slot="pagination"
      aria-label="ページ送り"
      className={cn('flex items-center gap-2', className)}
    >
      <button
        type="button"
        aria-label="前へ"
        disabled={page <= 1 || disabled}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex size-9 items-center justify-center rounded-lg text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      {pageItems.map((item, index) => {
        const key =
          item === 'ellipsis'
            ? `ellipsis-${String(pageItems[index - 1])}-${String(pageItems[index + 1])}`
            : item

        if (item === 'ellipsis') {
          return (
            <span
              key={key}
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground"
            >
              <Ellipsis className="size-4" />
            </span>
          )
        }

        const isActive = item === page

        return (
          <button
            key={key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            disabled={disabled}
            onClick={isActive ? undefined : () => onPageChange(item)}
            className={cn(
              'inline-flex min-h-9 w-8.5 items-center justify-center rounded-lg text-paragraph-small disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-primary font-bold text-primary-foreground shadow-xs'
                : 'font-medium text-foreground',
            )}
          >
            {item}
          </button>
        )
      })}
      <button
        type="button"
        aria-label="次へ"
        disabled={page >= totalPages || disabled}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex size-9 items-center justify-center rounded-lg text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}

export type { PageItem, PaginationProps }
export { getPageItems, Pagination }
