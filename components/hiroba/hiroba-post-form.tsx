'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CreateHirobaPostInput, createHirobaPostSchema } from '@/lib/schemas/hiroba'

type HirobaPostFormProps = {
  onSubmit: (data: CreateHirobaPostInput) => Promise<void>
  isSubmitting?: boolean
}

export function HirobaPostForm({ onSubmit, isSubmitting = false }: HirobaPostFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<CreateHirobaPostInput>({
    resolver: zodResolver(createHirobaPostSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          placeholder="投稿のタイトルを入力してください"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          placeholder="投稿の内容を入力してください"
          rows={8}
          {...register('body')}
          aria-invalid={!!errors.body}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting || isFormSubmitting}>
        {isSubmitting || isFormSubmitting ? '送信中...' : '投稿する'}
      </Button>
    </form>
  )
}
