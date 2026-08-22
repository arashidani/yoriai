import { createUIMessageStream } from 'ai'
import { MOCK_CHAT_CONVERSATION_ID, getMockChatResponseChunks } from '@/lib/mocks/fixtures'
import { readDifyEvents } from '@/lib/dify/chat'
import type { ChatUIMessage } from './types'

/**
 * Dify Chatflow の SSE を AI SDK の UI Message Stream に変換する。
 * 両者はSSEという点だけ同じでイベント形式が異なるため、ここで翻訳する。
 */
export function toChatUIMessageStream(difyBody: ReadableStream<Uint8Array>) {
  return createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      const textId = crypto.randomUUID()
      let textStarted = false
      let conversationEmitted = false

      writer.write({ type: 'start' })

      const emitConversationId = (conversationId: string) => {
        if (conversationEmitted) return
        writer.write({
          type: 'data-conversation',
          data: { conversationId },
          transient: true,
        })
        conversationEmitted = true
      }

      for await (const event of readDifyEvents(difyBody)) {
        switch (event.event) {
          case 'message':
          case 'agent_message': {
            if (event.conversation_id) emitConversationId(event.conversation_id)
            if (!event.answer) break
            if (!textStarted) {
              writer.write({ type: 'text-start', id: textId })
              textStarted = true
            }
            writer.write({ type: 'text-delta', id: textId, delta: event.answer })
            break
          }

          // message_replace は全文差し替え。追記するとモデレーション時に重複するため別扱いにする。
          case 'message_replace': {
            if (event.conversation_id) emitConversationId(event.conversation_id)
            if (!event.answer) break
            if (textStarted) {
              writer.write({ type: 'text-end', id: textId })
              textStarted = false
            }
            const replaceId = crypto.randomUUID()
            writer.write({ type: 'text-start', id: replaceId })
            writer.write({ type: 'text-delta', id: replaceId, delta: event.answer })
            writer.write({ type: 'text-end', id: replaceId })
            break
          }

          case 'workflow_finished':
            if (event.data?.status === 'failed') {
              throw new Error(event.data.error ?? 'AIの処理が失敗しました')
            }
            break

          case 'message_end':
            if (event.conversation_id) emitConversationId(event.conversation_id)
            break

          case 'error':
            throw new Error(event.message ?? 'AIの処理でエラーが発生しました')

          default:
            // ping / tts_message / workflow_started / node_* などは無視する
            break
        }
      }

      if (textStarted) writer.write({ type: 'text-end', id: textId })
      writer.write({ type: 'finish' })
    },
    onError: (error) => (error instanceof Error ? error.message : 'AIの応答に失敗しました'),
  })
}

/** MOCK_MODE=true のときにDifyを呼ばずに返す擬似ストリーム。 */
export function createMockChatStream(query: string) {
  return createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      const textId = crypto.randomUUID()
      writer.write({ type: 'start' })
      writer.write({ type: 'text-start', id: textId })

      for (const chunk of getMockChatResponseChunks(query)) {
        writer.write({ type: 'text-delta', id: textId, delta: chunk })
        await new Promise((resolve) => setTimeout(resolve, 120))
      }

      writer.write({ type: 'text-end', id: textId })
      writer.write({
        type: 'data-conversation',
        data: { conversationId: MOCK_CHAT_CONVERSATION_ID },
        transient: true,
      })
      writer.write({ type: 'finish' })
    },
  })
}
