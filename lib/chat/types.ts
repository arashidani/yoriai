import type { UIMessage } from 'ai'

/**
 * サーバー(Hono)からクライアントへ transient で流す補助データ。
 * - conversation: Difyが払い出した conversation_id。次ターンでそのまま送り返す。
 */
export type ChatDataParts = {
  conversation: { conversationId: string }
}

export type ChatUIMessage = UIMessage<never, ChatDataParts>

export type { ChatRequestInput as ChatRequestBody } from '@/lib/schemas/chat'

/** UIMessage からDifyに送るクエリ文字列を組み立てる。 */
export function toDifyQuery(
  message: { parts: Array<{ type: string; text?: string }> } | undefined,
): string {
  return (
    message?.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim() ?? ''
  )
}
