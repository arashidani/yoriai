'use client'

import Image from 'next/image'
import { type ChangeEvent, useRef, useState } from 'react'
import image from '@/assets/img.svg'
import submitWhite from '@/assets/submit-white.svg'
import { Spinner } from '@/components/design-system/ui/spinner'
import { RichTextEditor } from '@/components/mentions/rich-text-editor'
import { stripMarkdown } from '@/lib/text/strip-markdown'
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

    const titleSource = stripMarkdown(trimmedBody) || trimmedBody
    await onSubmit({
      title: titleSource.slice(0, TITLE_MAX_LENGTH),
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
    <div className="relative flex w-full flex-col overflow-hidden rounded-lg border-2 border-border-3 bg-card transition-colors focus-within:border-border-4">
      <RichTextEditor
        id="hiroba-post-body"
        boxed={false}
        value={body}
        onChange={setBody}
        onSubmit={() => {
          if (isSubmitting || !body.trim()) return
          void handleSubmit()
        }}
        placeholder="今の気分をシェアしましょう"
        ariaLabel="今の気分をシェアしましょう"
        disabled={isSubmitting}
        editorClassName="h-16 overflow-y-auto px-4 pt-3.5 pb-2"
      />
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
      <div className="flex items-end justify-between gap-2 px-4 pt-2 pb-4">
        <div className="flex items-center gap-2">
          {onImageSelect && (
            <button
              type="button"
              onClick={handleImageButtonClick}
              className="flex size-10 items-center justify-center rounded-full border-2 border-border-3 bg-primary-foreground transition-colors hover:bg-secondary-hover"
            >
              <Image src={image} width={17} height={17} alt="" />
            </button>
          )}
        </div>
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
