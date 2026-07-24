---
name: migration
description: yoriai の Prisma 7 マイグレーション手順スキル。schema.prisma 編集→migrate dev→generate の開発ループ、本番デプロイ(migrate deploy)、Supabase の pooled(DATABASE_URL)/direct(DIRECT_URL)接続の使い分け、shadow database、スキーマドリフト対応、本番SQLレビューをまとめる。prisma/schema.prisma・prisma/migrations/・prisma.config.ts を触るときに使う。
paths:
  - "prisma/**/*.prisma"
  - "prisma/migrations/**"
  - "prisma.config.ts"
---

# Migration Skill — Prisma 7 (yoriai)

より詳しい手順（本番ホットフィックス、既存DBのbaseline化）は [references/advanced.md](references/advanced.md) を参照。

## ドキュメント参照ルール

Prisma 7 は `prisma.config.ts` 導入など v5/v6 と挙動が大きく異なる（トレーニングデータの知識が古い可能性が高い）。マイグレーション周りで迷ったら必ず **Context7 で Prisma の最新ドキュメント**を確認すること。

---

## 1. このプロジェクトの構成

**ルール: マイグレーション用の接続とアプリ用の接続は別物。混同しない。**

```ts
// prisma.config.ts — CLI (migrate/db push/db execute) が使う接続
datasource: {
  url: process.env["DIRECT_URL"],   // Supabase の direct 接続 (5432)
}
```

```ts
// lib/prisma/client.ts — アプリ実行時に PrismaClient が使う接続
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })  // pooled (pgbouncer, 6543)
```

- `DIRECT_URL`: マイグレーション専用。5432番、pgbouncerを経由しない直接接続。
- `DATABASE_URL`: アプリのクエリ実行専用。6543番、pgbouncer(transaction mode)経由。
- **やってはいけない**: `DATABASE_URL`（pooled）に対して `migrate dev`/`migrate deploy` を実行する → pgbouncerのtransaction modeはPrismaが使うprepared statementに対応していないため失敗する。
- Prisma 7 では schema.prisma の `directUrl` フィールドは廃止されている。「direct/pooled の使い分け」は `prisma.config.ts`（CLI側）と `lib/prisma/client.ts` の adapter（アプリ側）で手動的に分担する形になった。

---

## 2. 日常の開発フロー

**ルール: スキーマ変更→migrate dev→generate は3ステップとも明示的に実行する。**

```bash
# 1. prisma/schema.prisma を編集

# 2. マイグレーション作成 + 適用（開発DBに対して）
npx prisma migrate dev --name <変更内容の説明>
# 例: npx prisma migrate dev --name add_comment_model

# 3. クライアント再生成
npx prisma generate
```

- Prisma 7 では `migrate dev` / `db push` が **`prisma generate` を自動実行しなくなった**（v6以前は自動だった）。generate を忘れると型がズレるので必ず明示的に叩く。
- 命名は `snake_case` でこれまでの変更を踏襲（例: `prisma/migrations/20260705051059_post_author_nullable_set_null/`）。
- `migrate dev` は内部で shadow database を使ってドリフト検知をする（開発時のみ。本番では使われない）。

---

## 3. コマンド早見表

| コマンド | 用途 | 使う場面 |
|---|---|---|
| `prisma migrate dev --name X` | マイグレーション作成+適用+ドリフト検知 | ローカル開発 |
| `prisma migrate dev --create-only --name X` | マイグレーションファイルだけ生成（未適用） | SQLを手で編集したいとき（§4） |
| `prisma migrate deploy` | 未適用のマイグレーションを適用のみ。プロンプトなし | 本番/CI |
| `prisma migrate status` | 適用状況・ドリフトを確認（読み取り専用） | デバッグ、CI事前チェック |
| `prisma migrate resolve --applied X` | 実行せずに「適用済み」としてマーク | 本番で手動SQL実行後の後始末、baseline化 |
| `prisma migrate resolve --rolled-back X` | 「未適用（ロールバック済み）」としてマーク | 失敗したマイグレーションの取り消し |
| `prisma migrate reset` | DB全体を作り直して全マイグレーション再適用 | ローカルの状態が壊れたとき |
| `prisma db seed` | シードスクリプト実行 | `reset`後や初期データ投入時。**v7では自動実行されないので必ず手動で呼ぶ** |
| `prisma db push` | マイグレーション履歴を作らずスキーマを直接反映 | プロトタイピングのみ。通常のスキーマ変更では使わない |
| `prisma migrate diff` | 2つのスキーマ/DB状態の差分（`--script`でSQL出力） | baseline化、手動SQL生成 |

