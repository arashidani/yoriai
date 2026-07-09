import { z } from 'zod'
import { createPostSchema } from '@/lib/schemas/post'
import { createUserSchema, updateUserSchema } from '@/lib/schemas/user'

const roleSchema = z.enum(['USER', 'ADMIN']).describe('ユーザーロール')

const userResponseSchema = z.object({
  id: z.string(),
  supabaseId: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: roleSchema,
  createdAt: z.iso.datetime(),
})

const postResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  authorId: z.string().nullable(),
  author: userResponseSchema.nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const errorResponseSchema = z.object({
  error: z.string(),
})

const successResponseSchema = z.object({
  success: z.literal(true),
})

/** components.schemas に埋め込む際、zodが付与する $schema をトップレベルから取り除く */
function toSchema(schema: z.ZodType) {
  const { $schema: _$schema, ...jsonSchema } = z.toJSONSchema(schema, { target: 'draft-2020-12' })
  return jsonSchema
}

function jsonContent(schema: z.ZodType) {
  return { content: { 'application/json': { schema: toSchema(schema) } } }
}

const errorResponse = (description: string) => ({
  description,
  ...jsonContent(errorResponseSchema),
})

const auth = [{ supabaseSession: [] }]

const unauthorized = errorResponse('未認証（ログインが必要）')
const forbidden = errorResponse('権限不足（管理者専用の操作など）')
const notFound = errorResponse('リソースが見つからない')
const badRequest = errorResponse('リクエストが不正（バリデーションエラーなど）')

/** yoriai バックエンド（Hono）の OpenAPI 3.1 ドキュメントを構築する */
export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'yoriai API',
      version: '0.1.0',
      description:
        'yoriai バックエンド（Hono + Prisma + Supabase Auth）のAPI仕様書。' +
        '認証は Supabase のセッションクッキーで行う。',
    },
    servers: [{ url: '/api', description: 'デフォルト' }],
    tags: [
      { name: 'posts', description: '投稿の閲覧・作成・削除' },
      { name: 'users', description: 'ユーザー登録・自分のプロフィール取得' },
      { name: 'admin', description: '管理者専用のユーザー・投稿管理' },
    ],
    components: {
      securitySchemes: {
        supabaseSession: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description:
            'Supabase Auth のセッションクッキーによる認証。' +
            '実際のクッキー名はSupabaseプロジェクトごとに異なる（例: sb-<project-ref>-auth-token）。',
        },
      },
      schemas: {
        User: toSchema(userResponseSchema),
        Post: toSchema(postResponseSchema),
        Error: toSchema(errorResponseSchema),
      },
    },
    paths: {
      '/posts': {
        get: {
          tags: ['posts'],
          summary: '投稿一覧を取得',
          responses: {
            200: {
              description: '投稿一覧',
              ...jsonContent(z.object({ posts: z.array(postResponseSchema) })),
            },
          },
        },
        post: {
          tags: ['posts'],
          summary: '投稿を作成',
          security: auth,
          requestBody: { required: true, ...jsonContent(createPostSchema) },
          responses: {
            201: {
              description: '作成された投稿',
              ...jsonContent(z.object({ post: postResponseSchema })),
            },
            400: badRequest,
            401: unauthorized,
          },
        },
      },
      '/posts/{id}': {
        get: {
          tags: ['posts'],
          summary: '投稿を1件取得',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: '投稿詳細',
              ...jsonContent(z.object({ post: postResponseSchema })),
            },
            404: notFound,
          },
        },
        delete: {
          tags: ['posts'],
          summary: '投稿を削除（管理者のみ）',
          security: auth,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: '削除成功',
              ...jsonContent(successResponseSchema),
            },
            401: unauthorized,
            403: forbidden,
          },
        },
      },
      '/users': {
        post: {
          tags: ['users'],
          summary: 'サインアップ直後にPrisma上のUserを作成（Supabaseセッション必須）',
          requestBody: { required: true, ...jsonContent(createUserSchema) },
          responses: {
            201: {
              description: '作成されたユーザー',
              ...jsonContent(z.object({ user: userResponseSchema })),
            },
            200: {
              description: '既に存在するユーザー',
              ...jsonContent(z.object({ user: userResponseSchema })),
            },
            401: unauthorized,
          },
        },
      },
      '/users/me': {
        get: {
          tags: ['users'],
          summary: '自分のプロフィールを取得',
          security: auth,
          responses: {
            200: {
              description: '自分のユーザー情報',
              ...jsonContent(z.object({ user: userResponseSchema })),
            },
            401: unauthorized,
          },
        },
      },
      '/admin/users': {
        get: {
          tags: ['admin'],
          summary: 'ユーザー一覧を取得（管理者専用）',
          security: auth,
          responses: {
            200: {
              description: 'ユーザー一覧',
              ...jsonContent(z.object({ users: z.array(userResponseSchema) })),
            },
            401: unauthorized,
            403: forbidden,
          },
        },
      },
      '/admin/posts': {
        get: {
          tags: ['admin'],
          summary: '投稿一覧を取得（管理者専用）',
          security: auth,
          responses: {
            200: {
              description: '投稿一覧',
              ...jsonContent(z.object({ posts: z.array(postResponseSchema) })),
            },
            401: unauthorized,
            403: forbidden,
          },
        },
      },
      '/admin/users/{id}': {
        patch: {
          tags: ['admin'],
          summary: 'ユーザーの名前・ロールを更新（管理者専用、自分自身のロール変更は不可）',
          security: auth,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, ...jsonContent(updateUserSchema) },
          responses: {
            200: {
              description: '更新後のユーザー',
              ...jsonContent(z.object({ user: userResponseSchema })),
            },
            400: badRequest,
            401: unauthorized,
            403: forbidden,
          },
        },
        delete: {
          tags: ['admin'],
          summary: 'ユーザーを削除（管理者専用、自分自身は削除不可）',
          security: auth,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: '削除成功',
              ...jsonContent(successResponseSchema),
            },
            400: badRequest,
            401: unauthorized,
            403: forbidden,
          },
        },
      },
    },
  } as const
}
