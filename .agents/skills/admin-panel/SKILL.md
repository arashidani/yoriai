---
name: admin-panel
description: yoriaiの管理パネル実装ルール。admin画面、管理API、タグ、ひろば、招待、ユーザー管理、AIフラグを変更するときに使う。
paths:
  - "app/(admin)/**/*.tsx"
  - "components/admin/**/*.{ts,tsx}"
  - "lib/hono/routes/admin.ts"
  - "lib/schemas/tag.ts"
  - "lib/ai/assign-tags.ts"
---

# Admin Panel Skill — yoriai

backend/frontend skillsの上に適用する、現在の管理画面固有ルール。

## 構成と認可

- 管理ページは `app/(admin)/admin/`、対話UIは `components/admin/` に置く。
- 管理APIは `lib/hono/routes/admin.ts` の `adminRoute` に集約し、既存の `authMiddleware` と `adminGuard` を使う。
- `ADMIN` は一般ユーザー画面にも入れる。`ADMIN`を`/admin`以外から締め出さない。
- 管理ページの一覧は最新データが必要なら `export const dynamic = 'force-dynamic'` を付ける。
- 管理APIも必ずMOCK_MODE分岐、OpenAPI route定義、共有Zod request schemaを持つ。

## クライアントデータ更新

- 同じ画面内でCRUD結果を反映する一覧はTanStack Queryを使う。
- Hono RPC client以外でAPIを呼ばない。
- mutation成功後は対応するquery keyをinvalidateする。
- StorybookではStoryごとに新しいQueryClientをProviderへ渡す。

## タグマスタ

`Tag`はQAとひろばで共有する。管理者だけが作成・編集・削除でき、ユーザーは直接割り当てない。

- `name`: グローバルに一意。
- `category`: 必須。`TagCategory`マスタから選択し、自由入力させない。同じ投稿へ同じカテゴリーのタグは最大1件。
- `description`: 任意。管理画面とAIプロンプトだけで使用し、公開API、QA、ひろばのRSC payloadへ渡さない。
- `isWorkTag`: 新規作成時のデフォルトはfalse。trueだけQAで候補・表示可能。ひろばはtrue/false両方を使える。

公開タグは `lib/prisma/selects.ts` の `publicTagSelect`（id/name/createdAt）のみを取得する。管理APIは `AdminTagSchema` を使う。PrismaのTagをそのままspreadして公開レスポンスへ入れない。

`isWorkTag`をtrueからfalseへ変更するときは、既存QAの`PostTag`を同じtransactionで削除する。ひろばの`HirobaPostTag`は維持する。カテゴリー変更で既存投稿に同カテゴリーが2件になる場合は409で拒否する。

`Tag.category`は`TagCategory.name`への外部キー。タグフォームは`GET /api/admin/tag-categories`の結果を単一選択ドロップダウンにする。カテゴリーは`/admin/tag-categories`で作成・削除し、タグで使用中のカテゴリー削除はDBの外部キー制約で拒否して409を返す。カテゴリーのリネーム・並び替えは要求されるまで追加しない。

## AIタグ割り当て

`lib/ai/assign-tags.ts`へ集約する。

- Geminiには候補のname/category/descriptionを渡し、名前で回答させる。
- QAは `isWorkTag = true` の候補だけ渡す。ひろばは全候補を渡す。
- AI出力を信用せず、登録名との完全一致、重複除去、カテゴリーごとに最大1件、全体最大3件をコードで再検証する。
- 候補0件、API失敗、不正JSONは空配列へ安全に倒し、投稿作成自体は失敗させない。
- モデレーションで非表示になった投稿にはタグAIを呼ばない。

## 現在の管理リソース

ユーザー、招待、パスワードリセット、匿名プロフィール、バッジ、ミッション、AIフラグ、タグ、タグカテゴリー、ひろばを管理する。既存のroute/schema/mock/Storyパターンを再利用し、未実装のゲーミフィケーションや検知エンジンを管理CRUD変更から勝手に追加しない。

AIによって非表示になったQ&A投稿・回答は一般向けAPIの取得対象外のまま、管理者だけが `/admin/posts/[id]` と `GET /api/admin/posts/{id}` で本文を確認する。AIフラグ一覧の「該当の投稿を見る」「該当の回答を見る」はこの管理者画面へ遷移する。公開の `/posts/[id]` に非表示内容を出さない。

## 検証

- request schemaと純粋な分類ルールはunit testを書く。
- 管理UIはDefault/Empty/validation/editなど必要なStoryを更新する。
- API変更後は `npm run openapi:generate` を実行する。
- `npm run test:unit`、対象Story、`npm run check`、`npx tsc --noEmit`、`npm run build`を実行する。
