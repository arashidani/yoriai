'use client'

import { useParams, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { HirobaPostForm } from '@/components/hiroba/hiroba-post-form'
import { client } from '@/lib/hono/client'
import {
  HirobaPostImageClientProcessingError,
  HirobaPostImageClientValidationError,
  prepareHirobaPostImageForUpload,
} from '@/lib/image/process-hiroba-post-image-client'
import type { CreateHirobaPostInput } from '@/lib/schemas/hiroba'

export default function NewHirobaPostPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const idempotencyKeyRef = useRef<{ key: string; requestBody: string } | null>(null)

  async function handleSubmit(data: CreateHirobaPostInput, image: File | null) {
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const requestBody = JSON.stringify(data)
    if (idempotencyKeyRef.current?.requestBody !== requestBody) {
      idempotencyKeyRef.current = { key: crypto.randomUUID(), requestBody }
    }

    try {
      const res = await client.api.hiroba[':slug'].posts.$post({
        param: { slug: params.slug },
        header: { 'idempotency-key': idempotencyKeyRef.current.key },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : '投稿に失敗しました')
        return
      }

      if (image) {
        const { post } = await res.json()
        const preparedImage = await prepareHirobaPostImageForUpload(image)
        const imageRes = await client.api['hiroba-posts'][':id'].image.$put({
          param: { id: post.id },
          form: { file: preparedImage },
        })
        if (!imageRes.ok) {
          const body = await imageRes.json()
          setError('error' in body ? body.error : '画像のアップロードに失敗しました')
          return
        }
      }

      router.push(`/hiroba/${params.slug}`)
    } catch (error) {
      if (
        error instanceof HirobaPostImageClientValidationError ||
        error instanceof HirobaPostImageClientProcessingError
      ) {
        setError(error.message)
        return
      }
      setError('通信に失敗しました。画面をリロードせず、もう一度お試しください')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">投稿する</h1>
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <HirobaPostForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
