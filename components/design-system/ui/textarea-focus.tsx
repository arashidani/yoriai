'use client'

import Image from 'next/image'
import { type ChangeEvent, useRef, useState } from 'react'
import image from '@/assets/img.svg'
import submitWhite from '@/assets/submit-white.svg'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '../button'

const TITLE_MAX_LENGTH = 200

type TextareaFocusProps = {
  onSubmit: (data: { title: string; body: string; image: File | null }) => Promise<void>
  isSubmitting?: boolean
  onImageSelect?: (file: File) => void
  imagePreviewUrl?: string | null
  onImageClear?: () => void
  acceptedImageTypes?: string[]
}

export function TextareaFocus({
  onSubmit,
  isSubmitting = false,
  onImageSelect,
  imagePreviewUrl,
  onImageClear,
  acceptedImageTypes,
}: TextareaFocusProps) {
  const [body, setBody] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    const trimmedBody = body.trim()
    if (!trimmedBody || isSubmitting) return

    await onSubmit({
      title: trimmedBody.slice(0, TITLE_MAX_LENGTH),
      body: trimmedBody,
      image: selectedImage,
    })
    setBody('')
    setSelectedImage(null)
    onImageClear?.()
  }

  function handleImageButtonClick() {
    if (onImageSelect) fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSelectedImage(file)
    onImageSelect?.(file)
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-border-3">
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-background/70">
          <Spinner className="size-6" />
        </div>
      )}
      <textarea
        placeholder="今の気分をシェアしましょう"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="field-sizing-content min-h-11 max-h-80 resize-none pt-4 px-4 w-full outline-none scrollbar-none"
      />
      {imagePreviewUrl && (
        <div className="px-4 pt-2">
          <Image
            src={imagePreviewUrl}
            alt=""
            width={0}
            height={0}
            sizes="100vw"
            unoptimized
            className="h-40 w-full rounded-lg object-cover"
          />
        </div>
      )}
      <div className="px-4 pb-4 pt-2 flex justify-between">
        {onImageSelect ? (
          <button
            type="button"
            onClick={handleImageButtonClick}
            className="flex justify-center items-center w-10 h-10 border-2 border-border-3 rounded-full hover:bg-secondary-hover transition-colors"
          >
            <Image src={image} width={17} height={17} alt="" className="" />
          </button>
        ) : (
          <span />
        )}
        {onImageSelect && (
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedImageTypes?.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        )}

        <Button
          variant="primary"
          size="default"
          leftIcon={<Image src={submitWhite} alt="" />}
          onClick={handleSubmit}
          isDisabled={isSubmitting || !body.trim()}
        >
          送信
        </Button>
      </div>
    </div>
  )
}
