'use client'

import { MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

type DifyChatWidgetProps = {
  baseUrl?: string
  token?: string
}

/** ログイン後の全画面に表示するAIチャットの起動ボタン兼ウィンドウ。 */
export function DifyChatWidget({
  baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL,
  token = process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN,
}: DifyChatWidgetProps) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  if (!baseUrl || !token) return null

  function handleToggle() {
    if (!open) setMounted(true)
    setOpen((prev) => !prev)
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {mounted && (
        <div
          id={panelId}
          className={cn(
            'absolute right-0 bottom-18 h-160 max-h-[80vh] w-96 max-w-[90vw] overflow-hidden rounded-2xl bg-popover shadow-xl',
            !open && 'invisible pointer-events-none',
          )}
          aria-hidden={!open}
          inert={!open}
        >
          <iframe
            src={`${baseUrl.replace(/\/$/, '')}/chatbot/${token}`}
            title="AIチャットサポート"
            allow="microphone"
            className="h-full w-full"
          />
        </div>
      )}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={mounted ? panelId : undefined}
          aria-label={open ? 'チャットを閉じる' : 'AIチャットサポートを開く'}
          onClick={handleToggle}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-colors hover:bg-primary-hover"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={open ? 'close' : 'chat'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  )
}
