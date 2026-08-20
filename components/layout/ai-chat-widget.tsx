'use client'

import { MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { ChatPanel } from '@/components/chat/chat-panel'
import { cn } from '@/lib/utils'

/** ログイン後の全画面に表示するAIチャットの起動ボタン兼ウィンドウ。 */
export function AiChatWidget() {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

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
            'absolute right-0 bottom-18 flex h-160 max-h-[80vh] w-128 max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-xl',
            !open && 'invisible pointer-events-none',
          )}
          aria-hidden={!open}
          inert={!open}
        >
          <div className="border-border border-b px-4 py-3">
            <p className="font-medium text-paragraph-small">よりあいぬの小屋</p>
          </div>
          <div className="min-h-0 flex-1">
            <ChatPanel />
          </div>
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
