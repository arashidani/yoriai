import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { toDifyQuery } from '@/lib/chat/types'
import { sendChatMessage } from '@/lib/dify/chat'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse } from '@/lib/hono/openapi/schemas'
import { chatRequestSchema } from '@/lib/schemas/chat'

/**
 * ai は 7.9MB あり、全 API を束ねる catch-all の Route Handler では
 * チャット以外のリクエストでも関数の初期化時にロードされてしまう。
 * dify-ui-stream も ai を値として import しているため、両方まとめて
 * チャットのリクエスト内でのみ読み込む。
 */
const loadStreamDeps = () => Promise.all([import('ai'), import('@/lib/chat/dify-ui-stream')])

const sendChatRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['chat'],
  summary: 'Dify Chatflow にメッセージを送信し、AI応答をSSEで返す',
  description:
    '会話履歴は Dify 側が conversationId で保持するため、リクエストには最新のユーザー発話のみ含める。' +
    'レスポンスは AI SDK UI Message Stream 形式の SSE。Swagger UI からは試行不可。',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: { required: true, content: { 'application/json': { schema: chatRequestSchema } } },
  },
  responses: {
    200: {
      description: 'AI SDK UI Message Stream（SSE）',
      content: {
        'text/event-stream': {
          schema: z.string().openapi({
            description: 'data: {...}\\n\\n 形式の SSE チャンク列',
            example: 'data: {"type":"start"}\\n\\n',
          }),
        },
      },
    },
    400: errorResponse('リクエスト不正または空メッセージ', 'メッセージが空です'),
    401: errorResponse('未認証', 'Unauthorized'),
    502: errorResponse('Dify 通信失敗', 'AIとの通信に失敗しました'),
  },
})

/** Dify Chatflow をプロキシするチャットエンドポイント。 */
export const chatRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook }).openapi(
  sendChatRoute,
  async (c) => {
    const user = c.get('user')
    const { messages, conversationId } = c.req.valid('json')

    // 会話履歴はDify側が conversation_id で保持するので、最新のユーザー発話だけを送る
    const query = toDifyQuery(messages.at(-1))
    if (!query) return c.json({ error: 'メッセージが空です' }, 400)

    // MOCK_MODE=true のときはモックストリームを返す
    if (process.env.MOCK_MODE === 'true') {
      const [{ createUIMessageStreamResponse }, { createMockChatStream }] = await loadStreamDeps()
      return createUIMessageStreamResponse({ stream: createMockChatStream(query) })
    }

    let difyRes: Response
    try {
      difyRes = await sendChatMessage({
        query,
        conversationId: conversationId ?? '',
        user: user.id,
        signal: c.req.raw.signal,
      })
    } catch (error) {
      console.error('Dify chat-messages configuration error', error)
      return c.json({ error: 'AIとの通信に失敗しました' }, 502)
    }

    if (!difyRes.ok || !difyRes.body) {
      const detail = await difyRes.text().catch(() => '')
      console.error('Dify chat-messages failed', difyRes.status, detail)
      return c.json({ error: 'AIとの通信に失敗しました' }, 502)
    }

    const [{ createUIMessageStreamResponse }, { toChatUIMessageStream }] = await loadStreamDeps()
    return createUIMessageStreamResponse({ stream: toChatUIMessageStream(difyRes.body) })
  },
)
