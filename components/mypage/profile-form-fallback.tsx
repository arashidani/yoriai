import { Spinner } from '@/components/ui/spinner'

function ProfileFormFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" aria-label="読み込み中" />
    </div>
  )
}

export { ProfileFormFallback }
