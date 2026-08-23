'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Sparkles, X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/design-system/button'
import { FormField } from '@/components/design-system/form-field'
import { SelectCategories } from '@/components/design-system/ui/select-categories'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { type CreatePostInput, createPostSchema } from '@/lib/schemas/post'
import { cn } from '@/lib/utils'

type QuestionFormModalProps = {
  onSubmit: (data: CreatePostInput) => Promise<void>
  onClose?: () => void
  isSubmitting?: boolean
  error?: string
  tagCategories?: {
    id: string
    name: string
    tags: { id: string; name: string }[]
  }[]
  isTagCategoriesLoading?: boolean
}

export function QuestionFormModal({
  onSubmit,
  onClose,
  isSubmitting = false,
  error,
  tagCategories = [],
  isTagCategoriesLoading = false,
}: QuestionFormModalProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', body: '', tagId: undefined },
  })
  const tagOptions = tagCategories.flatMap(({ tags }) => tags)

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-heading-4">質問を投稿する</h2>
        {onClose && (
          <button
            type="button"
            aria-label="閉じる"
            disabled={isSubmitting}
            onClick={isSubmitting ? undefined : onClose}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted',
              isSubmitting && 'pointer-events-none opacity-50',
            )}
          >
            <X className="size-6" />
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
              className="h-36 p-3"
              {...register('body')}
              aria-invalid={!!errors.body}
            />
            {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
          </div>
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="tagId">
              <p className="text-sm font-bold text-foreground">カテゴリー</p>
            </Label>
            <div className="flex w-full items-center gap-2 rounded-lg bg-informative-background p-3">
              <Sparkles className="size-4 shrink-0 text-informative" aria-hidden />
              <p className="text-paragraph-small font-bold text-informative">
                カテゴリーを未選択で投稿した場合、AIが自動でカテゴリタグを付与します
              </p>
            </div>
            <Controller
              name="tagId"
              control={control}
              render={({ field }) => (
                <SelectCategories
                  id="tagId"
                  categories={tagOptions}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value ?? undefined)}
                  placeholder={
                    isTagCategoriesLoading ? 'カテゴリーを読み込み中' : '手動でカテゴリーを選択'
                  }
                  noneLabel={
                    isTagCategoriesLoading ? 'カテゴリーを読み込み中' : '手動でカテゴリーを選択'
                  }
                  disabled={isTagCategoriesLoading}
                />
              )}
            />
          </div>
          <div className="text-paragraph-mini text-secondary-foreground">
            <p>※投稿内容の確認のため反映に30秒ほどかかる場合があります。</p>
            <p>※不適切と判断された投稿は運営により削除される可能性がございます。</p>
            <p>※匿名アイコン・匿名ユーザーネームがランダムで付与されます。</p>
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
