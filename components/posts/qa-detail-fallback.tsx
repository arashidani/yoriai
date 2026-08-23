import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

function QaDetailQuestionFallback() {
  return (
    <div className="flex w-full flex-col gap-3" role="status" aria-label="質問を読み込み中">
      <div className="flex w-full flex-col gap-6" aria-hidden>
        <div className="flex w-full items-center gap-4">
          <Skeleton className="size-12.5 shrink-0 rounded-md" />
          <div className="flex w-full flex-1 items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

function QaDetailAnswerSectionFallback() {
  return (
    <div className="flex w-full flex-col gap-2" role="status" aria-label="回答フォームを読み込み中">
      <div className="flex w-full flex-col gap-4" aria-hidden>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}

function QaDetailAnswersFallback() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="回答一覧を読み込み中">
      <Separator />
      <div className="space-y-6" aria-hidden>
        {['answer-1', 'answer-2'].map((key) => (
          <div key={key} className="flex items-start gap-4">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QaDetailContentFallback() {
  return (
    <>
      <QaDetailQuestionFallback />
      <QaDetailAnswerSectionFallback />
      <QaDetailAnswersFallback />
    </>
  )
}

export {
  QaDetailAnswerSectionFallback,
  QaDetailAnswersFallback,
  QaDetailContentFallback,
  QaDetailQuestionFallback,
}
