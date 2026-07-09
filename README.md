# yoriai

![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)
![Hono](https://img.shields.io/badge/Hono-4.12.27-orange?logo=hono)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.110.0-3ecf8e?logo=supabase)
![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2d3748?logo=prisma)
![Storybook](https://img.shields.io/badge/Storybook-10.4.6-ff4785?logo=storybook)
![Zustand](https://img.shields.io/badge/Zustand-5.0.14-brown?logo=zustand)
![Zod](https://img.shields.io/badge/Zod-4.4.3-3068b7?logo=zod)

社内向け交流&質問共有プラットフォーム

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **API**: Hono (Route Handler) + Hono RPC
- **DB**: Supabase (PostgreSQL) + Prisma
- **認証**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand
- **バリデーション**: Zod + react-hook-form
- **コンポーネント開発**: Storybook 10

## ディレクトリ構成

```
yoriai/
├── app/
│   ├── (admin)/                  # 管理者向け画面（ADMIN ロールのみ）
│   │   ├── layout.tsx            # ロールチェック + サイドバー
│   │   └── admin/
│   │       ├── page.tsx          # ダッシュボード (/admin)
│   │       ├── posts/page.tsx    # 投稿管理 (/admin/posts)
│   │       └── users/page.tsx    # ユーザー管理 (/admin/users)
│   ├── (auth)/                   # ログイン・登録（レイアウトなし）
│   │   ├── login/page.tsx        # ログイン (/login)
│   │   └── register/page.tsx     # 新規登録 (/register)
│   ├── (user)/                   # 一般ユーザー向け画面
│   │   ├── layout.tsx            # ヘッダーナビゲーション
│   │   ├── page.tsx              # トップページ・投稿一覧 (/)
│   │   └── posts/
│   │       ├── [id]/page.tsx     # 投稿詳細 (/posts/:id)
│   │       └── new/page.tsx      # 投稿作成 (/posts/new)
│   ├── api/[[...route]]/
│   │   └── route.ts              # Hono を Next.js Route Handler にマウント
│   ├── generated/prisma/         # `npx prisma generate` で自動生成
│   ├── layout.tsx                # ルートレイアウト
│   └── globals.css
├── components/
│   ├── admin/
│   │   └── user-table.tsx        # ユーザー一覧テーブル
│   ├── posts/
│   │   ├── post-card.tsx         # 投稿カード
│   │   └── post-form.tsx         # 投稿フォーム（react-hook-form + Zod）
│   ├── logout-button.tsx         # ログアウトボタン
│   └── ui/                       # shadcn/ui コンポーネント
├── lib/
│   ├── hono/
│   │   ├── app.ts                # Hono アプリ定義・AppType export
│   │   ├── client.ts             # Hono RPC クライアント
│   │   ├── middleware/
│   │   │   └── auth.ts           # 認証ミドルウェア（MOCK_MODE 対応）
│   │   └── routes/
│   │       ├── posts.ts          # 投稿 API
│   │       ├── admin.ts          # 管理者 API
│   │       └── users.ts          # ユーザー API
│   ├── mocks/
│   │   └── fixtures.ts           # ローカル開発用モックデータ
│   ├── schemas/
│   │   └── post.ts               # Zod スキーマ（フロント・バック共有）
│   ├── stores/
│   │   └── auth-store.ts         # Zustand（認証状態）
│   ├── prisma/client.ts          # Prisma クライアント（driver adapter）
│   └── supabase/                 # Supabase クライアント（client.ts / server.ts）
├── prisma/
│   ├── schema.prisma             # DB スキーマ（User / Post / Role）
│   └── migrations/
├── proxy.ts                      # middleware（Next.js 16）
├── .claude/skills/                # Claude Code 用スキル（frontend / backend / setup）
├── .storybook/
│   ├── main.ts
│   ├── preview.tsx               # グローバル CSS・MSW 設定
│   └── msw-handlers.ts           # API モックハンドラ
└── public/
    └── mockServiceWorker.js      # MSW サービスワーカー
```

## セットアップ

```bash
npm install
```

`npm install` 実行後、[lefthook](https://github.com/evilmartians/lefthook) によるGit hooksが自動的に有効化される（`postinstall` で `lefthook install` を実行）。以降、コミット時に差分ファイルへBiomeのフォーマット・Lintが自動実行される。

`.env.local` を作成:

```env
# ローカル開発（DB・認証不要）
MOCK_MODE=true

# Supabase接続時に追加
# DATABASE_URL=postgresql://...
# DIRECT_URL=postgresql://...
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## 開発

```bash
# アプリ起動
npm run dev

# Storybook起動
npm run storybook
```

## Lint・Format

[Biome](https://biomejs.dev/) でLint・フォーマットを統一管理している。

```bash
# Lintチェック
npm run lint

# フォーマット適用
npm run format

# Lint + フォーマットをまとめて実行
npm run check
```

コミット時は [lefthook](https://github.com/evilmartians/lefthook) + [lint-staged](https://github.com/okonet/lint-staged) により、ステージ済みファイルに対して自動でBiomeのフォーマット・Lintが実行される（Lintエラー時はコミットが中断される）。`push` 時には型チェック（`tsc --noEmit`）が実行される。

## ドキュメント

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 構成図・データフロー
- [.claude/skills/](./.claude/skills/) — フロントエンド / バックエンド / セットアップ・MCP導入の実装スキル（Claude Code用）

## デザイナーさん向け

`app/globals.css` に Primitive / Semantic の2層でデザイントークンを定義している（`--color-blue-500` → `--color-primary` のように、生の値を役割ベースの名前で参照する構成）。

Figma Variables 側の命名を `color/blue-500` → `--color-blue-500` のようにそのまま機械変換できる形にしておくと、書き出しの自動化が楽。

## 画面構成

| パス | 説明 |
|------|------|
| `/` | 投稿一覧（トップページ） |
| `/posts/[id]` | 投稿詳細 |
| `/posts/new` | 投稿作成 |
| `/login` | ログイン |
| `/register` | 新規登録 |
| `/admin` | 管理者ダッシュボード |
| `/admin/posts` | 投稿管理 |
| `/admin/users` | ユーザー管理 |

管理者画面は `role: ADMIN` のユーザーのみアクセス可能。

## API

Hono RPC により型安全なAPIクライアントを提供。

```ts
import { client } from '@/lib/hono/client'

const res = await client.api.posts.$get()
const { posts } = await res.json()
```

## Supabase接続

### 環境変数の取得場所

| 変数名 | 取得場所 |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクトトップページ → プロジェクト名の下に表示される URL → **Copy** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → **API Keys** → Publishable and Secret API Keys → **Publishable key** |
| `DATABASE_URL` | プロジェクトトップページ → **Connect** → **ORMs** → **Prisma** → `DATABASE_URL` |
| `DIRECT_URL` | プロジェクトトップページ → **Connect** → **ORMs** → **Prisma** → `DIRECT_URL` |

### 手順

1. 上記を参考に `.env.local` にキーを追加
2. `MOCK_MODE=true` を削除
3. `npx prisma migrate dev` でマイグレーション実行
4. `lib/supabase/server.ts` と `lib/supabase/client.ts` を実装

### メール確認を無効化する（社内ツール推奨）

デフォルトでは登録時に確認メールが送られ、実在するメアドが必要になる。
社内ツールではオフにしておくと架空のメアドでもそのままログインできる。

**Supabase ダッシュボード → Authentication → Sign In / Providers → "Confirm email" をオフ**

## TODO

- [ ] **RLS（Row Level Security）の設定**
  Supabase では全テーブルに RLS を有効化することを推奨。現状は Prisma の service role 経由でアクセスしているため動作するが、直接 Supabase クライアントからDBを触るケースが生じた場合に備えて設定しておく。
  - `User` テーブル: 自分のレコードのみ読み取り・更新可
  - `Post` テーブル: 全員読み取り可、作成者のみ更新・削除可
  - 設定場所: Supabase ダッシュボード → Table Editor → 各テーブル → **RLS**
