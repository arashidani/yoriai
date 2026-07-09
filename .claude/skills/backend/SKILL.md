---
name: backend
description: yoriai のバックエンド実装スキル。Hono RPCルート定義、MOCK_MODEパターン、認証ミドルウェア、zValidatorによるバリデーション、Prisma 7のクエリパターン、Supabase Authの実装ルールをまとめる。lib/hono/, lib/prisma/, lib/supabase/, lib/schemas/, app/api/, prisma/ 配下の実装時に使う。
paths:
  - "lib/hono/**/*.ts"
  - "lib/prisma/**/*.ts"
  - "lib/supabase/**/*.ts"
  - "lib/schemas/**/*.ts"
  - "app/api/**/*.ts"
  - "prisma/**/*.prisma"
---

# Backend Skill — Hono + Prisma + Supabase (yoriai)

新規参画者向けの詳しいチュートリアル（APIルート追加手順、既存ルート一覧など）は [references/onboarding.md](references/onboarding.md) を参照。

## ドキュメント参照ルール

実装前に必ず以下のドキュメントを参照すること。

```
# Hono の API・ミドルウェア
→ hono-docs-mcp を使う

# Supabase Auth・RLS
→ Context7: resolve_library_id: "supabase" → get_library_docs

# Hono（Context7でも可）
→ Context7: resolve_library_id: "hono" → get_library_docs
```

このプロジェクトは **Prisma 7 + Hono 4 + Next.js 16** を使っており、古いバージョンの知識と異なる箇所がある。必ずドキュメントで確認する。

---

## 1. ルート定義パターン

**ルール: ルートは `@hono/zod-openapi` の `OpenAPIHono` + `createRoute` で定義する。`lib/hono/routes/` に機能単位でファイルを作り、`lib/hono/app.ts` に登録する。OpenAPI 仕様書（`/api/openapi.json`・`/api/docs`）はルート定義から自動生成されるので、素の `new Hono()` / `zValidator` は使わない。**

### ルートファイルの基本形

`createRoute` で「メソッド・パス・リクエスト・レスポンス」を宣言し、`app.openapi(route, handler)` でハンドラを紐づける。`c.json()` の戻り値はレスポンススキーマで型チェックされるので、宣言した型と一致させる。

```ts
// lib/hono/routes/comments.ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware, type AuthVariables } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse } from '@/lib/hono/openapi/schemas'
import { createCommentSchema } from '@/lib/schemas/comment'
import { prisma } from '@/lib/prisma/client'

const CommentSchema = z
  .object({ id: z.string(), body: z.string(), authorId: z.string().nullable() })
  .openapi('Comment')

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['comments'],
  summary: 'コメント一覧を取得',
  responses: {
    200: {
      description: 'コメント一覧',
      content: { 'application/json': { schema: z.object({ comments: z.array(CommentSchema) }) } },
    },
  },
})

const createCommentRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['comments'],
  summary: 'コメントを作成',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: { required: true, content: { 'application/json': { schema: createCommentSchema } } },
  },
  responses: {
    201: {
      description: '作成されたコメント',
      content: { 'application/json': { schema: z.object({ comment: CommentSchema }) } },
    },
    401: errorResponse('未認証'),
  },
})

// Variables を型引数に渡すと c.get('user') が型付く。defaultHook でバリデーションエラーを { error } 形に揃える。
export const commentsRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comments: [] }, 200)
    }
    const comments = await prisma.comment.findMany()
    return c.json({ comments }, 200)
  })
  .openapi(createCommentRoute, async (c) => {
    const user = c.get('user')
    const { body } = c.req.valid('json')
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comment: { id: 'mock-1', body, authorId: user.id } }, 201)
    }
    const comment = await prisma.comment.create({ data: { body, authorId: user.id } })
    return c.json({ comment }, 201)
  })
```

