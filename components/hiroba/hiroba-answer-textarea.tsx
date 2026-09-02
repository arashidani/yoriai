'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/design-system/button'
import type { MentionCandidate } from '@/components/mentions/mention-candidate'
import { RichTextEditor } from '@/components/mentions/rich-text-editor'
import { client } from '@/lib/hono/client'

type HirobaAnswerTextareaProps = {
  postId: string
}

export function HirobaAnswerTextarea({ postId }: HirobaAnswerTextareaProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)

  const loadCandidates = useCallback(async (): Promise<MentionCandidate[]> => {
    const res = await client.api['hiroba-posts'][':id']['mention-candidates'].$get({
      param: { id: postId },
    })
    if (!res.ok) return []
    return (await res.json()).candidates
  }, [postId])

  async function handleSubmit() {
    const trimmedBody = body.trim()
    if (!trimmedBody || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const submission = { body: trimmedBody, mentionedUserIds }
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
        const resBody = await res.json()
        setError('error' in resBody ? resBody.error : '回答の投稿に失敗しました')
        return
      }
      setBody('')
      setMentionedUserIds([])
      router.refresh()
    } catch {
      setError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-2 text-paragraph-small text-destructive">
          {error}
        </p>
      )}

      <div className="flex w-full flex-col overflow-hidden rounded-lg border-2 border-border-3 bg-card transition-colors focus-within:border-border-4">
        <RichTextEditor
          id="hiroba-answer-body"
          boxed={false}
          value={body}
          onChange={setBody}
          onSubmit={() => {
            if (isSubmitting || !body.trim()) return
            void handleSubmit()
          }}
          placeholder="コメントを入力する"
          ariaLabel="コメントを入力する"
          disabled={isSubmitting}
          editorClassName="overflow-y-auto px-4 pt-4 pb-0"
          mentions={{
            selectedIds: mentionedUserIds,
            onSelectedIdsChange: setMentionedUserIds,
            loadCandidates,
          }}
        />
        <div className="flex justify-end px-4 pt-2 pb-4">
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={handleSubmit}
            isDisabled={isSubmitting || !body.trim()}
          >
            送信
          </Button>
        </div>
      </div>
    </div>
  )
}
