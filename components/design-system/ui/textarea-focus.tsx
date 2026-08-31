'use client'

import Image from 'next/image'
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react'
import image from '@/assets/img.svg'
import submitWhite from '@/assets/submit-white.svg'
import { Spinner } from '@/components/design-system/ui/spinner'
import { Button } from '../button'
import { TextareaWithActions } from './textarea'

const TITLE_MAX_LENGTH = 200

function isModEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing
}

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
    <TextareaWithActions
      id="hiroba-post-body"
      name="body"
      placeholder="今の気分をシェアしましょう"
      value={body}
      onChange={(e) => setBody(e.target.value)}
      onKeyDown={(event) => {
        if (!isModEnter(event)) return
        event.preventDefault()
        if (isSubmitting || !body.trim()) return
        void handleSubmit()
      }}
      containerClassName="relative"
      leadingActions={
        onImageSelect && (
          <button
            type="button"
            onClick={handleImageButtonClick}
            className="flex size-10 items-center justify-center rounded-full border-2 border-border-3 bg-primary-foreground transition-colors hover:bg-secondary-hover"
          >
            <Image src={image} width={17} height={17} alt="" />
          </button>
        )
      }
      actions={
        <Button
          variant="primary"
          size="default"
          leftIcon={<Image src={submitWhite} alt="" />}
          onClick={handleSubmit}
          isDisabled={isSubmitting || !body.trim()}
        >
          送信
        </Button>
      }
    >
      {isSubmitting && <Spinner layout="overlay" size="md" />}
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
      {onImageSelect && (
        <input
          ref={fileInputRef}
          id="hiroba-post-image"
          name="image"
          type="file"
          accept={acceptedImageTypes?.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </TextareaWithActions>
  )
}