- パスパラメータは `path: '/{id}'` と書き、`request: { params: IdParamSchema }` で受ける。RPC クライアント側は従来どおり `:id`（例: `client.api.comments[':id'].$delete(...)`）。
- ルート全体に認証をかけるパターン（管理者ルート）は `admin.ts` を参照。`.use()` は `OpenAPIHono` 型を失うので `$()` で戻す。
- レスポンスの共通スキーマ（`UserSchema`/`PostSchema`/`ErrorSchema`/`SuccessSchema`/`IdParamSchema`）は `lib/hono/openapi/schemas.ts` にある。Prisma の `Date` はそのまま渡せるよう `z.date().openapi({ type: 'string', format: 'date-time' })` を使う。

### app.ts への登録

```ts
// lib/hono/app.ts
import { commentsRoute } from './routes/comments'

const app = new OpenAPIHono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)
  .route('/comments', commentsRoute)   // ← 追加
```

新しい `tags` を使ったら `lib/hono/openapi/config.ts` の `tags` にも説明を足す。

### OpenAPI 仕様書の生成

ルート定義がそのまま仕様書になる。手書きの仕様ファイルは持たない。

- 実行中に閲覧: `GET /api/docs`（Swagger UI）・`GET /api/openapi.json`
- 静的ファイルに書き出し: `npm run openapi:generate` → `openapi/openapi.json` と `openapi/openapi.yaml`。ルートを変更したら再生成してコミットする。

---

## 2. MOCK_MODE パターン

**ルール: すべてのルートハンドラの先頭に MOCK_MODE 分岐を入れる。Prisma・Supabase を呼ぶ前に返す。**

```ts
.get('/', async (c) => {
  // ① 必ずこれを先頭に
  if (process.env.MOCK_MODE === 'true') {
    return c.json({ items: MOCK_ITEMS })
  }
  // ② 本番処理
  const items = await prisma.item.findMany()
  return c.json({ items })
})
```

モックデータは `lib/mocks/fixtures.ts` に追加する。インラインで書かない。

---

## 3. 認証ミドルウェア

**ルール: 認証が必要なルートには `authMiddleware` を付ける。`OpenAPIHono<{ Variables: AuthVariables }>` にしておくと `c.get('user')` が型付く。OpenAPI 側では `security: [{ supabaseSession: [] }]` を宣言する。**

```ts
import { authMiddleware, type AuthVariables } from '@/lib/hono/middleware/auth'

// 単一ルートに付ける: createRoute の middleware プロパティに渡す
const route = createRoute({
  method: 'post',
  path: '/',
  security: [{ supabaseSession: [] }],
  middleware: [authMiddleware] as const,
  // ...
})

// ルート全体に付ける（管理者ルートパターン）: .use() は OpenAPIHono 型を失うので $() で戻す
import { OpenAPIHono, $ } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'

const adminGuard = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (c.get('user').role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)
  return next()
})

export const adminRoute = $(
  new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook }).use(authMiddleware).use(adminGuard)
).openapi(route, handler)
```

MOCK_MODE では `fixtures.ts` の `MOCK_USERS[0]`（ADMIN）が自動でセットされる。

---

## 4. バリデーション

**ルール: リクエストのバリデーションは `createRoute` の `request`（`body` / `params` / `query`）で宣言する。ボディ・クエリのスキーマは `lib/schemas/` に置いてフロントと共有する。`c.req.valid('json' | 'param' | 'query')` で型安全・検証済みの値が取れる。**

```ts
// lib/schemas/post.ts にスキーマを定義（import { z } from 'zod' のまま。フロントの react-hook-form と共有）
export const createPostSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  body: z.string().min(1, '本文は必須です'),
})

// ルートで使う
import { createPostSchema } from '@/lib/schemas/post'

const route = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: { required: true, content: { 'application/json': { schema: createPostSchema } } },
  },
  responses: { /* ... */ },
})

app.openapi(route, async (c) => {
  const data = c.req.valid('json')   // 型安全・バリデーション済み
})
```

