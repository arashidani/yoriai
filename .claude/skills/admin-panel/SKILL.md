---
name: admin-panel
description: yoriai の管理パネル実装スキル。/admin/* 配下のページ・招待リンク方式のユーザー作成・パスワードリセット・proxy.tsによる権限分離のルールをまとめる。app/(admin)/, components/admin/, lib/hono/routes/{admin,invites,password-resets,users}.ts, lib/schemas/{invite,password-reset,badge,mission,user}.ts, proxy.ts, app/(auth)/{register,reset-password}/ 配下の実装時に使う。
paths:
  - "app/(admin)/**/*.tsx"
  - "components/admin/**/*.tsx"
  - "components/admin/**/*.ts"
  - "lib/hono/routes/admin.ts"
  - "lib/hono/routes/invites.ts"
  - "lib/hono/routes/password-resets.ts"
  - "lib/hono/routes/users.ts"
  - "lib/schemas/invite.ts"
  - "lib/schemas/password-reset.ts"
  - "lib/schemas/badge.ts"
  - "lib/schemas/mission.ts"
  - "lib/schemas/user.ts"
  - "proxy.ts"
  - "app/(auth)/register/page.tsx"
  - "app/(auth)/reset-password/page.tsx"
---

# Admin Panel Skill (yoriai)

管理パネル（`/admin/*`）とそれに付随する認証まわり（招待制登録・パスワードリセット・権限分離）の実装ルール。[backend](../backend/SKILL.md)・[frontend](../frontend/SKILL.md) スキルの上に乗る形で、管理パネル固有のパターンだけをまとめる。

---

## 1. 全体像

```
app/(admin)/admin/
├── page.tsx              → /admin/dashboard へリダイレクトするだけ
├── dashboard/page.tsx     → 実データ集計（ユーザー数・投稿数・未確認フラグ数・管理者数・週間投稿数・最近のアクティビティ）
├── users/page.tsx         → UserTable（実データ）
├── users/create/page.tsx  → 招待リンク発行 + 保留中招待の一覧（ポップアップ方式）
├── badge/page.tsx, badge/create/page.tsx
├── mission/page.tsx, mission/create/page.tsx
└── ai-flags/page.tsx      → AiFlagList（確認済みにするボタン付き）
```

Prisma モデル: `User` `Post` `Badge` `Mission` `AiFlag` `Invite` `PasswordReset`。`Badge`/`Mission`/`AiFlag` は管理パネル専用の実データモデルで、実際に付与・参加・検知する仕組み（ゲーミフィケーション/AI検知エンジン）はまだ存在しない。**admin側のCRUDだけを実装する範囲**であり、参加者集計やAI検知ロジックを勝手に作り込まない（YAGNI）。

---

## 2. 権限分離ルール（`proxy.ts`）

**ルール: `ADMIN` は一般ユーザー向けページ（`/` 以下）も含めて全ページを閲覧でき、加えて `/admin/*` にもアクセスできる（`ADMIN` ⊇ `USER` の包含関係）。一般ユーザー（`USER`）だけが `/admin/*` に入れない。**

`proxy.ts` の判定順序（`user.app_metadata.role` を見る。Hono側の `authMiddleware` は Prisma の `User.role` を見ており、参照元が違う点に注意——両方を同じ値に保つのは admin 作成経路の責務）:

1. 未認証 → `/login`・`/register`・`/reset-password`・`/api/*` 以外は `/login` へリダイレクト
2. 認証済みで `/login`・`/register`・`/reset-password` にアクセス → 自分のロールに応じたホーム（`ADMIN` なら `/admin`、それ以外は `/`）へリダイレクト。**ログイン直後のホームだけの話であり、以降の遷移を制限するものではない。**
3. `/admin` 配下 && ロールが `ADMIN` でない → `/` へリダイレクト

`ADMIN` を `/admin` 以外のページから締め出すリダイレクトはかつて存在したが廃止済み（「管理者は`/admin`専用ロールではなく、`/admin`にも入れる一般ユーザー」という方針転換のため）。新しく制限を足すときはこの包含関係を崩さないこと。

**新しく未認証アクセス可能なページを追加したら、`publicPaths` 配列に必ず追加する。** 忘れると全ユーザーが `/login` に弾かれる。

---

## 3. 招待制ユーザー作成（自己登録は廃止）

**ルール: `/register` は直接アクセスできない。管理者が `/admin/users/create` で発行した招待リンク経由でのみ到達可能。**

### なぜこの設計か
- 当初は管理者がメール・パスワードを直接設定する方式だったが、「管理者がユーザーのパスワードを知る」設計は避けるべきという判断で招待リンク方式に変更した。
- 招待は **DB持続型（`Invite` テーブル）** を選択（ステートレス署名トークンではない）。理由: 一覧表示・失効管理・使用済み判定を素直に実装できるため。
- 招待の `name` は「仮名・プレースホルダー」であり、実際のユーザー名ではない。**招待発行時に email は集めない** — 実際の email は登録者本人が `/register` で入力する。これは意図的な設計（管理者は招待相手のメールを事前に知らなくてよい）。

