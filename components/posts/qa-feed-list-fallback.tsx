import { Skeleton } from '@/components/ui/skeleton'

function QaPostListSkeleton() {
  return (
    <div
      className="flex w-full flex-col divide-y divide-border"
      role="status"
      aria-label="読み込み中"
    >
      {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
        <div key={key} className="flex flex-col gap-4 p-6" aria-hidden>
          <div className="flex items-start gap-4">
            <Skeleton className="size-12.5 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function QaFeedListFallback() {
  return (
    <div className="flex-1 scroll-mt-[17rem] px-8 py-6">
      <QaPostListSkeleton />
    </div>
  )
}

export { QaFeedListFallback, QaPostListSkeleton }
