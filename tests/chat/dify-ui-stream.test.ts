import { describe, expect, it } from 'vitest'
import { toChatUIMessageStream } from '@/lib/chat/dify-ui-stream'

/** Dify が返すSSEボディを模したストリームを組み立てる。 */
function difyStream(events: object[], { split = false } = {}) {
  const encoder = new TextEncoder()
  const text = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')

  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (split) {
        // イベント境界をまたぐ分割配信でもパースできることを確認する
        const middle = Math.floor(text.length / 2)
        controller.enqueue(encoder.encode(text.slice(0, middle)))
        controller.enqueue(encoder.encode(text.slice(middle)))
      } else {
        controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<unknown>) {
  const chunks: unknown[] = []
  for await (const chunk of stream as unknown as AsyncIterable<unknown>) {
    chunks.push(chunk)
  }
  return chunks as Array<Record<string, unknown>>
}

const CHATFLOW_EVENTS = [
  { event: 'workflow_started', task_id: 't1', data: { id: 'w1' } },
  { event: 'node_started', task_id: 't1', data: { node_id: 'n1', title: 'ナレッジ検索' } },
  { event: 'ping' },
  { event: 'message', answer: 'こんにちは', conversation_id: 'conv-1', message_id: 'm1' },
  { event: 'message', answer: '。ご用件は？', conversation_id: 'conv-1', message_id: 'm1' },
  { event: 'workflow_finished', data: { status: 'succeeded' } },
  { event: 'message_end', conversation_id: 'conv-1', message_id: 'm1' },
]

describe('toChatUIMessageStream', () => {
  it('Difyのイベントをテキストデルタと会話IDに変換する', async () => {
    const chunks = await collect(toChatUIMessageStream(difyStream(CHATFLOW_EVENTS)))

    expect(chunks.at(0)).toMatchObject({ type: 'start' })
    expect(chunks.at(-1)).toEqual({ type: 'finish' })

    const text = chunks
      .filter((chunk) => chunk.type === 'text-delta')
      .map((chunk) => chunk.delta)
      .join('')
    expect(text).toBe('こんにちは。ご用件は？')

    expect(chunks).toContainEqual({
      type: 'data-conversation',
      data: { conversationId: 'conv-1' },
      transient: true,
    })
  })

  it('ノード実行状況はクライアントに流さない', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([
          { event: 'workflow_started', data: { id: 'w1' } },
          { event: 'node_started', data: { node_id: 'n1', title: 'ナレッジ検索' } },
          { event: 'message', answer: 'こんにちは', conversation_id: 'conv-1' },
          // 回答の途中で走る後続ノード
          { event: 'node_started', data: { node_id: 'n2', title: 'LLM' } },
          { event: 'node_finished', data: { node_id: 'n2', status: 'succeeded' } },
          { event: 'message', answer: '。ご用件は？', conversation_id: 'conv-1' },
          { event: 'message_end', conversation_id: 'conv-1' },
        ]),
      ),
    )

    expect(chunks.some((chunk) => String(chunk.type).startsWith('data-status'))).toBe(false)
    expect(
      chunks
        .filter((chunk) => chunk.type === 'text-delta')
        .map((chunk) => chunk.delta)
        .join(''),
    ).toBe('こんにちは。ご用件は？')
  })

  it('チャンクがイベント境界で分割されても復元できる', async () => {
    const chunks = await collect(
      toChatUIMessageStream(difyStream(CHATFLOW_EVENTS, { split: true })),
    )
    const text = chunks
      .filter((chunk) => chunk.type === 'text-delta')
      .map((chunk) => chunk.delta)
      .join('')

    expect(text).toBe('こんにちは。ご用件は？')
  })

  it('errorイベントをエラーチャンクとして流す', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([
          { event: 'workflow_started', data: { id: 'w1' } },
          { event: 'error', status: 500, message: 'model call failed' },
        ]),
      ),
    )

    expect(chunks).toContainEqual({ type: 'error', errorText: 'model call failed' })
  })

  it('ワークフロー失敗をエラーチャンクとして流す', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([
          { event: 'workflow_finished', data: { status: 'failed', error: 'node error' } },
        ]),
      ),
    )

    expect(chunks).toContainEqual({ type: 'error', errorText: 'node error' })
  })

  it('テキストが1つも来ない場合はtext-startを送らない', async () => {
    const chunks = await collect(
      toChatUIMessageStream(difyStream([{ event: 'message_end', conversation_id: 'conv-1' }])),
    )

    expect(chunks.some((chunk) => chunk.type === 'text-start')).toBe(false)
    expect(chunks.at(-1)).toEqual({ type: 'finish' })
  })

  it('初回のmessageイベントで会話IDを流す', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([{ event: 'message', answer: 'こんにちは', conversation_id: 'conv-early' }]),
      ),
    )

    expect(chunks).toContainEqual({
      type: 'data-conversation',
      data: { conversationId: 'conv-early' },
      transient: true,
    })
  })

  it('message_end前に中断されても会話IDを保持できる', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([{ event: 'message', answer: '途中まで', conversation_id: 'conv-partial' }]),
      ),
    )

    const conversationChunks = chunks.filter((chunk) => chunk.type === 'data-conversation')
    expect(conversationChunks).toHaveLength(1)
    expect(conversationChunks[0]).toMatchObject({
      data: { conversationId: 'conv-partial' },
    })
  })

  it('message_replaceは全文差し替えとして扱う', async () => {
    const chunks = await collect(
      toChatUIMessageStream(
        difyStream([
          { event: 'message', answer: '不適切な', conversation_id: 'conv-1' },
          { event: 'message_replace', answer: '修正された回答です。', conversation_id: 'conv-1' },
          { event: 'message_end', conversation_id: 'conv-1' },
        ]),
      ),
    )

    const text = chunks
      .filter((chunk) => chunk.type === 'text-delta')
      .map((chunk) => chunk.delta)
      .join('')
    expect(text).toBe('不適切な修正された回答です。')
    expect(chunks.filter((chunk) => chunk.type === 'text-end')).toHaveLength(2)
  })
})
