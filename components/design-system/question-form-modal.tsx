'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/design-system/button'
import { FormField } from '@/components/design-system/form-field'
import { CloseIcon } from '@/components/icons/close-icon'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { type CreatePostInput, createPostSchema } from '@/lib/schemas/post'
import { cn } from '@/lib/utils'

type QuestionFormModalProps = {
  displayName: string
  avatarUrl?: string
  onSubmit: (data: CreatePostInput) => Promise<void>
  onClose?: () => void
  isSubmitting?: boolean
  error?: string
}

export function QuestionFormModal({
  displayName,
  avatarUrl,
  onSubmit,
  onClose,
  isSubmitting = false,
  error,
}: QuestionFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  })

  return (
    <div className="flex w-full max-w-[650px] flex-col gap-4 rounded-xl border border-border bg-background p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-heading-4">質問を投稿する</h2>
        {onClose && (
          <button
            type="button"
            aria-label="閉じる"
            disabled={isSubmitting}
            onClick={isSubmitting ? undefined : onClose}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted',
              isSubmitting && 'pointer-events-none opacity-50',
            )}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <Separator />
      {isSubmitting ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-8" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-center gap-4">
            <span className="size-[50px] shrink-0 overflow-clip rounded-md bg-informative">
              {avatarUrl && (
                // biome-ignore lint/performance/noImgElement: アバターはDB由来の動的URLのためnext/imageの最適化対象にしない
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              )}
            </span>
            <p className="text-paragraph font-medium">{displayName}</p>
          </div>
          <FormField
            label="質問のタイトル"
            error={errors.title?.message}
            inputProps={{
              id: 'title',
              placeholder: '例：キングオブタイムの有給申請について',
              ...register('title'),
            }}
          />
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="body">
              <p className="text-sm font-bold text-foreground">質問の本文</p>
            </Label>
            <Textarea
              id="body"
              placeholder="お疲れ様です！！！質問したいのですが..."
              className="h-32 p-3"
              {...register('body')}
              aria-invalid={!!errors.body}
            />
            {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
            <p className="text-paragraph-mini text-secondary-foreground">
              ※運営が適切な投稿ではないと判断した場合強制的に削除される可能性がございます。
            </p>
          </div>
          <div className="flex w-full items-center gap-2 rounded-lg bg-informative-background p-3">
            <Sparkles className="size-4 shrink-0 text-informative" aria-hidden />
            <p className="text-paragraph-small font-bold text-informative">
              AIが自動でカテゴリタグを付与し、回答されやすくします。
            </p>
          </div>
          <Button
            type="submit"
            isDisabled={isSubmitting || isFormSubmitting}
            className="flex items-center justify-center gap-2 px-6 py-4"
          >
            <Pencil className="size-4" />
            投稿する
          </Button>
        </form>
      )}
    </div>
  )
}
