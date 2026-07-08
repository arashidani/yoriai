---
name: frontend
description: yoriai のフロントエンド実装スキル。Next.js 16 App Router の Server/Client Component、Route Groups、Hono RPCクライアント、MOCK_MODE、react-hook-form + Zod、shadcn/ui、Storybookの実装パターンとルールをまとめる。app/, components/, lib/stores/, lib/schemas/ 配下の実装時に使う。
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
  - "components/**/*.tsx"
  - "lib/stores/**/*.ts"
  - "lib/schemas/**/*.ts"
---

# Frontend Skill — Next.js (yoriai)

新規参画者向けの詳しいチュートリアル（ページ・コンポーネント追加手順、画面一覧など）は [references/onboarding.md](references/onboarding.md) を参照。

## ドキュメント参照ルール

Next.js の API・挙動で迷ったら必ず **Context7 の Next.js 最新ドキュメント**を参照すること。このプロジェクトは Next.js 16 を使っており、トレーニングデータの知識と異なる破壊的変更がある。

```
# Context7 で調べるとき
resolve_library_id: "next.js" → get_library_docs
```

---

## 1. Server Component vs Client Component

**ルール: デフォルトは Server Component。`useState` / `useEffect` / イベントハンドラが必要になって初めて `'use client'` にする。**

### Server Component（DBから直接取得）

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
  const { id } = await params   // Next.js 16: params は Promise
  const post = await getPost(id)
  if (!post) notFound()
  return <article>{post.title}</article>
}
```

### Client Component（ユーザー操作が必要）

```tsx
// app/(user)/posts/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { client } from '@/lib/hono/client'
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

## 2. Route Groups とレイアウト

**ルール: `(group)` ディレクトリはURLに影響しない。レイアウトを分けるためだけに使う。**

```
app/
├── (user)/layout.tsx    → / /posts/* に適用（ヘッダー + ログアウト）
├── (admin)/layout.tsx   → /admin/* に適用（サイドバー + ロールチェック）
└── (auth)/              → /login /register（レイアウトなし）
```

新しいユーザー向けページは `app/(user)/` 配下に置くだけでヘッダーが自動適用される。  
管理者ページは `app/(admin)/admin/` 配下に置く。

---

## 3. Hono RPC クライアント

**ルール: API を叩くときは必ず `@/lib/hono/client` の `client` を使う。`fetch` を直接書かない。**

```ts
import { client } from '@/lib/hono/client'

// GET
const res = await client.api.posts.$get()
const { posts } = await res.json()  // 型推論が効く

// POST
const res = await client.api.posts.$post({ json: { title, body } })

// パスパラメータ
const res = await client.api.posts[':id'].$delete({ param: { id } })
```

メソッド名: `$get` `$post` `$put` `$patch` `$delete`

---

## 4. MOCK_MODE

**ルール: Server Component / Hono routes は `MOCK_MODE`、Client Component は `NEXT_PUBLIC_MOCK_MODE` を参照する。**

```tsx
// Server Component・lib/ 内
if (process.env.MOCK_MODE === 'true') return MOCK_ITEMS

// Client Component（'use client' ファイル）
if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') { ... }
```

`NEXT_PUBLIC_` がないとブラウザで読めない。Client Component で `MOCK_MODE` を参照しても常に `undefined` になる。

---

## 5. フォーム

**ルール: react-hook-form + zodResolver を使う。スキーマは `lib/schemas/` に置いてバックエンドと共有する。**

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, type CreatePostInput } from '@/lib/schemas/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PostForm({ onSubmit }: { onSubmit: (data: CreatePostInput) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...register('title')} aria-invalid={!!errors.title} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <Button type="submit">送信</Button>
    </form>
  )
}
```

---

## 6. コンポーネント設計

**ルール: UIコンポーネントは shadcn/ui を使う。クラス結合は `cn()` を使う。新しいコンポーネントにはストーリーを書く。**

```tsx
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ✅ Good
<div className={cn('p-4 border rounded', isActive && 'bg-primary text-primary-foreground')}>