### データフロー
```
管理者: /admin/users/create
  → CreateInviteDialog（name・role のみ入力）
  → POST /api/admin/invites → Invite行作成（token・expiresAt 7日）
  → 発行直後にのみリンクをその場表示（一覧では token を再表示しない）

招待された人: /register?token=...
  → GET /api/invites/:token で有効性確認（未使用・期限内）。無効なら登録フォームを出さずエラー画面のみ表示
  → 有効なら name（招待のnameを初期値、編集可）・email・password を本人が入力
  → supabase.auth.signUp（クライアント側、anon keyのみで完結。service role key 不要）
  → POST /api/users { name, inviteToken } → 招待を検証・usedAt をマーク・Prisma User作成（roleは招待から）
```

`GET /api/admin/invites`（管理者専用一覧）はステータスをサーバー側で計算して返す（`PENDING` / `USED` / `EXPIRED`）。フロントで日付比較をしない。

---

## 4. 管理者によるパスワードリセット

**ルール: 管理者は `/admin/users` の各行から一回限りのパスワードリセットリンクを発行できる。ユーザー本人がそのリンクを開いて新パスワードを設定する。**

招待と同じ「DB持続トークン + ワンタイム」パターンだが、招待と違って **Supabase セッションを経由しない**：

```
POST /api/admin/users/{id}/password-resets（管理者専用）
  → PasswordReset行作成（token・userId・expiresAt 24時間）
  → リンクをその場表示（PasswordResetButton内のDialog）

ユーザー: /reset-password?token=...
  → GET /api/password-resets/:token で有効性確認
  → 有効なら新パスワード（+確認）を入力
  → POST /api/password-resets/:token { password }
    → token検証 → 対象Userを取得 → supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {password})
    → usedAt をマーク
```

**ここが招待フローと違う唯一の理由**: 既存ユーザーのパスワードを変更するには、そのユーザーとしてログインしていなくても Supabase Admin API (`SUPABASE_SERVICE_ROLE_KEY`) で直接更新できる。ユーザー自身のセッションは不要。招待（新規作成）は `signUp` が anon keyで完結するので service role key が不要——**この非対称性を壊さないこと**（無意味に片方をもう片方の実装に寄せない）。

### 有効期限の使い分け
- 招待リンク: 7日間（`INVITE_TTL_MS`, `lib/hono/routes/admin.ts`）
- パスワードリセット: 24時間（`PASSWORD_RESET_TTL_MS`, 同ファイル）

新しいワンタイムリンク機能を足すときも「何に使うか」に応じて妥当な期限を都度決める。使い回さない。

---

## 5. admin.ts ルート追加パターン

このリポジトリの管理系リソース（Badge/Mission/AiFlag/Invite/PasswordReset発行）はすべて `lib/hono/routes/admin.ts` の `adminRoute`（`authMiddleware` + `adminGuard` 適用済み）に集約されている。新しい管理者専用リソースを足すときは、既存の badge/mission ルートをそのままコピーして名前を変えるのが最速:

1. `prisma/schema.prisma` にモデル追加 → `npx prisma migrate dev --name <name>` → `npx prisma generate`
2. `lib/mocks/fixtures.ts` に `MOCK_<NAME>S` を追加（配列、Dateはnew Date()で直書き）
3. `lib/hono/openapi/schemas.ts` にレスポンス用スキーマ追加
4. `lib/schemas/<name>.ts` にリクエスト用スキーマ（フロントと共有）
5. `admin.ts`: `createRoute` でエンドポイント定義 → `.openapi(route, handler)` でMOCK_MODE分岐→Prisma分岐
6. `.storybook/msw-handlers.ts` にモックハンドラー追加、`.storybook/preview.tsx` の配列に追加し忘れない
7. ページ側は Server Component で直接 `prisma.<model>.findMany` を呼ぶ（一覧表示のみなら Hono 経由にしない。ミューテーションが要るページだけ Client Component + `client.api...` を使う）

---

## 6. Geminiによる投稿モデレーション → AiFlag

**ルール: 新規投稿作成時（`POST /api/posts`、`lib/hono/routes/posts.ts` の `createPostRoute`）に、Gemini（`@google/genai`, `gemini-flash-latest`, 無料枠）でタイトル・本文を判定し、脅迫・ハラスメント等の職場で許容されない内容が疑われる場合のみ `AiFlag` を自動作成する。** 判定ロジックは `lib/ai/moderate-post.ts` の `moderatePost()` に集約。

- モデル文字列は日付固定の `gemini-2.5-flash` ではなく `gemini-flash-latest`（Googleが常時最新の推奨flashモデルを指すよう管理するエイリアス）を使う。Geminiは個別モデルの廃止サイクルが早く、固定モデル名は数ヶ月で404 (`... is no longer available to new users`) になりうる——地雷を踏んで判明した。

