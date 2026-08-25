'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type CreateHirobaPostInput, createHirobaPostSchema } from '@/lib/schemas/hiroba'
import { cn } from '@/lib/utils'

type HirobaPostFormProps = {
  onSubmit: (data: CreateHirobaPostInput, image: File | null) => Promise<void>
  isSubmitting?: boolean
}

export function HirobaPostForm({ onSubmit, isSubmitting = false }: HirobaPostFormProps) {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<CreateHirobaPostInput>({
    resolver: zodResolver(createHirobaPostSchema),
  })

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function selectImage(file: File | undefined) {
    setImage(file ?? null)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0])
    event.target.value = ''
  }

  function handleImageDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    selectImage(event.dataTransfer.files[0])
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, image))} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">投稿のタイトル</Label>
        <Input
          id="title"
          placeholder="タイトルを入力してください"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">画像（任意）</Label>
        <input
          id="image"
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            if (event.dataTransfer.types.includes('Files')) setIsDragging(true)
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
          onDrop={handleImageDrop}
          className={cn(
            'group flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/40 px-6 py-5 text-center transition-[border-color,background-color,box-shadow] hover:border-primary hover:bg-primary/10 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
            isDragging && 'border-primary bg-primary/15 shadow-sm',
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-card text-primary shadow-xs transition-transform group-hover:scale-110 motion-reduce:transition-none">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="text-label text-foreground">
            {isDragging ? 'ここに画像をドロップ' : '画像を追加'}
          </span>
          <span className="text-paragraph-mini text-muted-foreground">
            クリックまたはドラッグ&ドロップ
          </span>
        </button>
        <p className="text-paragraph-mini text-secondary-foreground">
          JPEG、PNG、WebP、GIF（4.5MB以下）
        </p>
        {imagePreviewUrl && (
          <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
            <Image
              src={imagePreviewUrl}
              alt="選択した画像のプレビュー"
              width={800}
              height={600}
              unoptimized
              className="max-h-80 w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="選択した画像を削除"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting || isFormSubmitting}>
        {isSubmitting || isFormSubmitting ? '送信中...' : '投稿する'}
      </Button>
    </form>
  )
}
