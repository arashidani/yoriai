import { Skeleton } from '@/components/ui/skeleton'

function AnswerableQuestionsFallback() {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-input bg-background xl:sticky xl:top-0 xl:block xl:h-svh xl:self-start">
      <div className="p-5">
        <h2 className="border-b border-input pb-3 font-heading text-paragraph-small font-bold">
          あなたが回答できそうな質問
        </h2>
        <ul className="flex flex-col gap-1 pt-2" role="status" aria-label="読み込み中">
          {['sidebar-1', 'sidebar-2', 'sidebar-3'].map((key) => (
            <li key={key} className="-mx-2 flex gap-3 rounded-lg p-2" aria-hidden>
              <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export { AnswerableQuestionsFallback }
