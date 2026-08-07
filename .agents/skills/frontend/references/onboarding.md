# フロントエンドエンジニア向けオンボーディング

## このプロジェクトのフロントエンド構成

Next.js 16 App Router。ページは Server Component（`async`関数）が基本で、インタラクションが必要な部分だけ Client Component にする。

```
app/
├── (user)/           ← 一般ユーザー向け（ヘッダー付きレイアウト）
│   ├── layout.tsx    ← ヘッダー + ログアウトボタン
│   ├── page.tsx      ← / 投稿一覧
│   └── posts/
│       ├── [id]/page.tsx   ← 投稿詳細（Server Component）
│       └── new/page.tsx    ← 投稿作成（Client Component）
├── (admin)/          ← 管理者のみ（サイドバー付きレイアウト）
└── (auth)/           ← ログイン・登録（レイアウトなし）
```

---

## ローカル環境の起動

```bash
npm install
npm run dev       # localhost:3000
npm run storybook # localhost:6006（コンポーネント開発）
```

---

## Server Component と Client Component の使い分け

### Server Component（デフォルト）
- DBから直接データを取得できる
- `'use client'` を書かない
- `useState` / `useEffect` / イベントハンドラは使えない

```tsx
// app/(user)/posts/[id]/page.tsx
import { prisma } from '@/lib/prisma/client'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'

async function getPost(id: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_POSTS.find((p) => p.id === id) ?? null
  }
  return prisma.post.findUnique({
    where: { id },
    include: { author: true },
  })
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
```

### Client Component
- ユーザー操作（クリック・フォーム送信）が必要なとき
- ファイル先頭に `'use client'` を書く
- APIを叩くときは Hono RPC クライアントを使う

```tsx
// app/(user)/posts/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { client } from '@/lib/hono/client'
import { PostForm } from '@/components/posts/post-form'
import type { CreatePostInput } from '@/lib/schemas/post'

export default function NewPostPage() {
  const router = useRouter()

  async function handleSubmit(data: CreatePostInput) {
    const res = await client.api.posts.$post({ json: data })
    if (res.ok) router.push('/')
  }

  return <PostForm onSubmit={handleSubmit} />
}
```

---

## Hono RPC クライアントの使い方

型安全にAPIを叩ける。レスポンスの型も自動で推論される。

```ts
import { client } from '@/lib/hono/client'

// GET /api/posts
const res = await client.api.posts.$get()
const { posts } = await res.json()

// POST /api/posts
const res = await client.api.posts.$post({
  json: { title: 'タイトル', body: '本文' }
})
const { post } = await res.json()

// DELETE /api/posts/:id
const res = await client.api.posts[':id'].$delete({
  param: { id: 'post-123' }
})
```

メソッド名のルール: `$get` `$post` `$put` `$patch` `$delete`

---

## 新しいページを追加する手順

### 例：通知一覧ページ `/notifications`

#### 1. ページファイルを作る

```tsx
// app/(user)/notifications/page.tsx
import { MOCK_NOTIFICATIONS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getNotifications() {
  if (process.env.MOCK_MODE === 'true') return MOCK_NOTIFICATIONS
  return prisma.notification.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">通知</h1>
      {notifications.map((n) => (
        <div key={n.id} className="p-4 border rounded mb-2">
          {n.message}
        </div>
      ))}
    </div>
  )
}
```

`(user)/` 配下に置くだけでヘッダー・ログアウトボタン付きレイアウトが自動で適用される。

#### 2. ナビゲーションにリンクを追加する（必要なら）

```tsx
// app/(user)/layout.tsx の nav に追加
<Link href="/notifications">通知</Link>
```

---

## 新しいコンポーネントを追加する手順

### 例：通知カード `NotificationCard`

#### 1. コンポーネントを作る

```tsx
// components/notifications/notification-card.tsx
type NotificationCardProps = {
  message: string
  createdAt: Date | string
  read: boolean
}

export function NotificationCard({ message, createdAt, read }: NotificationCardProps) {
  return (
    <div className={`p-4 border rounded ${read ? 'opacity-50' : 'font-medium'}`}>
      <p>{message}</p>
      <span className="text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleDateString('ja-JP')}
      </span>
    </div>
  )
}
```

#### 2. Storybook のストーリーを書く

import 元は `@storybook/nextjs-vite`、`play` 内のアサーションは `storybook/test` を使う（詳しい書き方・MSW連携は [SKILL.md の「Storybook ストーリーの書き方」](../SKILL.md)を参照）。

```tsx
// components/notifications/notification-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { NotificationCard } from './notification-card'

const meta = {
  component: NotificationCard,
} satisfies Meta<typeof NotificationCard>
export default meta

type Story = StoryObj<typeof meta>

export const Unread: Story = {
  args: {
    message: '新しい回答がつきました',
    createdAt: '2024-01-15T00:00:00Z',
    read: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('新しい回答がつきました')).toBeVisible()
  },
}

export const Read: Story = {
  args: {
    message: '新しい回答がつきました',
    createdAt: '2024-01-15T00:00:00Z',
    read: true,
  },
}
```

---

## フォームの作り方

react-hook-form + Zod を使う。スキーマは `lib/schemas/` に置いてAPIと共有。

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
})
type FormInput = z.infer<typeof schema>

export function MyForm({ onSubmit }: { onSubmit: (data: FormInput) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <Button type="submit">送信</Button>
    </form>
  )
}
```

---

## UIコンポーネント（shadcn/ui）

`components/ui/` にあるものをそのまま使う。

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// 新しいコンポーネントを追加するとき
// npx shadcn@latest add <component-name>
```

---

## MOCK_MODE について

`NEXT_PUBLIC_MOCK_MODE=true` がある状態では Supabase に接続しない。

- Server Component / Hono routes: `process.env.MOCK_MODE === 'true'`
- Client Component: `process.env.NEXT_PUBLIC_MOCK_MODE === 'true'`

`NEXT_PUBLIC_` プレフィックスがないとブラウザから読めないので注意。

---

## スタイリング

Tailwind CSS 4 を使う。クラス名の結合には `cn()` を使う。

```tsx
import { cn } from '@/lib/utils'

<div className={cn('p-4 border rounded', isActive && 'bg-primary text-primary-foreground')}>
```

---

## 画面一覧

| パス | コンポーネント種別 | データ取得 |
|------|---------|---------|
| `/` | Server | Prisma直接 |
| `/posts/[id]` | Server | Prisma直接 |
| `/posts/new` | Client | Hono RPC（POST） |
| `/login` | Client | Supabase Auth |
| `/register` | Client | Supabase Auth → Hono RPC |
| `/admin` | Server | Prisma直接 |
| `/admin/users` | Server | Prisma直接 |
| `/admin/posts` | Server | Prisma直接 |
