'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { TextareaFocus } from '@/components/design-system/ui/textarea-focus'
import { client } from '@/lib/hono/client'

type HirobaAnswerTextareaProps = {
  postId: string
}

export function HirobaAnswerTextarea({ postId }: HirobaAnswerTextareaProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)

  async function handleSubmit({ body }: { title: string; body: string; image: File | null }) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const requestBody = JSON.stringify({ body })
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api['hiroba-posts'][':id'].answers.$post({
        param: { id: postId },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: { body },
      })
      if (!res.ok) {
        const resBody = await res.json()
        setError('error' in resBody ? resBody.error : '回答の投稿に失敗しました')
        return
      }
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

      <TextareaFocus onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
