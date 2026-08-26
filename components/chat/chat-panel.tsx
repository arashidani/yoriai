'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AiChatbot } from '@/components/design-system/ai-chat/ai-chatbot'
import { MessageContainer } from '@/components/design-system/ai-chat/message-container'
import type { ChatUIMessage } from '@/lib/chat/types'
import { client } from '@/lib/hono/client'
import type { ChatRequestInput } from '@/lib/schemas/chat'

const EMPTY_STATE_MESSAGE = 'よりあいぬに相談してみましょう!'
const THINKING_MESSAGE = 'よりあいぬが考えています...'

function hasAssistantText(message: ChatUIMessage) {
  return (
    message.role === 'assistant' &&
    message.parts.some((part) => part.type === 'text' && part.text.length > 0)
  )
}

function messageText(message: ChatUIMessage) {
  return message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')
}

type ChatPanelProps = {
  onClose?: () => void
}

/** Dify Chatflow を AIchatbot デザインで表示するチャット本体。 */
export function ChatPanel({ onClose }: ChatPanelProps) {
  // Difyが払い出す会話ID。次ターンでそのまま送り返して会話を継続する。
  const conversationId = useRef<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, setMessages, sendMessage, status, stop, error } = useChat<ChatUIMessage>({
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

  // ヘッダーのリフレッシュ。Dify側の会話も切って新しいスレッドにする
  function handleRefresh() {
    if (isBusy) stop()
    conversationId.current = undefined
    setMessages([])
    setInput('')
  }

  return (
    <AiChatbot
      headerProps={{
        onRefresh: handleRefresh,
        onClose,
        closeLabel: 'チャットを閉じる',
      }}
      bodyProps={{
        messageAreaRef: scrollRef,
        isLoading: isBusy && !isAnswering,
        loadingText: THINKING_MESSAGE,
        inputAreaProps: {
          textareaProps: {
            value: input,
            onChange: (event) => setInput(event.target.value),
            onKeyDown: (event) => {
              // 変換確定のEnterで送信しないようにIME中は無視する
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
              event.preventDefault()
              handleSubmit()
            },
            'aria-label': 'メッセージ',
            className: 'max-h-32',
          },
          sendButtonProps: isBusy
            ? {
                'aria-label': '生成を中断',
                onClick: stop,
                children: <Square />,
              }
            : {
                'aria-label': '送信',
                onClick: handleSubmit,
                isDisabled: !input.trim(),
              },
        },
      }}
    >
      {messages.length === 0 && !isBusy && (
        <p className="w-full text-center text-muted-foreground text-paragraph-small">
          {EMPTY_STATE_MESSAGE}
        </p>
      )}

      {messages.map((message) => {
        // ストリーム開始直後の空アシスタントは考え中行とアイコンが二重になるので出さない
        if (isBusy && message.role === 'assistant' && !hasAssistantText(message)) return null

        return (
          <MessageContainer
            key={message.id}
            type={message.role === 'user' ? 'user' : 'ai'}
            size="body"
            className={message.role === 'user' ? 'self-end' : undefined}
          >
            {messageText(message)}
          </MessageContainer>
        )
      })}

      {error && (
        <p className="w-full text-destructive text-paragraph-small" role="alert">
          {error.message}
        </p>
      )}
    </AiChatbot>
  )
}
