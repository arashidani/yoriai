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

**ルール: ルートは `lib/hono/routes/` に機能単位でファイルを作り、`lib/hono/app.ts` に登録する。**

### ルートファイルの基本形

```ts
// lib/hono/routes/comments.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/lib/hono/middleware/auth'
import { prisma } from '@/lib/prisma/client'

const createCommentSchema = z.object({
  body: z.string().min(1).max(1000),
})

export const commentsRoute = new Hono()
  .get('/', async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comments: [] })
    }
    const comments = await prisma.comment.findMany()
    return c.json({ comments })
  })
  .post('/', authMiddleware, zValidator('json', createCommentSchema), async (c) => {
    const user = c.get('user')
    const { body } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comment: { id: 'mock-1', body, authorId: user.id } }, 201)
    }
    const comment = await prisma.comment.create({
      data: { body, authorId: user.id },
    })
    return c.json({ comment }, 201)
  })
```

### app.ts への登録

```ts
// lib/hono/app.ts
import { commentsRoute } from './routes/comments'

const app = new Hono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)
  .route('/comments', commentsRoute)   // ← 追加
```

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

**ルール: 認証が必要なルートには `authMiddleware` を付ける。`c.get('user')` で Prisma の User が取れる。**

```ts
import { authMiddleware } from '@/lib/hono/middleware/auth'

// 単一ルートに付ける
.post('/', authMiddleware, async (c) => {
  const user = c.get('user')   // { id, email, role, supabaseId, ... }
})

// ルート全体に付ける（管理者ルートパターン）
export const adminRoute = new Hono()
  .use(authMiddleware)
  .use(async (c, next) => {
    if (c.get('user').role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)
    return next()
  })
  .get('/users', async (c) => { ... })
```

MOCK_MODE では `fixtures.ts` の `MOCK_USERS[0]`（ADMIN）が自動でセットされる。

---

## 4. バリデーション

**ルール: リクエストボディは必ず `zValidator` でバリデーションする。スキーマは `lib/schemas/` に置いてフロントと共有する。**

```ts
// lib/schemas/post.ts にスキーマを定義
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
})

// ルートで使う
import { createPostSchema } from '@/lib/schemas/post'

.post('/', authMiddleware, zValidator('json', createPostSchema), async (c) => {
  const data = c.req.valid('json')   // 型安全・バリデーション済み
})
```

スキーマをルートファイルにインラインで書くのは、フロントと共有しない場合のみ許容。

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

- ルートハンドラに MOCK_MODE 分岐を書かない → 必ず書く
- スキーマを `lib/schemas/` 以外にインラインで書く → フロントと共有できなくなる
- `new PrismaClient()` を直接呼ぶ → `@/lib/prisma/client` の singleton を使う
- `authMiddleware` なしで `c.get('user')` を呼ぶ → undefined になる
- `app/api/[[...route]]/route.ts` を直接編集する → `lib/hono/routes/` にルートを追加して `app.ts` で登録する