// ❌ Bad: テンプレートリテラルで条件分岐
<div className={`p-4 border rounded ${isActive ? 'bg-primary' : ''}`}>
```

**ルール: 新しい shadcn コンポーネントが必要なときは、ターミナルで `npx shadcn@latest add <component-name>` を直接叩かず、必ず shadcn MCP（[導入詳細](../setup/references/shadcn-mcp.md)）経由で検索・追加する。** 特に `app/(admin)/` 配下はコンポーネント追加が多いため徹底する。

1. `search_items_in_registries` でコンポーネントを検索する
2. `view_items_in_registries` で依存関係・ファイル内容を確認する
3. `get_add_command_for_items` で追加コマンドを取得し、それを実行する
4. `get_audit_checklist` で追加後に確認すべき項目を取得し、チェックする

### Storybook ストーリーの書き方

**ルール: import は `@storybook/nextjs-vite` から。`play` を書くときのアサーション・ユーザー操作は `storybook/test` の `expect` / `userEvent` / `fn` を使う（`@storybook/test` ではない）。**

#### 基本形

```tsx
// components/posts/post-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { PostCard } from './post-card'

const meta = {
  component: PostCard,
  parameters: {
    // next/link や next/navigation を使うコンポーネントには必須
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof meta>

const basePost = {
  id: 'post-1',
  title: 'タイトル',
  body: '本文',
  author: { id: 'user-1', name: '投稿者', email: 'a@example.com' },
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
}

export const Default: Story = {
  args: { post: basePost },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/タイトル/)).toBeVisible()
  },
}
```

- `meta` は `satisfies Meta<typeof Component>` で定義し、`Story` 型は `StoryObj<typeof meta>` から導出する（`Meta<typeof Component>` / `StoryObj<typeof Component>` と別々に書かない）。
- 1つの `.stories.tsx` に複数の Story をエクスポートし、境界値・異常系ごとに名前を分ける: `Default`, `Empty`, `LongBody`, `NoName`, `ValidationErrors`, `Submitting` など。

#### コールバック props は `fn()` でモックする

```tsx
import { expect, fn, userEvent } from 'storybook/test'
import { PostForm } from './post-form'

const meta = { component: PostForm } satisfies Meta<typeof PostForm>
export default meta
type Story = StoryObj<typeof meta>

export const ValidationErrors: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /投稿する/ }))
    await expect(await canvas.findByText('タイトルは必須です')).toBeVisible()
  },
}
```

`play` の第一引数からも `canvas` / `userEvent` を受け取れる（`storybook/test` から個別 import しても良い）。フォーム送信など実際に呼ばれたかを検証したいときは `expect(onSubmit).toHaveBeenCalled()` のように `fn()` の戻り値を使う。

#### API 呼び出しがあるコンポーネントは MSW でモックする

グローバルなハンドラーは [.storybook/msw-handlers.ts](../../../.storybook/msw-handlers.ts) に定義済みで、[.storybook/preview.tsx](../../../.storybook/preview.tsx) の `parameters.msw.handlers` に全ストーリー共通で読み込まれている。個別のストーリーだけ挙動を変えたい場合は `parameters.msw.handlers` を上書きする。

```tsx
import { http, HttpResponse } from 'msw'

export const Empty: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/posts', () => HttpResponse.json({ posts: [] }))] },
  },
}

