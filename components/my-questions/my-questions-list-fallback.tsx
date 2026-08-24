import { Spinner } from '@/components/ui/spinner'

function MyQuestionsListFallback() {
  return (
    <div className="flex w-full justify-center py-16">
      <Spinner className="size-8 text-primary" aria-label="読み込み中" />
    </div>
  )
}

export { MyQuestionsListFallback }