- `AiFlag` に `postId`（`Post` への任意リレーション、`onDelete: Cascade`）を追加済み。投稿を削除すると紐づくフラグも自動的に消える。
- Gemini呼び出しは `moderatePost()` 内で `try/catch` されており、失敗（APIキー未設定・レート制限・`API_KEY_SERVICE_BLOCKED` 等）しても投稿作成自体は失敗しない（`null` を返すだけ）。
- `MOCK_MODE === 'true'` のときは Prisma 呼び出し前に早期returnするため、Gemini は一切呼ばれない（既存の MOCK_MODE パターンをそのまま踏襲）。
- 必要な環境変数: `GEMINI_API_KEY`（サーバー専用、`requireEnv()` 経由）。取得は https://aistudio.google.com/apikey 。無料枠あり。
- **地雷**: Google Cloud Console でAPIキーの制限をかける場合、選択すべきAPIは「Generative Language API」（AI Studioキー用）であり、「Gemini API」（Vertex AI用、サービスアカウント認証が必要）ではない。プロジェクトで有効化していないと制限リストに出てこない。それでも `API_KEY_SERVICE_BLOCKED` が出る場合は https://aistudio.google.com/apikey で新規キーを発行するのが最速（正しいAPIが自動で有効化された状態のプロジェクトが作られる）。
- admin ai-flags 一覧（`components/admin/ai-flag-list.tsx`）は `flag.post` があれば投稿へのリンクと `DeletePostButton`（`components/posts/delete-post-button.tsx`）を表示する。投稿削除に成功すると `postId` カスケードでサーバー側のフラグ行も消えるため、フロントは楽観的にローカルの `flags` state から該当フラグを取り除くだけでよい。

## 6.5 投稿削除（管理者専用アイコン）

**ルール: `ADMIN` は投稿カード右下のゴミ箱アイコンから任意の投稿を削除できる。バックエンドは既存の `DELETE /api/posts/{id}`（`postsRoute`, 管理者専用）を使う。**

- `components/posts/post-card.tsx` は `isAdmin` / `onDeleted` を受け取ったときだけ `DeletePostButton` を絶対配置で表示する（`Card` を包む `Link` の外側の `relative` な `div` に重ねる形。ボタン自身の `onClick` で `preventDefault`/`stopPropagation` して `Link` の遷移を止める）。
- 一覧の状態管理は `components/posts/post-list.tsx`（Client Component）に集約し、削除成功時にローカル配列から取り除く（`ai-flag-list.tsx` の楽観的更新パターンと同じ考え方）。
- `admin` は `/admin` 専用ロールではなく一般ページも閲覧できる（§2 参照）ため、この削除アイコンは通常の `/`（`app/(user)/page.tsx`）でも表示される。

## 7. このセッションで踏んだ地雷（再発防止）

- **`process.env.MOCK_MODE === 'true'` の分岐は本番ビルド時に静的評価される。** Server Component が `cookies()` を呼ぶ関数（例: `getCurrentUser()`）を、その関数内で `MOCK_MODE` 分岐より後に呼んでいると、ビルド時 `MOCK_MODE=true` だと dead-code除去されて該当ページが「静的」と誤判定されることがある。管理者ページのように毎回最新データを出したいページには `export const dynamic = 'force-dynamic'` を明示する（本セッションでは dashboard/badge/mission/ai-flags に付与）。ビルド後の `Route (app)` 表に `○`(static) と出たら疑う。
- **Hono RPCクライアントでダッシュ入りパスセグメントやネストしたパラメータは bracket記法。** 例: `client.api.admin['ai-flags'][':id'].$patch(...)`、`client.api.admin.users[':id']['password-resets'].$post(...)`。
- **`scripts/*.ts` を `tsx` で直接実行すると `.env.local` は自動で読み込まれない。** Next.js内部やPrisma CLIは自前でdotenvを読むが、単体スクリプトは `npx tsx -r dotenv/config scripts/foo.ts ... dotenv_config_path=.env.local` のように明示的にpreloadする。
- **`useSearchParams()` を使うクライアントページは `<Suspense>` で包む。**（`/register`・`/reset-password` 参照）
- **`SUPABASE_SERVICE_ROLE_KEY` は `.env.local` にのみ存在し、絶対に読み書き・grep・出力しない**（`AGENTS.md` の機密ファイルルール）。値の有無だけ確認したいときは `!!process.env.SUPABASE_SERVICE_ROLE_KEY` のような真偽値チェックに留める。
- **`authMiddleware`（Hono, Prisma `User.role` 参照）と `proxy.ts`（Supabase `user.app_metadata.role` 参照）はロールの参照元が別。** 管理者アカウントを作るときは両方を一致させる責務がどこにあるか（`scripts/add_admin_usr.ts` は両方セットしている）を確認する。ズレると「APIは通るのに画面には入れない/その逆」が起きる。
