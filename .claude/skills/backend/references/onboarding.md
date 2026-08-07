# バックエンドエンジニア向けオンボーディング

## このプロジェクトのバックエンド構成

Next.js の Route Handler に Hono をマウントした**モノリス構成**。Hono RPC により、APIの型定義がそのままフロントエンドで使える。

```
Next.js
└── app/api/[[...route]]/route.ts   ← Hono をここにマウント
    └── lib/hono/app.ts             ← ルート定義の起点
        ├── lib/hono/routes/posts.ts
        ├── lib/hono/routes/admin.ts
        └── lib/hono/routes/users.ts
```

DBは Supabase（PostgreSQL）+ Prisma 7。認証は Supabase Auth。

---

## ローカル環境の起動

```bash
npm install
npm run dev   # localhost:3000
```

`.env.local` に `MOCK_MODE=true` があればDB・Supabase不要で動く。

---

## 新しいAPIルートを追加する手順

### 1. ルートファイルを作る

例：コメント機能 `lib/hono/routes/comments.ts`

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/lib/hono/middleware/auth'
import { prisma } from '@/lib/prisma/client'

const createCommentSchema = z.object({
  body: z.string().min(1).max(1000),
})

export const commentsRoute = new Hono()
  // 投稿へのコメント一覧
  .get('/:postId/comments', async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comments: [] })
    }
    const comments = await prisma.comment.findMany({
      where: { postId: c.req.param('postId') },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    })
    return c.json({ comments })
  })
  // コメント投稿（要認証）
  .post('/:postId/comments', authMiddleware, zValidator('json', createCommentSchema), async (c) => {
    const user = c.get('user')
    const { body } = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ comment: { id: 'mock-1', body, authorId: user.id } }, 201)
    }
    const comment = await prisma.comment.create({
      data: { body, postId: c.req.param('postId'), authorId: user.id },
      include: { author: true },
    })
    return c.json({ comment }, 201)
  })
```

### 2. app.ts に登録する

```ts
// lib/hono/app.ts
import { commentsRoute } from './routes/comments'

const app = new Hono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)
  .route('/posts', commentsRoute)  // ← 追加（パスが被るときは同じ route キーに追加）
```

### 3. Prisma スキーマを更新してマイグレーション

```prisma
// prisma/schema.prisma
model Comment {
  id        String   @id @default(uuid(7))
  body      String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name add_comment
npx prisma generate
```

---

## 認証の仕組み

`authMiddleware` を使うとハンドラ内で `c.get('user')` が使える。

```ts
// MOCK_MODE=true → fixtures.ts の MOCK_USERS[0]（ADMIN）をセット
// 本番      → Supabase セッション検証 → Prisma User をセット
```

```ts
.post('/', authMiddleware, async (c) => {
  const user = c.get('user')   // { id, email, role, ... }
  // user.role === 'ADMIN' で管理者チェック
})
```

管理者専用ルートは `adminRoute` のように `.use(authMiddleware)` をまとめてかけられる。

```ts
export const adminRoute = new Hono()
  .use(authMiddleware)
  .use(async (c, next) => {
    if (c.get('user').role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)
    return next()
  })
  .get('/users', async (c) => { ... })
```

---

## MOCK_MODE パターン

すべてのルートでこのパターンを守る。Supabase なしでもフロントが動くようにするため。

```ts
.get('/', async (c) => {
  if (process.env.MOCK_MODE === 'true') {
    return c.json({ items: MOCK_ITEMS })   // fixtures から返す
  }
  const items = await prisma.item.findMany()
  return c.json({ items })
})
```

---

## 既存ルート一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/api/posts` | 不要 | 投稿一覧 |
| GET | `/api/posts/:id` | 不要 | 投稿詳細 |
| POST | `/api/posts` | 必要 | 投稿作成 |
| DELETE | `/api/posts/:id` | ADMIN | 投稿削除 |
| POST | `/api/users` | セッションのみ | ユーザー登録（Prisma User 作成） |
| GET | `/api/users/me` | 必要 | 自分のプロフィール |
| GET | `/api/admin/users` | ADMIN | ユーザー一覧 |
| GET | `/api/admin/posts` | ADMIN | 全投稿一覧（管理用） |

---

## Prismaの使い方

```ts
import { prisma } from '@/lib/prisma/client'

// 一覧取得
const posts = await prisma.post.findMany({
  include: { author: true },
  orderBy: { createdAt: 'desc' },
})

// 単一取得
const post = await prisma.post.findUnique({
  where: { id },
  include: { author: true },
})

// 作成
const post = await prisma.post.create({
  data: { title, body, authorId: user.id },
  include: { author: true },
})

// 削除
await prisma.post.delete({ where: { id } })
```

Prisma Studio でDBの中身を確認できる（Supabase 接続時）:
```bash
npx prisma studio
```

---

## Zod スキーマの置き場

バリデーションスキーマは `lib/schemas/` に置いてフロントと共有する。
ルートファイルにインラインで書かない。

```ts
// lib/schemas/post.ts — フロント・バック両方が import する
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
})
```