- 検証失敗時は `defaultHook`（`lib/hono/openapi/hook.ts`）が `{ error: <zodメッセージ> }` を 400 で返す。so スキーマのメッセージがそのままレスポンスになるため、`min(1, 'タイトルは必須です')` のように日本語メッセージを付ける。
- スキーマの `min`/`max` などの制約は OpenAPI ドキュメントにも反映される。
- スキーマをルートファイルにインラインで書くのは、フロントと共有しない場合のみ許容。

---

## 5. Prisma クエリパターン

**ルール: `prisma` は `@/lib/prisma/client` から import する。直接 `new PrismaClient()` しない。**

```ts
import { prisma } from '@/lib/prisma/client'

// 一覧取得
const posts = await prisma.post.findMany({
  include: { author: true },
  orderBy: { createdAt: 'desc' },
})

// 単一取得（見つからない場合は null）
const post = await prisma.post.findUnique({
  where: { id },
  include: { author: true },
})
if (!post) return c.json({ error: 'Not found' }, 404)

// 作成
const post = await prisma.post.create({
  data: { title, body, authorId: user.id },
  include: { author: true },
})

// 更新
const post = await prisma.post.update({
  where: { id },
  data: { title },
})

// 削除
await prisma.post.delete({ where: { id } })
```

### Prisma 7 の注意点

| やってはいけない | 正しい書き方 |
|----------------|-------------|
| `new PrismaClient({ datasourceUrl })` | `new PrismaPg()` adapter 経由（client.ts に実装済み） |
| `import ... from '@/app/generated/prisma'` | `import ... from '@/app/generated/prisma/client'` |
| `previewFeatures = ["driverAdapters"]` | 不要（Prisma 7 で stable） |

### スキーマ変更・マイグレーションの手順

詳細手順（コマンド早見表、本番デプロイ、Supabaseのpooled/direct接続の使い分けなど）は [migration skill](../migration/SKILL.md) を参照。

```bash
# 1. prisma/schema.prisma を編集
# 2. マイグレーション作成+適用
npx prisma migrate dev --name <変更内容>
# 3. クライアント再生成（Prisma 7では自動実行されないので必須）
npx prisma generate
```

---

## 6. エラーレスポンス

**ルール: エラーは `c.json({ error: 'メッセージ' }, ステータスコード)` で返す。**

```ts
// 404
if (!post) return c.json({ error: 'Not found' }, 404)

// 401
if (!authUser) return c.json({ error: 'Unauthorized' }, 401)

// 403
if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)
```

---

## 7. Supabase Auth（Hono内での使い方）

Hono のハンドラ内で Supabase セッションを取得するときは、クッキーを手動でパースする。

```ts
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        const cookie = c.req.header('cookie') ?? ''
        return cookie.split(';').flatMap((part) => {
          const [name, ...rest] = part.trim().split('=')
          if (!name) return []
          return [{ name: name.trim(), value: rest.join('=') }]
        })
      },
      setAll() {},
    },
  }
)

const { data: { user } } = await supabase.auth.getUser()
```

詳細な Supabase Auth の挙動は Context7 または hono-docs-mcp で確認すること。

---

## 8. やってはいけないこと

- 素の `new Hono()` / `zValidator` でルートを書く → `OpenAPIHono` + `createRoute` を使う（でないと仕様書に載らない）
- 手書きの OpenAPI 仕様ファイルを作る → ルート定義が唯一のソース。`npm run openapi:generate` で書き出す
- ルートハンドラに MOCK_MODE 分岐を書かない → 必ず書く。モックの戻り値もレスポンススキーマに合わせる
- リクエスト用スキーマを `lib/schemas/` 以外にインラインで書く → フロントと共有できなくなる
- `new PrismaClient()` を直接呼ぶ → `@/lib/prisma/client` の singleton を使う
- `authMiddleware` なしで `c.get('user')` を呼ぶ → undefined になる
- `app/api/[[...route]]/route.ts` を直接編集する → `lib/hono/routes/` にルートを追加して `app.ts` で登録する
