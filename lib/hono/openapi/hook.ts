import type { Hook } from '@hono/zod-openapi'

/**
 * バリデーション失敗時のレスポンスを、他のエラーと同じ { error: string } 形に揃える。
 * これを指定しないと zValidator 既定の zod エラー構造が返り、OpenAPI 上の
 * ErrorSchema と実際のレスポンスがずれる。
 */
// biome-ignore lint/suspicious/noExplicitAny: 異なるEnv型の複数インスタンスで共有するためEはanyで受ける
export const defaultHook: Hook<unknown, any, string, unknown> = (result, c) => {
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'リクエストが不正です'
    return c.json({ error: message }, 400)
  }
}