export const ServerError: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/posts', () => HttpResponse.json({ error: 'Internal Error' }, { status: 500 }))] },
  },
}
```

新しい API エンドポイントを追加したら、`.storybook/msw-handlers.ts` に対応するハンドラーも追加しておく（fixture は `lib/mocks/fixtures.ts` から再利用する）。

#### チェックリスト

1. `components/<domain>/<name>.stories.tsx` に置く（コンポーネント本体と同じディレクトリ）
2. `meta` は `satisfies Meta<typeof Component>`、`next/link` 等を使うなら `parameters.nextjs.appDirectory: true`
3. 最低 `Default` を書く。フォーム/一覧系は `Empty` / `LongBody` / `NoName` などの境界値も書く
4. インタラクションがあるものは `play` で `expect` / `userEvent` を使って検証する
5. コールバック props は `fn()` を渡す
6. API を叩くコンポーネントは MSW ハンドラー（共通 or `parameters.msw.handlers` で上書き）を用意する
7. `npm run storybook` で見た目とインタラクションを確認する

---

## 7. デザインシステム（globals.css / Obra デザイントークン）

**ルール: スタイルは必ず `app/globals.css` のデザイントークンを使う。生のカラースケール（`blue-500` など）や任意値（`bg-[#3b82f6]`）を直接書かない。**

トークンは Figma の **Obra shadcn/ui kit (community edition 1.6.0)** の variables を移植したもので、shadcn の意味トークンへ 1:1 で対応している。Light/Dark は `:root` / `.dark` で値だけを切り替えるため、コンポーネント側のクラス指定は同じでよい。

### 使うトークン（意味トークン = shadcn 準拠）

| 用途 | ユーティリティ |
|---|---|
| 背景 / 文字 | `bg-background` `text-foreground` |
| カード | `bg-card` `text-card-foreground` |
| ポップオーバー | `bg-popover` `text-popover-foreground` |
| 主要アクション | `bg-primary` `text-primary-foreground` |
| 副次アクション | `bg-secondary` `text-secondary-foreground` |
| 補助 / 控えめ | `bg-muted` `text-muted-foreground` |
| アクセント | `bg-accent` `text-accent-foreground` |
| 破壊的操作 | `bg-destructive` `text-destructive-foreground`（テキストは `text-destructive`） |
| 罫線 / 入力枠 / フォーカス | `border-border` `border-input` `ring-ring` |
| グラフ | `text-chart-1` 〜 `text-chart-5`（`fill-*` / `stroke-*` も可） |
| サイドバー | `bg-sidebar` `text-sidebar-foreground` `bg-sidebar-accent` … |

### タイポグラフィ（Obra スケール）

見出し・本文は Obra のテキストトークンを使う（size / line-height / letter-spacing / weight が同梱される）。

```tsx
<h1 className="text-heading-1">見出し</h1>       {/* heading-1〜4 */}
<p className="text-paragraph">本文</p>            {/* paragraph-large / paragraph / -small / -mini */}
<span className="text-caption">キャプション</span> {/* caption / monospaced */}
```

フォントファミリは `font-sans`（= Geist）/ `font-heading` / `font-mono`（= Geist Mono）。個別の `text-[15px]` などは使わない。

### 角丸・シャドウ・余白

- 角丸: `rounded-sm` / `-md` / `-lg` / `-xl`（`--radius` 基準で派生）
- シャドウ: `shadow-2xs` 〜 `shadow-2xl`（Obra 準拠）
- 余白: `--spacing`（`0.25rem` = 4px）基準で `p-4` `gap-2` などが生成される。Figma 側も「4px の倍数」に揃える

### 注意

- **Tailwind v4 では `theme()` 関数は使わない。** 素の値参照が必要なときだけ `var(--…)` を使う（`theme('colors.blue.500')` は書かない）。
- 生のプリミティブ（`blue-500` `neutral-900` や `black-alpha-*`）は原則使わない。オーバーレイ等でどうしても必要な場合のみ `bg-black-alpha-50` などを使う。
- 新しい役割の色が必要になったら、その場で任意値を書かず **`globals.css` にトークンを追加**してから使う。

```tsx
// ✅ Good: 意味トークン + Obra タイポトークン
<div className="bg-card text-card-foreground rounded-lg border-border shadow-md">
  <h2 className="text-heading-3">タイトル</h2>
  <p className="text-paragraph text-muted-foreground">説明</p>
</div>

// ❌ Bad: 生スケール / 任意値 / 旧トークン
<div className="bg-[#ffffff] text-gray-900 border-edge">
<div className="bg-blue-500 text-[18px]">
```

---

## 8. ページ追加チェックリスト

新しいページを追加するとき、この順番で進める:

1. `app/(user)/` または `app/(admin)/admin/` にページファイルを作る
2. Server Component ならそのまま `async function` で書く
3. データ取得関数に MOCK_MODE 分岐を入れる
4. Client Component が必要な部分は `components/` に切り出す
5. ストーリーを書く

---

## 9. やってはいけないこと

- `fetch('/api/...')` を直接書く → `client.api...` を使う
- Server Component に `'use client'` を付ける → 必要なときだけ付ける
- `middleware.ts` を作る → Next.js 16 では `proxy.ts` に `export function proxy()`
- `components/ui/` を直接編集する → shadcn が再生成すると上書きされる
- フォームスキーマをコンポーネント内にインラインで書く → `lib/schemas/` に置く
- shadcn コンポーネント追加時に `npx shadcn@latest add` をターミナルで直接叩く → shadcn MCP 経由で検索・追加する
