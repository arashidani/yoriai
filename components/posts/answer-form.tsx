'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnswerForm as AnswerFormUI } from '@/components/design-system/ui/answer-form'
import { client } from '@/lib/hono/client'
import { type CreateAnswerInput, createAnswerSchema } from '@/lib/schemas/answer'

type AnswerFormProps = {
  postId: string
}

export function AnswerForm({ postId }: AnswerFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPostUnavailable, setIsPostUnavailable] = useState(false)
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
    if (isSubmittingRef.current || isPostUnavailable) return
    isSubmittingRef.current = true
    setError(null)

    const requestBody = JSON.stringify(data)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.questions[':id'].answers.$post({
        param: { id: postId },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        if (res.status === 404 || res.status === 410) setIsPostUnavailable(true)
        if (res.status === 409) router.refresh()
        setError('error' in body ? body.error : '回答の投稿に失敗しました')
        return
      }
      reset()
      const body = await res.json()
      if (body.moderation.isHidden) {
        window.alert('AIによる確認の結果、この回答は公開されませんでした。')
      }
      router.refresh()
    } catch {
      setError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <section id="answer-form" className="w-full scroll-mt-8">
      <div className="space-y-3">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {isPostUnavailable && (
          <Link href="/" className="text-sm font-medium text-primary underline underline-offset-4">
            一覧に戻る
          </Link>
        )}
        <AnswerFormUI
          onSubmit={handleSubmit(onSubmit)}
          placeholder="回答を入力する"
          submitLabel={isSubmitting ? '送信中...' : '送信'}
          disabled={isSubmitting || isPostUnavailable}
          textareaProps={{ rows: 4, ...register('body'), 'aria-invalid': !!errors.body }}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>
    </section>
  )
}
