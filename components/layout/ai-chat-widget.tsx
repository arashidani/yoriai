'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useId, useState } from 'react'
import mascotAiAvatarImage from '@/assets/mascots/mascot_ai_avatar.svg'
import { ChatPanel } from '@/components/chat/chat-panel'
import { cn } from '@/lib/utils'

function LaunchIcon() {
  return (
    <Image src={mascotAiAvatarImage} alt="よりあいぬのアイコン" className="size-[90px]" priority />
  )
}

/** ログイン後の全画面に表示するAIチャットの起動ボタン兼ウィンドウ。 */
export function AiChatWidget() {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  function handleToggle() {
    if (!open) setMounted(true)
    setOpen((prev) => !prev)
  }

  const launchButtonProps = {
    type: 'button' as const,
    'aria-expanded': open,
    'aria-controls': mounted ? panelId : undefined,
    'aria-label': 'AIチャットサポートを開く',
    'aria-hidden': open || undefined,
    inert: open || undefined,
    onClick: handleToggle,
    // Figma: AI icon = 90x90
    className: cn(
      'flex size-[90px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-colors hover:bg-primary-hover',
      open && 'invisible pointer-events-none',
    ),
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {mounted && (
        <div
          id={panelId}
          // 枠線・角丸・影・ヘッダーは AiChatbot 側が持つので、ここは配置と大きさだけを決める。
          // 起動ボタンは開いている間隠れるので、その 18（ボタン＋余白）分だけ下へ伸ばす（160 + 18 = 178）
          className={cn(
            'absolute right-0 bottom-0 h-178 max-h-[80vh] w-128 max-w-[90vw]',
            !open && 'invisible pointer-events-none',
          )}
          aria-hidden={!open}
          inert={!open}
        >
          <ChatPanel onClose={() => setOpen(false)} />
        </div>
      )}
      {hydrated ? (
        <motion.button
          {...launchButtonProps}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <LaunchIcon />
        </motion.button>
      ) : (
        <button {...launchButtonProps}>
          <LaunchIcon />
        </button>
      )}
    </div>
  )
}
