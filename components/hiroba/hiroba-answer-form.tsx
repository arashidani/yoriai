'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { type MentionCandidate, MentionTextarea } from '@/components/mentions/mention-textarea'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/hono/client'
import { type CreateHirobaAnswerInput, createHirobaAnswerSchema } from '@/lib/schemas/hiroba'

type HirobaAnswerFormProps = {
  postId: string
}

export function HirobaAnswerForm({ postId }: HirobaAnswerFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHirobaAnswerInput>({
    resolver: zodResolver(createHirobaAnswerSchema),
    defaultValues: { body: '', mentionedUserIds: [] },
  })

  const loadCandidates = useCallback(async (): Promise<MentionCandidate[]> => {
    const res = await client.api['hiroba-posts'][':id']['mention-candidates'].$get({
      param: { id: postId },
    })
    if (!res.ok) return []
    return (await res.json()).candidates
  }, [postId])

  async function onSubmit(data: CreateHirobaAnswerInput) {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setError(null)

    const submission = { ...data, mentionedUserIds }
    const requestBody = JSON.stringify(submission)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api['hiroba-posts'][':id'].answers.$post({
        param: { id: postId },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: submission,
      })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : '回答の投稿に失敗しました')
        return
      }
      reset()
      setMentionedUserIds([])
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
      <Controller
        name="body"
        control={control}
        render={({ field }) => (
          <MentionTextarea
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            selectedIds={mentionedUserIds}
            onSelectedIdsChange={setMentionedUserIds}
            loadCandidates={loadCandidates}
            placeholder="回答を入力してください"
            disabled={isSubmitting}
            ariaInvalid={!!errors.body}
          />
        )}
      />
      {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '回答する'}
      </Button>
    </form>
  )
}
