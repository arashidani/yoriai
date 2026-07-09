'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CreatePostInput, createPostSchema } from '@/lib/schemas/post'

type PostFormProps = {
  onSubmit: (data: CreatePostInput) => Promise<void>
  isSubmitting?: boolean
}

export function PostForm({ onSubmit, isSubmitting = false }: PostFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          placeholder="質問のタイトルを入力してください"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          placeholder="質問の詳細を入力してください"
          rows={8}
          {...register('body')}
          aria-invalid={!!errors.body}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '投稿する'}
      </Button>
    </form>
  )
}