---

## 4. 本番マイグレーションSQLのレビュー

**ルール: カラムのリネームなど破壊的な変更は `--create-only` でSQLを確認してから適用する。**

```bash
npx prisma migrate dev --create-only --name rename_body_to_content
# → prisma/migrations/xxx/migration.sql を手で編集
#   Prismaのデフォルトは DROP COLUMN + ADD COLUMN（データが消える）
#   ALTER TABLE ... RENAME COLUMN ... に書き換えてデータを保持する
npx prisma migrate dev   # 編集したSQLをそのまま適用
```

---

## 5. 本番での安全な変更（expand/contract パターン）

**ルール: 大きいテーブルのカラム削除・型変更は1回のデプロイで完結させず、拡張→バックフィル→縮小の3段階に分ける。**

1. **Expand**: 新カラムを nullable または default 付きで追加。アプリは新旧両方に書き込む（or 旧のみ）。
2. **Backfill**: 既存データを新カラムに移行（大きいテーブルはバッチ分割。1トランザクションで全件やらない）。
3. **Contract**: 読み込みを新カラムに切り替え、旧カラムへの依存がないことを確認してから、**別のマイグレーションで**旧カラムを削除。

理由: カラム削除・型変更は `ACCESS EXCLUSIVE` ロックを取ることがあり、1回でやるとリクエストタイムアウトを引き起こしうる。段階を分けることで各段階でロールバック可能にする。

---

## 6. CI/本番デプロイ

```bash
npm install
npx prisma generate      # v7では自動生成されないので明示
npx prisma migrate deploy
```

- `migrate deploy` は shadow database を使わず、プロンプトも出さない。`prisma/migrations/` にある未適用分をそのまま適用するだけ。
- 失敗したマイグレーションの復旧:
  - ロールバックしてやり直す: `prisma migrate resolve --rolled-back <name>` → SQL修正 → 再デプロイ
  - 手動でSQLを流した場合: `prisma migrate resolve --applied <name>` で「適用済み」としてマークし、二重適用を防ぐ

---

## 7. スキーマドリフト（開発時）

`migrate dev` はshadow DB上でマイグレーション履歴を再生し、実際の開発DBと食い違い（ドリフト）があると **リセットを促すプロンプト**を出す。原因の例:
- 誰かが適用済みのマイグレーションファイルを直接編集した
- `migrate`を経由せず直接SQLをDBに実行した

`prisma migrate status` で読み取り専用に状態確認できる（プロンプトは出ない）。

---

## 8. やってはいけないこと

- `migrate dev`/`migrate deploy` を `DATABASE_URL`（pooled）に対して実行する → `DIRECT_URL` を使う（`prisma.config.ts` が既にそう設定済み）
- マイグレーション作成・適用のあとに `prisma generate` を省略する → 型がズレる（v7では自動実行されない）
- カラムリネーム・破壊的変更を確認せず `migrate dev` で即適用する → `--create-only` でSQLを見てから適用する
- 大きいテーブルのカラム削除を1マイグレーションで完結させる → expand/contractで分割する（§5）
- ローカルで `migrate reset` した後にシードを忘れる → `prisma db seed` を明示的に実行する
- `prisma/migrations/` 配下の適用済みファイルを直接書き換える → ドリフトの原因になる。新しいマイグレーションを追加する
