import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PageItem = number | 'ellipsis'

export function getPageItems(page: number, totalPages: number): PageItem[] {
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

type QaPaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  disabled?: boolean
  onPageChange: (page: number) => void
}

export function QaPagination({
  page,
  totalPages,
  total,
  pageSize,
  disabled = false,
  onPageChange,
}: QaPaginationProps) {
  if (total < 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pageItems = getPageItems(page, totalPages)

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {totalPages > 1 && (
        <nav aria-label="ページ送り" className="flex flex-wrap items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-foreground"
            aria-label="前へ"
            disabled={page <= 1 || disabled}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft />
          </Button>
          {pageItems.map((item, index) => {
            const key =
              item === 'ellipsis'
                ? `ellipsis-${String(pageItems[index - 1])}-${String(pageItems[index + 1])}`
                : item

            return item === 'ellipsis' ? (
              <span key={key} className="px-1 text-paragraph-small text-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={key}
                type="button"
                variant="ghost"
                size="sm"
                className={cn('min-w-7 text-foreground', item === page && 'font-bold')}
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled}
                onClick={item === page ? undefined : () => onPageChange(item)}
              >
                {item}
              </Button>
            )
          })}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-foreground"
            aria-label="次へ"
            disabled={page >= totalPages || disabled}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight />
          </Button>
        </nav>
      )}
      <p className="text-paragraph-small text-muted-foreground">
        {total}件中 {from}~{to}件を表示
      </p>
    </div>
  )
}
