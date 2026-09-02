'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  AnswerForm as AnswerFormUI,
  answerFormTextareaClassName,
} from '@/components/design-system/ui/answer-form'
import type { MentionCandidate } from '@/components/mentions/mention-candidate'
import { RichTextEditor } from '@/components/mentions/rich-text-editor'
import { client } from '@/lib/hono/client'
import { type CreateAnswerInput, createAnswerSchema } from '@/lib/schemas/answer'

type AnswerFormProps = {
  postId: string
}

export function AnswerForm({ postId }: AnswerFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPostUnavailable, setIsPostUnavailable] = useState(false)
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnswerInput>({
    resolver: zodResolver(createAnswerSchema),
    defaultValues: { body: '', mentionedUserIds: [] },
  })

  const body = watch('body')
  const canSubmit = body.trim().length > 0
  const isInputDisabled = isSubmitting || isPostUnavailable
  const isSubmitDisabled = isInputDisabled || !canSubmit

  const loadCandidates = useCallback(async (): Promise<MentionCandidate[]> => {
    const res = await client.api.questions[':id']['mention-candidates'].$get({
      param: { id: postId },
    })
    if (!res.ok) return []
    return (await res.json()).candidates
  }, [postId])

  async function onSubmit(data: CreateAnswerInput) {
    if (isSubmittingRef.current || isPostUnavailable || !data.body.trim()) return
    isSubmittingRef.current = true
    setError(null)

    const submission = { ...data, mentionedUserIds }
    const requestBody = JSON.stringify(submission)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.questions[':id'].answers.$post({
        param: { id: postId },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: submission,
      })
      if (!res.ok) {
        const body = await res.json()
        if (res.status === 404 || res.status === 410) setIsPostUnavailable(true)
        if (res.status === 409) router.refresh()
        setError('error' in body ? body.error : '回答の投稿に失敗しました')
        return
      }
      reset()
      setMentionedUserIds([])
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
          submitLabel={isSubmitting ? '送信中...' : '回答'}
          disabled={isSubmitDisabled}
          textarea={
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="answer-body"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onSubmit={() => {
                    if (isSubmitDisabled) return
                    void handleSubmit(onSubmit)()
                  }}
                  placeholder="回答を入力する"
                  ariaLabel="回答を入力する"
                  disabled={isInputDisabled}
                  ariaInvalid={!!errors.body}
                  editorClassName={answerFormTextareaClassName}
                  toolbarBlocks
                  mentions={{
                    selectedIds: mentionedUserIds,
                    onSelectedIdsChange: setMentionedUserIds,
                    loadCandidates,
                  }}
                />
              )}
            />
          }
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>
    </section>
  )
}
