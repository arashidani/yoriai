import Image from 'next/image'
import mascotImage from '@/assets/mascots/moscot_happy.svg'
import { Button } from '@/components/design-system/button'
import { IconClose } from '@/components/design-system/icons/icon-close'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { Separator } from '@/components/ui/separator'

type QuestionCompletionModalProps = {
  onConfirm: () => void
  onClose?: () => void
}

export function QuestionCompletionModal({ onConfirm, onClose }: QuestionCompletionModalProps) {
  return (
    <div className="flex h-[586px] w-full max-w-[650px] flex-col gap-4 rounded-xl border border-border bg-background p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-heading-4">質問を投稿する</h2>
        {onClose && (
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <IconClose className="text-foreground" />
          </button>
        )}
      </div>
      <Separator />
      <div className="flex flex-1 flex-col items-center justify-end gap-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <ToolChip side="bottom" text="しっかり届けたワン！" />
            <Image src={mascotImage} alt="" className="h-[174px] w-[219px]" priority />
          </div>
          <p className="font-heading text-heading-4 text-muted-foreground">
            質問の投稿が完了しました
          </p>
        </div>
        <div className="flex w-full flex-col gap-4">
          <Button type="button" onClick={onConfirm} className="px-6 py-4">
            投稿した質問を確認する
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="px-6 py-4">
            閉じる
          </Button>
        </div>
      </div>
    </div>
  )
}
