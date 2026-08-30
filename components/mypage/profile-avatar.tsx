'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import imageNone from '@/assets/image-none.svg'
import imagePlus from '@/assets/plus-round.svg'
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
  const [isDragging, setIsDragging] = useState(false)
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

  async function handleFile(file: File | undefined) {
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0])
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (!isPending) void handleFile(event.dataTransfer.files[0])
  }

  return (
    <div className="shrink-0">
      <div className="group relative size-35">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            unoptimized
            className="rounded-lg object-cover transition-opacity group-has-[button:hover]:opacity-50"
          />
        ) : (
          <Image
            src={imageNone}
            alt=""
            width={140}
            height={140}
            className="size-35 rounded-lg object-cover transition-opacity group-has-[button:hover]:opacity-50"
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
            onDragEnter={(event) => {
              event.preventDefault()
              if (!isPending && event.dataTransfer.types.includes('Files')) setIsDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (
                !(event.relatedTarget instanceof Node) ||
                !event.currentTarget.contains(event.relatedTarget)
              ) {
                setIsDragging(false)
              }
            }}
            onDrop={handleDrop}
            className="absolute inset-0 overflow-hidden rounded-lg hover:cursor-pointer disabled:cursor-not-allowed"
            data-dragging={isDragging || undefined}
            aria-label="アイコン画像を選択"
          />
        )}
        {isEditable && (
          <span className="pointer-events-none absolute -right-4 bottom-2.5 transition-opacity group-has-[button:hover]:opacity-50">
            <Image src={imagePlus} alt="" width={48} height={48} aria-hidden />
          </span>
        )}
        {isDragging && (
          <span className="pointer-events-none absolute inset-1 grid place-items-center rounded-md bg-primary text-label-small text-primary-foreground">
            ドロップ
          </span>
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
