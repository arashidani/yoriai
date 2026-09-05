# YORIAI（よりあい）

![Next.js](https://img.shields.io/badge/Next.js-16.2.11-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)
![Hono](https://img.shields.io/badge/Hono-4.13.0-orange?logo=hono)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.110.0-3ecf8e?logo=supabase)
![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2d3748?logo=prisma)
![Storybook](https://img.shields.io/badge/Storybook-10.5.5-ff4785?logo=storybook)
![Zustand](https://img.shields.io/badge/Zustand-5.0.14-brown?logo=zustand)
![Zod](https://img.shields.io/badge/Zod-4.4.3-3068b7?logo=zod)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.101.2-ff4154?logo=reactquery)

株式会社IBJ向けの社内交流・質問共有プラットフォーム。運営は「れあかつ」（IBJ 2026年度ハッカソンAチーム）。

**コンセプト:** 会社の「はじめまして」をもっと身近にする、社内特化型コミュニケーションプラットフォーム。  
**テーマ:** 「IT×おせっかい」— 自らアクションを起こすのが苦手な社員に対し、システム（AI）がおせっかいを焼き、部署の壁を越えたコミュニケーションを自然に生み出す。

## 機能概要

| 機能 | パス | 説明 |
|------|------|------|
| なんでもQ&A | `/` | 社内の疑問を投稿・閲覧・回答する知恵袋（質問は匿名可） |
| ひろば | `/hiroba` | 趣味やMBTIなどでつながるコミュニティ（実名表示） |
| マイページ | `/mypage` | プロフィールの確認・編集 |
| 投稿・保存した質問 | `/my-questions` | 自分の質問と保存した質問の一覧 |
| 通知 | サイドバー | 回答・いいね・メンションなどの通知 |
| よりあいぬの小屋 | 画面右下 | AIチャット（Dify Chatflow） |
| 管理パネル | `/admin/*` | ユーザー・タグ・ひろばなどの運営管理（ADMIN のみ） |

### AIのおせっかい

- **タグ自動付与:** 質問投稿時に Gemini が内容からタグを提案する
- **回答おすすめ:** ユーザーのビジネススキルと質問内容をマッチングし、「あなたが回答できる質問」をトップページ右側に表示する
- **投稿モデレーション:** Gemini による投稿内容のチェック
- **よりあいぬの小屋:** Dify Chatflow による社内向け AI チャット

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **API**: Hono (Route Handler) + Hono RPC + OpenAPI (Swagger UI)
- **DB**: Supabase (PostgreSQL) + Prisma 7
- **認証**: Supabase Auth（招待リンク方式のユーザー登録）
- **UI**: Tailwind CSS 4 + shadcn/ui + デザインシステムコンポーネント
- **状態管理**: Zustand
- **サーバー状態管理**: TanStack Query
- **バリデーション**: Zod + react-hook-form
- **AI**: Google Gemini（タグ付与・モデレーション）、Dify（チャット）
- **コンポーネント開発**: Storybook 10 + MSW + Vitest
- **Lint / Format**: Biome + lefthook + lint-staged

## ディレクトリ構成

```
yoriai/
├── app/
│   ├── (admin)/                  # 管理者向け画面（ADMIN ロールのみ）
│   │   └── admin/
│   │       ├── dashboard/        # ダッシュボード
│   │       ├── users/            # ユーザー管理・作成
│   │       ├── tags/             # タグ管理
│   │       ├── tag-categories/   # タグカテゴリー管理
│   │       ├── profile-options/  # プロフィール項目管理
│   │       ├── anonymous-profiles/ # 匿名キャラ管理
│   │       ├── ai-flags/         # AIフラグ管理
│   │       └── hiroba/           # ひろば一覧
│   ├── (auth)/                   # ログイン・登録・パスワードリセット
│   ├── (onboarding)/             # 初回オンボーディング
│   ├── (user)/                   # 一般ユーザー向け画面
│   │   ├── page.tsx              # なんでもQ&A トップ (/)
│   │   ├── posts/[id]/           # 質問詳細
│   │   ├── hiroba/               # ひろば一覧・詳細・投稿
│   │   ├── mypage/               # マイページ・よりあいぬプロフィール
│   │   └── my-questions/         # 自分の質問・保存した質問
│   ├── api/[[...route]]/         # Hono を Next.js Route Handler にマウント
│   ├── generated/prisma/         # `npx prisma generate` で自動生成
│   └── globals.css               # デザイントークン定義
├── components/
│   ├── design-system/            # デザインシステムコンポーネント
│   ├── posts/                    # Q&A 関連
│   ├── hiroba/                   # ひろば関連
│   ├── mypage/                   # マイページ関連
│   ├── admin/                    # 管理パネル
│   ├── layout/                   # サイドバー・AIチャットウィジェット
│   └── ui/                       # shadcn/ui コンポーネント
├── lib/
│   ├── hono/
│   │   ├── app.ts                # Hono アプリ定義・AppType export
│   │   ├── client.ts             # Hono RPC クライアント
│   │   ├── middleware/auth.ts    # 認証ミドルウェア（MOCK_MODE 対応）
│   │   ├── openapi/              # OpenAPI スキーマ定義
│   │   └── routes/               # API ルート（questions, hiroba, chat など）
│   ├── ai/                       # Gemini（タグ付与・モデレーション）
│   ├── dify/                     # Dify Chatflow クライアント
│   ├── hiroba/                   # ひろばカタログ・レコード補完
│   ├── questions/                # Q&A ドメインロジック
│   ├── schemas/                  # Zod スキーマ（フロント・バック共有）
│   ├── stores/                   # Zustand ストア
│   ├── mocks/fixtures.ts         # ローカル開発用モックデータ
│   ├── prisma/                   # Prisma クライアント
│   └── supabase/                 # Supabase クライアント・Storage
├── prisma/
│   ├── schema.prisma             # DB スキーマ
│   └── migrations/
├── specs/                        # プロダクト仕様・会社公開情報（Dify ナレッジ用）
├── tests/                        # Vitest ユニットテスト
├── docs/api/                     # API 設計・フロント連携ガイド
├── .agents/skills/               # エージェント用実装スキル
├── .storybook/                   # Storybook 設定・MSW ハンドラ
├── proxy.ts                      # 認証・ロールチェック（Next.js 16）
└── public/
    └── mockServiceWorker.js      # MSW サービスワーカー
```

## セットアップ

```bash
npm install
```

`npm install` 実行後、[lefthook](https://github.com/evilmartians/lefthook) による Git hooks が自動的に有効化される（`postinstall` で `prisma generate`・`next typegen`・`lefthook install` を実行）。以降、コミット時に差分ファイルへ Biome のフォーマット・Lint が自動実行される。

`.env.local` を作成:

```env
# ローカル開発（DB・認証不要）
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true

# Q&A 画面だけ認証なしで確認したい場合（/, /posts/*, /my-questions）
# MOCK_AUTH_BYPASS=true

# Supabase 接続時に追加（MOCK_MODE / NEXT_PUBLIC_MOCK_MODE は削除する）
# DATABASE_URL=postgresql://...
# DIRECT_URL=postgresql://...

# 1 インスタンスあたりの接続プール上限。未設定なら 3（「接続プールと接続先」を参照）
# DATABASE_POOL_MAX=3
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Gemini（タグ自動付与・投稿モデレーション）。サーバー専用
# GEMINI_API_KEY=xxx

# Dify Chatflow（よりあいぬの小屋）。サーバー専用
# DIFY_API_BASE_URL=https://your-dify-host/v1
# DIFY_API_KEY=app-xxxxxxxxxxxx
```

**MOCK_MODE の使い分け:** Server Component / Hono routes は `MOCK_MODE`、Client Component は `NEXT_PUBLIC_MOCK_MODE` を参照する。

## 開発

```bash
# アプリ起動
npm run dev

# Storybook 起動
npm run storybook

# ユニットテスト
npm run test:unit
```

## Lint・Format

[Biome](https://biomejs.dev/) で Lint・フォーマットを統一管理している。

```bash
# Lint チェック
npm run lint

# フォーマット適用
npm run format

# Lint + フォーマットをまとめて実行
npm run check
```

コミット時は [lefthook](https://github.com/evilmartians/lefthook) + [lint-staged](https://github.com/okonet/lint-staged) により、ステージ済みファイルに対して自動で Biome のフォーマット・Lint が実行される（Lint エラー時はコミットが中断される）。`push` 時には型チェック（`tsc --noEmit`）が実行される。

## ドキュメント

- [specs/yoriai.md](./specs/yoriai.md) — プロダクト概要
- [specs/yoriai-qa.md](./specs/yoriai-qa.md) — なんでもQ&A
- [specs/yoriai-hiroba.md](./specs/yoriai-hiroba.md) — ひろば
- [specs/yoriainu.md](./specs/yoriainu.md) — よりあいぬ・小屋・おせわに
- [specs/reakatsu.md](./specs/reakatsu.md) — 運営チーム「れあかつ」
- [specs/ibj/](./specs/ibj/) — IBJ の公開情報（`_sources.md` は Dify に上げない）
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 構成図・データフロー
- [docs/api/](./docs/api/) — Q&A API 設計・フロント連携ガイド
- [.agents/skills/](./.agents/skills/) — フロントエンド / バックエンド / 管理パネル / セットアップの実装スキル

## デザイナーさん向け

`app/globals.css` に Primitive / Semantic の2層でデザイントークンを定義している（`--color-blue-500` → `--color-primary` のように、生の値を役割ベースの名前で参照する構成）。

Figma Variables 側の命名を `color/blue-500` → `--color-blue-500` のようにそのまま機械変換できる形にしておくと、書き出しの自動化が楽。

## 画面構成

### 一般ユーザー

| パス | 説明 |
|------|------|
| `/` | なんでもQ&A（質問一覧） |
| `/posts/[id]` | 質問詳細 |
| `/my-questions` | 自分の質問・保存した質問 |
| `/hiroba` | ひろば一覧 |
| `/hiroba/[slug]` | ひろば詳細 |
| `/hiroba/[slug]/posts/[postId]` | ひろば投稿詳細 |
| `/mypage` | マイページ |
| `/mypage/[userId]` | 他ユーザーのプロフィール |
| `/mypage/yoriainu` | よりあいぬの公式プロフィール |
| `/onboarding` | 初回オンボーディング |

### 認証

| パス | 説明 |
|------|------|
| `/login` | ログイン |
| `/register` | 招待リンク経由の新規登録 |
| `/register/confirm` | メール確認 |
| `/register/complete` | 登録完了 |
| `/reset-password` | パスワードリセット |

### 管理パネル（`role: ADMIN` のみ）

| パス | 説明 |
|------|------|
| `/admin` | 管理パネルトップ（ダッシュボードへリダイレクト） |
| `/admin/dashboard` | ダッシュボード |
| `/admin/users` | ユーザー管理 |
| `/admin/users/create` | ユーザー作成（招待リンク発行） |
| `/admin/tags` | タグ管理 |
| `/admin/tag-categories` | タグカテゴリー管理 |
| `/admin/profile-options` | プロフィール項目管理 |
| `/admin/anonymous-profiles` | 匿名キャラ管理 |
| `/admin/ai-flags` | AIフラグ管理 |
| `/admin/hiroba` | ひろば一覧 |

## API

Hono RPC により型安全な API クライアントを提供。

```ts
import { client } from '@/lib/hono/client'

const res = await client.api.questions.$get()
const { questions } = await res.json()
```

主なエンドポイント:

| パス | 説明 |
|------|------|
| `/api/questions` | なんでもQ&A（質問 CRUD・いいね・保存） |
| `/api/answers` | 回答 |
| `/api/hiroba` | ひろば（参加・一覧） |
| `/api/hiroba-posts` | ひろば投稿 |
| `/api/hiroba-answers` | ひろばコメント |
| `/api/chat` | よりあいぬの小屋（Dify） |
| `/api/notifications` | 通知 |
| `/api/onboarding` | オンボーディング |
| `/api/users` | ユーザー・プロフィール |
| `/api/admin` | 管理 API |

### OpenAPI（Swagger UI）

起動後、ブラウザで以下にアクセスすると API 仕様を確認できる。

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

静的 HTML の生成:

```bash
npm run openapi:generate
```

## Supabase 接続

### 環境変数の取得場所

| 変数名 | 取得場所 |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクトトップページ → プロジェクト名の下に表示される URL → **Copy** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → **API Keys** → Publishable and Secret API Keys → **Publishable key** |
| `DATABASE_URL` | プロジェクトトップページ → **Connect** → **ORMs** → **Prisma** → `DATABASE_URL` |
| `DIRECT_URL` | プロジェクトトップページ → **Connect** → **ORMs** → **Prisma** → `DIRECT_URL` |

### 手順

1. 上記を参考に `.env.local` にキーを追加
2. `MOCK_MODE=true` と `NEXT_PUBLIC_MOCK_MODE=true` を削除
3. `npx prisma migrate dev` でマイグレーション実行

### 接続プールと接続先

`DATABASE_URL` は Supavisor の transaction pooler（`*.pooler.supabase.com:6543`）を指す。マイグレーション用の `DIRECT_URL` だけが直接接続（`db.*.supabase.co:5432`）でよい。Connect → ORMs → Prisma からコピーすればこの組み合わせになるが、取得時期によっては `DATABASE_URL` 側も 5432 になっていることがある。本番で直接接続を指している場合は、サーバー起動時に `[prisma] DATABASE_URL が Supabase の直接接続 ...` という警告がログに出る。

`@prisma/adapter-pg` は `statementNameGenerator` を渡さない限り名前付き prepared statement を作らないため、transaction mode の pooler でもそのまま動く。`pgbouncer=true` のようなクエリパラメータは不要。

プール上限は `lib/prisma/pool-config.ts` で明示している。デフォルトは 1 インスタンスあたり 3 本。

- サーバーレス関数はインスタンスごとに独立したプールを持つので、DB への同時接続数は **同時に生きているインスタンス数 N × `max`** になる
- 直接接続の `max_connections` は Small インスタンスで 60 前後、うち数本は管理用に予約されている。実質 50 本として `3 × N ≦ 50` → N ≦ 16 インスタンスまで耐える
- transaction pooler のクライアント接続上限はこれより桁で大きいため、3 では当たらない
- 1 本にするとインスタンス内の並列リクエストが直列化し、Like / Bookmark のような短いクエリでも待ち行列ができる

プランや Compute サイズを変えたときは、Settings → Database の `max_connections` と上の式を突き合わせ、必要なら `DATABASE_POOL_MAX` で上書きする。

### メール確認を無効化する（社内ツール推奨）

デフォルトでは登録時に確認メールが送られ、実在するメアドが必要になる。社内ツールではオフにしておくと架空のメアドでもそのままログインできる。

**Supabase ダッシュボード → Authentication → Sign In / Providers → "Confirm email" をオフ**

## デプロイとマイグレーション

マイグレーションは**手動適用**（デプロイでは自動実行されない）。Vercel のビルドでも実行していないので、**手元から対象 DB に向けて流す**。

```bash
# .env.local の DIRECT_URL を対象環境のものにしてから実行する
npm run db:migrate   # prisma migrate deploy
```

`prisma.config.ts` は `.env.local` → `.env` の順に読み込み、datasource には `DIRECT_URL` を使う。`DATABASE_URL` だけでは流れない点に注意（`DIRECT_URL` の取得場所は「Supabase 接続」の項を参照）。

一時的に切り替えるだけなら環境変数を直接渡してもよい。

```bash
DIRECT_URL="postgresql://..." npx prisma migrate deploy
```

適用状況の確認:

```sql
-- finished_at が NULL のものは失敗して止まっているマイグレーション
select migration_name, finished_at, rolled_back_at from "_prisma_migrations" order by started_at desc limit 10;
```

### マイグレーションが失敗して止まっている場合

Prisma は1本失敗すると以降のマイグレーションを一切適用しない（`P3018`）。失敗した本文を冪等に直したうえで、失敗記録を rolled back 扱いにしてから再適用する。

```bash
npx prisma migrate resolve --rolled-back "<migration_name>"
npm run db:migrate
```

`resolve --rolled-back` は失敗記録の `rolled_back_at` を埋めるだけなので、CLI が使えない場合は Supabase の SQL Editor で同じことができる（ただし再適用の `migrate deploy` は CLI が必要）。

```sql
update "_prisma_migrations"
set rolled_back_at = now()
where migration_name = '<migration_name>'
  and finished_at is null
  and rolled_back_at is null;
```

なお、マイグレーションは1本がトランザクションになっているため、失敗したものは途中まで適用された状態にはならない。適用済みのマイグレーションファイルを冪等化する編集をしても、`migrate deploy` はチェックサム差分では失敗しない。

### ひろばのマスタデータについて

`Hiroba` テーブルの行はマイグレーションの `INSERT` で投入されるが、未適用でも詳細ページが404にならないよう、`lib/hiroba/record.ts` の `ensureHirobaBySlug()` が `lib/hiroba/catalog.ts` の定義から行を補完する。

そのため、**ひろばの追加はカタログに書けば動く**（`lib/hiroba/catalog.ts` が正）。マイグレーションの `INSERT` は初期投入用で、カタログとの対応は `tests/hiroba-catalog.test.ts` で固定している。

なお、これはマスタデータの補完のみ。**スキーマ変更のマイグレーションは従来どおり手動適用が必要**。

## TODO

- [ ] **RLS（Row Level Security）の設定**
  Supabase では全テーブルに RLS を有効化することを推奨。現状は Prisma の service role 経由でアクセスしているため動作するが、直接 Supabase クライアントから DB を触るケースが生じた場合に備えて設定しておく。
  - `User` テーブル: 自分のレコードのみ読み取り・更新可
  - `Post` テーブル: 全員読み取り可、作成者のみ更新・削除可
  - 設定場所: Supabase ダッシュボード → Table Editor → 各テーブル → **RLS**
