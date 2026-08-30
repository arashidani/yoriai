'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import imageNone from '@/assets/image-none.svg'
import { Spinner } from '@/components/design-system/ui/spinner'
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
      onAvatarUrlChange(url)
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
    <div className="flex flex-col items-center gap-3">
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
        className="group relative grid size-40.5 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-muted/50 p-1.5 transition-[border-color,background-color,box-shadow,transform] hover:border-primary hover:bg-primary/10 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        data-dragging={isDragging || undefined}
        aria-label="アイコン画像を選択"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="アイコン"
            fill
            unoptimized
            className="rounded-xl object-cover"
          />
        ) : (
          <Image
            src={imageNone}
            alt=""
            width={162}
            height={162}
            className="rounded-xl object-cover"
          />
        )}
        <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <ImagePlus className="size-5" aria-hidden />
        </span>
        {isPending && <Spinner layout="overlay" size="md" label="処理中" className="rounded-2xl" />}
        {isDragging && (
          <span className="absolute inset-1 grid place-items-center rounded-xl bg-primary text-label text-primary-foreground shadow-sm">
            ここにドロップ
          </span>
        )}
      </button>
      <p className="text-center text-paragraph-mini text-muted-foreground">
        クリックまたはドラッグ&ドロップ
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AVATAR_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      {clientError && (
        <p className="text-paragraph-small text-destructive" role="alert">
          {clientError}
        </p>
      )}
    </div>
  )
}
