import { requireEnv } from '@/lib/env'

/**
 * Dify Chatflow (advanced-chat) のストリーミングイベント。
 * イベント種別ごとに含まれるフィールドが異なるため、すべて optional で受ける。
 * @see https://docs.dify.ai/api-reference/chats/send-chat-message
 */
export type DifyStreamEvent = {
  event: string
  /** message / agent_message / message_replace で流れてくる回答テキスト */
  answer?: string
  conversation_id?: string
  message_id?: string
  task_id?: string
  /** error イベントのメッセージ */
  message?: string
  code?: string
  status?: number
  /** workflow_started / node_started / node_finished / workflow_finished の中身 */
  data?: {
    title?: string
    status?: string
    error?: string | null
  }
}

export type SendChatMessageParams = {
  query: string
  /** 空文字なら新規会話。Difyが払い出したIDを渡すと会話が継続する。 */
  conversationId: string
  /** Dify側のエンドユーザー識別子。会話履歴の分離キーになる。 */
  user: string
  signal?: AbortSignal
}

/** Dify Service API にストリーミングモードでチャットを送る。 */
export async function sendChatMessage({
  query,
  conversationId,
  user,
  signal,
}: SendChatMessageParams): Promise<Response> {
  const baseUrl = requireEnv('DIFY_API_BASE_URL').replace(/\/$/, '')

  return fetch(`${baseUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('DIFY_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      inputs: {},
      response_mode: 'streaming',
      conversation_id: conversationId,
      user,
    }),
    signal,
  })
}

/**
 * Dify の SSE ボディを1イベントずつ読み出す。
 * チャンクは `data: {...}` 行の集まりで、イベント同士は空行(\n\n)で区切られる。
 */
export async function* readDifyEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<DifyStreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      // 最後の要素は次のチャンクと連結される可能性があるので持ち越す
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const event = parseDifyChunk(chunk)
        if (event) yield event
      }
    }

    buffer += decoder.decode()
    const last = parseDifyChunk(buffer)
    if (last) yield last
  } finally {
    reader.cancel().catch(() => {})
  }
}
/** SSE チャンクをパースする。 */
function parseDifyChunk(chunk: string): DifyStreamEvent | null {
  const line = chunk.split('\n').find((l) => l.startsWith('data:'))
  if (!line) return null

  const payload = line.slice('data:'.length).trim()
  if (!payload || payload === '[DONE]') return null

  try {
    return JSON.parse(payload) as DifyStreamEvent
  } catch {
    // ping など JSON でない行は無視する
    return null
  }
}
