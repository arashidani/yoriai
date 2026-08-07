# yoriai セットアップ手順書

同じ構成のプロジェクトをゼロから再現するための手順書。

---

## 1. プロジェクト作成

```bash
cd /Users/yuya.arashidani/projects
npx create-next-app@latest yoriai \
  --typescript --tailwind --app \
  --no-src-dir --import-alias "@/*"
cd yoriai
```

---

## 2. 依存パッケージのインストール

```bash
# API・バリデーション
npm install hono @hono/zod-validator zod

# Prisma（Prisma 7 + PostgreSQL driver adapter）
npm install prisma @prisma/client @prisma/adapter-pg pg @types/pg

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# フォーム・状態管理
npm install react-hook-form @hookform/resolvers zustand

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label textarea

# Storybook
npx storybook@latest init
```

---

## 3. 環境変数

`.env.local` を作成:

```env
# ローカル開発（DB・Supabase不要）
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true

# Supabase接続時に追加（MOCK_MODE=trueは削除する）
# DATABASE_URL=postgresql://...        ← Supabase > Connect > ORMs > Prisma > DATABASE_URL
# DIRECT_URL=postgresql://...          ← Supabase > Connect > ORMs > Prisma > DIRECT_URL
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 4. Prisma セットアップ

### schema.prisma

`prisma/schema.prisma` を書き換え:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id         String   @id @default(cuid())
  supabaseId String   @unique
  email      String   @unique
  name       String?
  role       Role     @default(USER)
  posts      Post[]
  createdAt  DateTime @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  body      String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### prisma.config.ts（プロジェクトルート）

```ts
import { config } from 'dotenv'
config({ path: '.env.local' })
config()
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DIRECT_URL'],
  },
})
```

### クライアント生成・マイグレーション

```bash
# クライアント生成（MOCK_MODE中もこれは必要）
npx prisma generate

# Supabase接続後にマイグレーション実行
npx prisma migrate dev --name init
```

---

## 5. lib/ ファイル群

### lib/prisma/client.ts

```ts
import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

> **Prisma 7 の注意点:** `new PrismaClient({ datasourceUrl })` は廃止。`@prisma/adapter-pg` の driver adapter 経由が必須。

### lib/supabase/client.ts

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### lib/supabase/server.ts

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### lib/schemas/post.ts

```ts
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  body: z.string().min(1, '本文は必須です'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
```

### lib/mocks/fixtures.ts

```ts
export const MOCK_USERS = [
  { id: 'user-1', supabaseId: 'supabase-user-1', email: 'dev@example.com',  name: '開発者',     role: 'ADMIN' as const, createdAt: new Date('2024-01-01') },
  { id: 'user-2', supabaseId: 'supabase-user-2', email: 'user@example.com', name: '一般ユーザー', role: 'USER'  as const, createdAt: new Date('2024-01-02') },
]

export const MOCK_POSTS = [
  { id: 'post-1', title: 'サンプル質問 1', body: '本文サンプル', authorId: 'user-2', author: MOCK_USERS[1], createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10') },
]
```

### lib/stores/auth-store.ts

```ts
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

type AuthStore = {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

---

## 6. Hono セットアップ

### lib/hono/app.ts

```ts
import { Hono } from 'hono'
import { postsRoute } from './routes/posts'
import { adminRoute } from './routes/admin'
import { usersRoute } from './routes/users'

const app = new Hono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)

export type AppType = typeof app
export default app
```

### lib/hono/client.ts

```ts
import { hc } from 'hono/client'
import type { AppType } from './app'

export const client = hc<AppType>('/')
```

### app/api/[[...route]]/route.ts

```ts
import app from '@/lib/hono/app'

export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const PATCH = app.fetch
export const DELETE = app.fetch
```

### lib/hono/middleware/auth.ts

```ts
import { createMiddleware } from 'hono/factory'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma/client'
import type { User } from '@/app/generated/prisma/client'
import { MOCK_USERS } from '@/lib/mocks/fixtures'

type Variables = { user: User | (typeof MOCK_USERS)[number] }

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    if (process.env.MOCK_MODE === 'true') {
      c.set('user', MOCK_USERS[0])
      return next()
    }

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

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return c.json({ error: 'Unauthorized' }, 401)

    const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
    if (!user) return c.json({ error: 'User not found' }, 401)

    c.set('user', user)
    return next()
  }
)
```

---

## 7. proxy.ts（Next.js 16 の middleware）

> **Next.js 16 の注意点:** `middleware.ts` は廃止。`proxy.ts` に `export async function proxy()` で書く。

`proxy.ts`（プロジェクトルート）:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/register']
  if (!user && !publicPaths.includes(pathname) && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 8. ディレクトリ構成（最終形）

```
yoriai/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx            # 管理者レイアウト（ロールチェック + サイドバー）
│   │   └── admin/
│   │       ├── page.tsx          # /admin
│   │       ├── posts/page.tsx    # /admin/posts
│   │       └── users/page.tsx    # /admin/users
│   ├── (auth)/
│   │   ├── login/page.tsx        # /login
│   │   └── register/page.tsx     # /register
│   ├── (user)/
│   │   ├── layout.tsx            # ユーザーレイアウト（ヘッダー + ログアウト）
│   │   ├── page.tsx              # / （投稿一覧）
│   │   └── posts/
│   │       ├── [id]/page.tsx     # /posts/:id
│   │       └── new/page.tsx      # /posts/new
│   ├── api/[[...route]]/
│   │   └── route.ts              # Hono マウント
│   ├── generated/prisma/         # npx prisma generate で自動生成
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── logout-button.tsx
│   ├── posts/
│   │   ├── post-card.tsx
│   │   └── post-form.tsx
│   ├── admin/
│   │   └── user-table.tsx
│   └── ui/                       # shadcn/ui
├── lib/
│   ├── hono/
│   │   ├── app.ts
│   │   ├── client.ts
│   │   ├── middleware/auth.ts
│   │   └── routes/
│   │       ├── posts.ts
│   │       ├── admin.ts
│   │       └── users.ts
│   ├── mocks/fixtures.ts
│   ├── prisma/client.ts
│   ├── schemas/post.ts
│   ├── stores/auth-store.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── proxy.ts                      # middleware（Next.js 16）
└── .env.local
```

---

## 9. Supabase 初期設定チェックリスト

- [ ] プロジェクト作成後、`.env.local` に URL と anon key を追加
- [ ] Authentication → Sign In / Providers → **"Confirm email" をオフ**（架空メアドで登録できるようにする）
- [ ] `npx prisma migrate dev` でテーブル作成
- [ ] `MOCK_MODE=true` と `NEXT_PUBLIC_MOCK_MODE=true` を `.env.local` から削除
- [ ] `/register` でユーザー登録 → `/` にリダイレクトされることを確認

---

## 10. よくあるエラー

| エラー | 原因 | 対処 |
|--------|------|------|
| `Can't resolve '@/app/generated/prisma'` | Prisma 7 は `index.ts` がない | `'/client'` を末尾に付ける |
| `'datasourceUrl' does not exist` | Prisma 7 で廃止 | `@prisma/adapter-pg` の driver adapter を使う |
| `middleware.ts` deprecation warning | Next.js 16 で廃止 | `proxy.ts` に `export function proxy()` で書く |
| `previewFeatures = ["driverAdapters"]` warning | Prisma 7 でプレビュー卒業 | `schema.prisma` から削除する |
| Turbopack cache error | 内部エラーでキャッシュが壊れた | `rm -rf .next` して再起動 |
