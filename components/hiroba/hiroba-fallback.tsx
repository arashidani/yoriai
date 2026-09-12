import { Skeleton } from '@/components/ui/skeleton'

/** ひろば詳細のフィード（カバー、見出し、投稿カード）の読み込み中表示。 */
function HirobaFeedFallback() {
  return (
    <div className="min-w-0 flex-1" role="status" aria-label="ひろばを読み込み中">
      <section aria-hidden>
        <Skeleton className="h-25 rounded-lg" />

        <div className="relative -mt-10 flex items-end justify-between gap-4 pl-6 mb-8">
          <div>
            <Skeleton className="size-20 rounded-lg" />
            <Skeleton className="mt-3 h-8 w-48" />
          </div>
          <div className="flex flex-wrap gap-3 pb-1">
            <Skeleton className="h-12 w-28 rounded-lg" />
            <Skeleton className="h-12 w-28 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="px-3 space-y-4" aria-hidden>
        <Skeleton className="h-24 w-full rounded-lg" />

        <div className="grid min-w-0 grid-cols-1 gap-4">
          {['post-1', 'post-2', 'post-3'].map((key) => (
            <div key={key} className="space-y-3 rounded-lg border-2 border-border-2 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** ひろば詳細サイドバー（AI要約・人気のひろば・人気の投稿）の読み込み中表示。 */
function HirobaSidebarFallback() {
  return (
    <aside
      className="hidden max-w-[320px] shrink-0 space-y-4 xl:sticky xl:top-6 xl:block xl:self-start"
      aria-hidden
    >
      <Skeleton className="h-28 w-[320px] rounded-lg" />
      <Skeleton className="h-52 w-[320px] rounded-lg" />
      <Skeleton className="h-52 w-[320px] rounded-lg" />
    </aside>
  )
}

export { HirobaFeedFallback, HirobaSidebarFallback }
