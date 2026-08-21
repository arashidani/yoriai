'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Square } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import yoriainuChat from '@/assets/yoriainu_chat.png'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ChatUIMessage } from '@/lib/chat/types'
import { client } from '@/lib/hono/client'
import type { ChatRequestInput } from '@/lib/schemas/chat'
import { cn } from '@/lib/utils'

const EMPTY_STATE_MESSAGE = 'よりあいぬに相談してみましょう!'
const THINKING_MESSAGE = 'よりあいぬが考えています...'

function hasAssistantText(message: ChatUIMessage) {
  return (
    message.role === 'assistant' &&
    message.parts.some((part) => part.type === 'text' && part.text.length > 0)
  )
}

function YoriainuAvatar() {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-informative">
      <Image
        src={yoriainuChat}
        alt="よりあいぬ"
        width={48}
        height={48}
        className="size-12 object-contain"
      />
    </span>
  )
}

/** Dify Chatflow を独自UIで表示するチャット本体。 */
export function ChatPanel() {
  // Difyが払い出す会話ID。次ターンでそのまま送り返して会話を継続する。
  const conversationId = useRef<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport<ChatUIMessage>({
      fetch: async (_url, init) => {
        const body = JSON.parse(init?.body as string) as ChatRequestInput
        return client.api.chat.$post({ json: body })
      },
      prepareSendMessagesRequest: ({ messages }) => ({
        // Difyは conversation_id で履歴を保持するため、最新の発話だけ送る
        body: { messages: messages.slice(-1), conversationId: conversationId.current },
      }),
    }),
    onData: (part) => {
      if (part.type === 'data-conversation') conversationId.current = part.data.conversationId
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  // 回答が1文字でも届いたら考え中表示は消す（回答の下に割り込ませない）
  const lastMessage = messages.at(-1)
  const isAnswering = lastMessage ? hasAssistantText(lastMessage) : false

  // 新しいメッセージが来たら最下部へ追従する
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesの更新自体をトリガーにする
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit() {
    const text = input.trim()
    if (!text || isBusy) return
    setInput('')
    sendMessage({ text })
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-paragraph-small">
            {EMPTY_STATE_MESSAGE}
          </p>
        )}

        {messages.map((message) => {
          // ストリーム開始直後の空アシスタントは考え中行とアイコンが二重になるので出さない
          if (isBusy && message.role === 'assistant' && !hasAssistantText(message)) return null

          return (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {message.role === 'assistant' && <YoriainuAvatar />}
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-paragraph-small',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: パートは順序が固定で並び替わらない
                    <span key={index}>{part.text}</span>
                  ) : null,
                )}
              </div>
            </div>
          )
        })}

        {isBusy && !isAnswering && (
          <div className="flex items-start gap-2">
            <YoriainuAvatar />
            <p className="animate-pulse px-1 text-muted-foreground text-paragraph-small" aria-live="polite">
              {THINKING_MESSAGE}
            </p>
          </div>
        )}

        {error && (
          <p className="text-destructive text-paragraph-small" role="alert">
            {error.message}
          </p>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-border border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            // 変換確定のEnterで送信しないようにIME中は無視する
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            handleSubmit()
          }}
          placeholder="メッセージを入力"
          aria-label="メッセージ"
          rows={1}
          className="max-h-32 min-h-9 resize-none"
        />
        {isBusy ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="生成を中断"
            onClick={stop}
          >
            <Square />
          </Button>
        ) : (
          <Button type="submit" size="icon" aria-label="送信" disabled={!input.trim()}>
            <ArrowUp />
          </Button>
        )}
      </form>
    </div>
  )
}
