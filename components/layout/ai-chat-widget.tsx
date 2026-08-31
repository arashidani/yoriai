'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import mascotAiAvatarImage from '@/assets/mascots/mascot_ai_avatar.svg'
import yoriainuChatSmile01 from '@/assets/yoriainu_chat_smile01.svg'
import yoriainuChatSmile02 from '@/assets/yoriainu_chat_smile02.svg'
import yoriainuChatSmile03 from '@/assets/yoriainu_chat_smile03.svg'
import { ChatPanel } from '@/components/chat/chat-panel'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { cn } from '@/lib/utils'

/** なでなで判定: ホバー中にカーソルの左右移動が何回向きを変えたら「なでなで成功」とみなすか。 */
const PET_REVERSAL_THRESHOLD = 4
/** カーソルの微ブレをなでなでと誤検知しないための最小移動量(px)。 */
const PET_MIN_DELTA = 6
/** 喜んだあと通常状態に戻るまでの時間(ms)。 */
const HAPPY_DURATION = 1600

/** なでなで成功中に見せる笑顔のパラパラアニメ用フレーム(SVG)。 */
const SMILE_FRAMES = [yoriainuChatSmile01, yoriainuChatSmile02, yoriainuChatSmile03]
/** 笑顔フレームの切り替え間隔(ms)。ゆるキャラっぽくゆっくり切り替える。 */
const SMILE_FRAME_INTERVAL = 160

/** ホバー時に吹き出しへ出すよりあいぬのひとこと。ホバーのたびにランダムで1つ選ぶ。 */
const TOOLTIP_MESSAGES = [
  '撫でてみてほしいワンっ！',
  'こまったらワンクリックワンっ！',
  'おなかすいたワン...',
] as const

function pickTooltipMessage() {
  return TOOLTIP_MESSAGES[Math.floor(Math.random() * TOOLTIP_MESSAGES.length)]
}

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

  // hover=カーソルが乗っている（吹き出し表示） / happy=なでなで成功（笑顔アニメ表示）
  const [hover, setHover] = useState(false)
  const [happy, setHappy] = useState(false)
  // ホバー中に表示するひとこと。ホバー開始のたびに引き直す
  const [tooltipMessage, setTooltipMessage] = useState<string>(TOOLTIP_MESSAGES[0])
  // 笑顔パラパラアニメの表示中フレーム。happy 中だけ回す
  const [smileFrame, setSmileFrame] = useState(0)

  // なでなで判定用。ホバー中のみ有効
  const lastXRef = useRef<number | null>(null)
  const lastDirRef = useRef<0 | 1 | -1>(0)
  const reversalsRef = useRef(0)
  const happyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 笑顔フレームを先読みし、初回なでなで時のコマ落ちを防ぐ
  useEffect(() => {
    for (const frame of SMILE_FRAMES) {
      const img = new window.Image()
      img.src = frame.src
    }
  }, [])

  // happy 中は笑顔フレームを SMILE_FRAME_INTERVAL ごとにループ。抜けたら先頭へ戻す
  useEffect(() => {
    if (!happy) {
      setSmileFrame(0)
      return
    }
    const id = setInterval(() => {
      setSmileFrame((i) => (i + 1) % SMILE_FRAMES.length)
    }, SMILE_FRAME_INTERVAL)
    return () => clearInterval(id)
  }, [happy])

  function handleToggle() {
    if (!open) setMounted(true)
    setOpen((prev) => !prev)
  }

  function resetPetTracking() {
    lastXRef.current = null
    lastDirRef.current = 0
    reversalsRef.current = 0
  }

  function handlePointerEnter() {
    setHover(true)
    setTooltipMessage(pickTooltipMessage())
    resetPetTracking()
  }

  function handlePointerLeave() {
    setHover(false)
    resetPetTracking()
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (happy) return
    const x = event.clientX
    const lastX = lastXRef.current
    if (lastX === null) {
      lastXRef.current = x
      return
    }
    const delta = x - lastX
    if (Math.abs(delta) < PET_MIN_DELTA) return
    lastXRef.current = x

    const dir: 1 | -1 = delta > 0 ? 1 : -1
    if (lastDirRef.current !== 0 && dir !== lastDirRef.current) {
      reversalsRef.current += 1
      if (reversalsRef.current >= PET_REVERSAL_THRESHOLD) {
        triggerHappy()
      }
    }
    lastDirRef.current = dir
  }

  function triggerHappy() {
    resetPetTracking()
    setHappy(true)
    if (happyTimerRef.current) clearTimeout(happyTimerRef.current)
    happyTimerRef.current = setTimeout(() => {
      setHappy(false)
      happyTimerRef.current = null
    }, HAPPY_DURATION)
  }

  const launchButtonProps = {
    type: 'button' as const,
    'aria-expanded': open,
    'aria-controls': mounted ? panelId : undefined,
    'aria-label': 'AIチャットサポートを開く',
    'aria-hidden': open || undefined,
    inert: open || undefined,
    onClick: handleToggle,
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
        <motion.div
          className={cn('relative', open && 'invisible pointer-events-none')}
          aria-hidden={open}
          inert={open}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* ホバー中はよりあいぬのひとことの吹き出しをアイコンの上に出す */}
          <AnimatePresence>
            {hover && !happy && (
              <motion.div
                className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max -translate-x-1/2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                <ToolChip
                  text={tooltipMessage}
                  side="bottom"
                  className="max-w-[110px] whitespace-normal"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            {...launchButtonProps}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}
            // Figma: AI icon = 90x90
            // 背景は よりあいぬアイコンの円と同じ青(#33C1ED)。
            // なでなで中の笑顔SVGは円の地色を持たないので、透ける下地をこの青に合わせる。
            className="relative flex size-[90px] items-center justify-center rounded-full bg-[#33C1ED] text-primary-foreground shadow-xl transition-colors hover:bg-[#25add6]"
          >
            {/* よりあいぬのアイコン。円形の地色を持つのでボタン全面に敷く。 */}
            <LaunchIcon />
            {/* なでなで成功中は笑顔SVGをパラパラ漫画のように切り替えて見せる。
                笑顔SVGは円の地色を持たず透けるので、レイヤー自身に青い円の下地を敷いて
                不透明にしてからフェードインする（下の default 画像と混ざって濁らないように）。 */}
            <AnimatePresence>
              {happy && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#33C1ED]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Image
                    src={SMILE_FRAMES[smileFrame]}
                    alt=""
                    aria-hidden
                    className="size-[90px]"
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      ) : (
        <button
          {...launchButtonProps}
          // Figma: AI icon = 90x90
          className={cn(
            'flex size-[90px] items-center justify-center rounded-full bg-[#33C1ED] text-primary-foreground shadow-xl transition-colors hover:bg-[#25add6]',
            open && 'invisible pointer-events-none',
          )}
        >
          <LaunchIcon />
        </button>
      )}
    </div>
  )
}
