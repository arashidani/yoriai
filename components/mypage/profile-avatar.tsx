'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import imageNone from '@/assets/image-none.svg'
import plusRound from '@/assets/plus-round.svg'
import { client } from '@/lib/hono/client'
import {
  ACCEPTED_AVATAR_TYPES,
  AvatarClientValidationError,
  prepareAvatarFileForUpload,
} from '@/lib/image/process-avatar-client'

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
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'アップロードに失敗しました'))
  const { user } = await res.json()
  return user.avatarUrl
}

async function deleteAvatarRequest(): Promise<string | null> {
  const res = await client.api.users.me.avatar.$delete()
  if (!res.ok) throw new Error(await parseErrorMessage(res, '削除に失敗しました'))
  const { user } = await res.json()
  return user.avatarUrl
}

export function ProfileAvatar({
  avatarUrl = null,
  onAvatarUrlChange,
  isEditable = false,
}: {
  avatarUrl?: string | null
  onAvatarUrlChange?: (avatarUrl: string | null) => void
  isEditable?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 再アップロード時は先に既存画像を削除してから新しい画像を保存する。
      if (avatarUrl) await deleteAvatarRequest()
      return uploadAvatarRequest(file)
    },
    onMutate: () => setClientError(null),
    onSuccess: (url) => {
      onAvatarUrlChange?.(url)
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const isPending = uploadMutation.isPending || isPreparing

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setClientError(null)
    setIsPreparing(true)
    try {
      const preparedFile = await prepareAvatarFileForUpload(file)
      uploadMutation.mutate(preparedFile)
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
    <div className="shrink-0">
      <div className="relative size-35">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill unoptimized className="rounded-lg object-cover" />
        ) : (
          <Image
            src={imageNone}
            alt=""
            width={140}
            height={140}
            className="size-35 rounded-lg object-cover"
          />
        )}

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
            <Loader2 className="size-6 animate-spin" aria-label="処理中" />
          </div>
        )}

        {isEditable && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="absolute -right-3.25 bottom-[6.5px] cursor-pointer disabled:cursor-not-allowed"
            aria-label="アイコン画像を選択"
          >
            <Image src={plusRound} alt="" width={41} height={41} />
          </button>
        )}
      </div>

      {isEditable && (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {clientError && (
        <p className="text-paragraph-small text-destructive" role="alert">
          {clientError}
        </p>
      )}
    </div>
  )
}
