'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/design-system/button'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { QuestionCompletionModal } from '@/components/design-system/question-completion-modal'
import { QuestionFormModal } from '@/components/design-system/question-form-modal'
import { QuestionTagRecoveryModal } from '@/components/design-system/question-tag-recovery-modal'
import { ActionButtons } from '@/components/design-system/ui/action-buttons'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { client } from '@/lib/hono/client'
import type { CreatePostInput } from '@/lib/schemas/post'

type Step = 'form' | 'tag-recovery' | 'completion'

async function fetchQuestionTags() {
  const res = await client.api['question-tags'].$get()
  if (!res.ok) throw new Error('カテゴリーの取得に失敗しました')
  return (await res.json()).categories
}
export function QuestionComposeDialog() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [createdQuestionId, setCreatedQuestionId] = useState<string | null>(null)
  const [formInstance, setFormInstance] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)
  const tagCategoriesQuery = useQuery({
    queryKey: ['question-tags'],
    queryFn: fetchQuestionTags,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  function resetState() {
    setStep('form')
    setError(null)
    setCreatedQuestionId(null)
    idempotencyKeyRef.current = null
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setFormInstance((instance) => instance + 1)
    } else {
      if (isSubmittingRef.current || step === 'tag-recovery') return
      if (step === 'completion') {
        queryClient.invalidateQueries({ queryKey: ['questions'] })
      }
      resetState()
    }
    setOpen(next)
  }

  function handleClose() {
    handleOpenChange(false)
  }

  async function handleSubmit(data: CreatePostInput) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const requestBody = JSON.stringify(data)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.questions.$post({
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : '投稿に失敗しました')
        return
      }

      const body = await res.json()
      if (body.moderation.isHidden) {
        setError('AIによる確認の結果、この質問は公開されませんでした。')
        return
      }

      setCreatedQuestionId(body.question.id)
      setStep(body.tagAssignment === 'failed' ? 'tag-recovery' : 'completion')
    } catch {
      setError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  async function assignTag(input: { mode: 'ai' } | { mode: 'manual'; tagId: string }) {
    if (!createdQuestionId) throw new Error('投稿情報を確認できませんでした')
    const res = await client.api.questions[':id']['tag-assignment'].$post({
      param: { id: createdQuestionId },
      json: input,
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error('error' in body ? body.error : 'タグの付与に失敗しました')
    }
    setStep('completion')
  }

  function handleConfirm() {
    if (!createdQuestionId) return
    setOpen(false)
    resetState()
    router.push(`/posts/${createdQuestionId}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal modal="trap-focus">
      <ActionButtons
        primaryAction={
          <DialogTrigger
            render={
              <Button
                type="button"
                size="large"
                className="shrink-0"
                leftIcon={<IconPencil className="size-full" />}
              >
                質問する
              </Button>
            }
          />
        }
        secondaryLabel="Q&A管理"
        secondaryHref="/my-questions"
      />
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-3xl"
      >
        {step === 'form' ? (
          <QuestionFormModal
            key={formInstance}
            onSubmit={handleSubmit}
            onClose={handleClose}
            isSubmitting={isSubmitting}
            error={error ?? undefined}
            tagCategories={tagCategoriesQuery.data}
            isTagCategoriesLoading={tagCategoriesQuery.isPending}
          />
        ) : step === 'tag-recovery' ? (
          <QuestionTagRecoveryModal
            tagCategories={tagCategoriesQuery.data ?? []}
            onRetry={() => assignTag({ mode: 'ai' })}
            onAssignManually={(tagId) => assignTag({ mode: 'manual', tagId })}
          />
        ) : (
          <QuestionCompletionModal onConfirm={handleConfirm} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
