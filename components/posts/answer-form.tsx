'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { client } from '@/lib/hono/client'
import { type CreateAnswerInput, createAnswerSchema } from '@/lib/schemas/answer'

type AnswerFormProps = {
  postId: string
}

export function AnswerForm({ postId }: AnswerFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnswerInput>({
    resolver: zodResolver(createAnswerSchema),
  })

  async function onSubmit(data: CreateAnswerInput) {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setError(null)

    const requestBody = JSON.stringify(data)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.posts[':id'].answers.$post({
        param: { id: postId },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : '回答の投稿に失敗しました')
        return
      }
      reset()
      router.refresh()
    } catch {
      setError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Textarea
        placeholder="回答を入力してください"
        rows={4}
        {...register('body')}
        aria-invalid={!!errors.body}
      />
      {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '回答する'}
      </Button>
    </form>
  )
}
