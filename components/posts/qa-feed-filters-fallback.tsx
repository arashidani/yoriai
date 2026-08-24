import { Skeleton } from '@/components/ui/skeleton'

function QaFeedFiltersFallback() {
  return (
    <div className="sticky top-25 z-20 bg-background px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex flex-col gap-6" role="status" aria-label="読み込み中">
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-12 w-full md:flex-1" />
          <Skeleton className="h-12 w-full md:w-64 md:shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export { QaFeedFiltersFallback }
