'use client'

import { Trash2 } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type ConfirmDeleteButtonProps = {
  triggerLabel: string
  title: string
  description: React.ReactNode
  confirmLabel?: string
  disabled?: boolean
  /** 確定時に実行する処理。Promise を返す場合は完了までダイアログを閉じない。 */
  onConfirm: () => unknown
}

export function ConfirmDeleteButton({
  triggerLabel,
  title,
  description,
  confirmLabel = '削除する',
  disabled = false,
  onConfirm,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await onConfirm()
    } catch {
      // エラー通知は呼び出し側のミューテーションで行う
    }
    setPending(false)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={triggerLabel}
          >
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
