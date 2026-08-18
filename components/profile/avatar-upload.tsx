'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/hono/client'
import {
  ACCEPTED_AVATAR_TYPES,
  prepareAvatarFileForUpload,
  AvatarClientValidationError,
} from '@/lib/image/process-avatar-client'

/**
 * プラットフォームのリクエストボディ上限超過など、Honoまで到達せずに
 * インフラ側が返す非JSONエラー（HTML等）が来てもres.json()で例外を投げないようにする
 */
async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  if (!res.headers.get('content-type')?.includes('application/json')) return fallback
  try {
    const body: unknown = await res.json()
    return body && typeof body === 'object' && 'error' in body ? String(body.error) : fallback
  } catch {
    return fallback
  }
}

async function uploadAvatarRequest(file: File): Promise<string | null> {
  const res = await client.api.users.me.avatar.$put({ form: { file } })
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'アップロードに失敗しました'))
  }
  const { user } = await res.json()
  return user.avatarUrl
}

async function deleteAvatarRequest(): Promise<string | null> {
  const res = await client.api.users.me.avatar.$delete()
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, '削除に失敗しました'))
  }
  const { user } = await res.json()
  return user.avatarUrl
}

export function AvatarUpload({
  avatarUrl,
  onAvatarUrlChange,
}: {
  avatarUrl: string | null
  onAvatarUrlChange: (avatarUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: uploadAvatarRequest,
    onMutate: () => setClientError(null),
    onSuccess: (url) => {
      onAvatarUrlChange(url)
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAvatarRequest,
    onMutate: () => setClientError(null),
    onSuccess: (url) => {
      onAvatarUrlChange(url)
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const isPending = uploadMutation.isPending || deleteMutation.isPending || isPreparing

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setClientError(null)
    setIsPreparing(true)
    try {
      const preparedFile = await prepareAvatarFileForUpload(file)
    } catch (error) {
      if (error instanceof AvatarClientValidationError) {
        setClientError(error.message)
      } else {
        setClientError('画像の圧縮に失敗しました。別の画像でお試しください')
      }
    } finally {
      setIsPreparing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border border-input bg-muted">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="アイコン"
            fill
            unoptimized
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-6 animate-spin" aria-label="処理中" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AVATAR_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          画像を選択
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            削除
          </Button>
        )}
      </div>
      {clientError && (
        <p className="text-paragraph-small text-destructive" role="alert">
          {clientError}
        </p>
      )}
    </div>
  )
}
