import { z } from '@hono/zod-openapi'

/**
 * バックエンドのレスポンス用スキーマ。
 * OpenAPIドキュメントの components.schemas に登録され、ハンドラの戻り値型チェックにも使われる。
 * リクエスト用スキーマ（バリデーション）は lib/schemas/ 側でフロントと共有している。
 */

/** Prisma の Date をそのまま c.json に渡せるよう入力型は Date のまま、ドキュメント表現だけ date-time 文字列にする */
const dateTime = () =>
  z.date().openapi({ type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' })

export const UserSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    supabaseId: z.string().openapi({ example: 'supabase-user-1' }),
    email: z.string().openapi({ example: 'user@example.com' }),
    name: z.string().nullable().openapi({ example: '一般ユーザー' }),
    role: z.enum(['USER', 'ADMIN']).openapi({ example: 'USER' }),
    createdAt: dateTime(),
  })
  .openapi('User')

export const PostSchema = z
  .object({
    id: z.string().openapi({ example: 'post-1' }),
    title: z.string().openapi({ example: 'Next.js App Routerの使い方を教えてください' }),
    body: z.string().openapi({ example: 'App Router と Pages Router の違いが分かりません。' }),
    authorId: z.string().nullable().openapi({ example: 'user-2' }),
    author: z.union([UserSchema, z.null()]).optional(),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .openapi('Post')

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'Not found' }),
  })
  .openapi('Error')

export const SuccessSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
  })
  .openapi('Success')

/** パスパラメータ :id */
export const IdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'post-1' }),
})

/** よく使うエラーレスポンス定義 */
export const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorSchema } },
})
