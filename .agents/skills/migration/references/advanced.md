# Migration Advanced — baseline / hotfix / shadow DB (yoriai)

日常のマイグレーション手順は [../SKILL.md](../SKILL.md) を参照。ここでは頻度は低いが重要な手順をまとめる。

## Prisma 7 の設定まわりの変更点（v5/v6からの破壊的変更）

Web検索で確認した、v6以前の知識と食い違う可能性が高い変更点：

- `prisma.config.ts` が新設され、`datasource.url` / `shadowDatabaseUrl` / migrations path / seed コマンドの設定場所になった（v6以前は schema.prisma や CLI引数）。
- schema.prisma の `directUrl` フィールドは**廃止**。pooled/direct の使い分けは「`prisma.config.ts` の `url`（CLI用）」と「アプリコード内の adapter 初期化（実行時用）」に分かれた（[SKILL.md §1](../SKILL.md)参照）。
- `migrate dev` / `db push` は `prisma generate` を自動実行しなくなった。`migrate dev` / `migrate reset` は seed も自動実行しなくなった（`--skip-generate` / `--skip-seed` フラグ自体が廃止）。
- `migrate diff` の `--from-url` / `--to-url` / `--from-schema-datasource` / `--to-schema-datasource` は `--from-config-datasource` / `--to-config-datasource` に置き換え。
- CLIはNode環境で `.env` を自動読み込みしなくなった。`prisma.config.ts` 冒頭の `import { config } from "dotenv"; config()` が必須（このプロジェクトの `prisma.config.ts` に既に入っている）。

不確実な点として、`prisma migrate`/`db push` などCLIコマンドが `@prisma/adapter-pg` のようなdriver adapterを経由するのか、それとも常に `prisma.config.ts` の `url` で直接接続するのかは情報源間で完全には一致しなかった。有力なのは「CLIは常に`prisma.config.ts`の`url`で直接接続し、driver adapterはアプリの`PrismaClient`実行時にのみ関与する」という説（このプロジェクトの構成とも整合する）。ネットワーク経路の制約などで重要になる場合は、Prisma 7.8.0のリリースノートで再確認すること。

## Shadow Database（開発時のドリフト検知用）

- `migrate dev` が内部で使う一時DB。マイグレーション履歴を再生してスキーマの整合性・データロスの可能性を検知する。`migrate deploy`/`migrate resolve`/`migrate status` では使われない（本番は無関係）。
- Supabase のように「CLIがDBを勝手に作成・削除する権限がない」環境では、自動作成に失敗することがある。その場合は自分でシャドウ用DBを別途用意し、`prisma.config.ts` に設定する:

```ts
datasource: {
  url: env("DIRECT_URL"),
  shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
}
```

- **注意**: `shadowDatabaseUrl` を本番と同じDBに向けない。手動設定したシャドウDBは drop/recreate ではなく soft-reset される。

## 本番マイグレーション失敗時の復旧（ホットフィックス）

1. マイグレーションが途中で失敗した場合、まず原因のSQLを特定する。
2. **やり直す場合**: `npx prisma migrate resolve --rolled-back <migration名>` → SQLを修正 → `npx prisma migrate deploy` で再デプロイ。
3. **手動でSQLを流し込んで解決済みの場合**: 該当SQLを直接実行 → `npx prisma migrate resolve --applied <migration名>` で「適用済み」としてマークし、次回の `migrate deploy` が二重適用しないようにする。
4. ピンポイントな修正SQLが欲しい場合は `prisma migrate diff` で差分SQLを生成し、`prisma db execute` で流す（`_prisma_migrations` テーブルは変更されない点に注意）。

## 既存データベースのbaseline化

すでにマイグレーション管理外で存在するテーブル（例: 手動で作った初期スキーマ）をPrisma Migrate配下に取り込む手順。

1. 既存の `prisma/migrations/` があれば退避し、新規に作り直す。
2. `prisma/migrations/0_init/`（数字プレフィックスで最初に実行される順序を保証）を作成。
3. 現在のスキーマから baseline SQL を生成:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

4. 実行せずに「適用済み」としてマーク:

```bash
npx prisma migrate resolve --applied 0_init
```

5. 以降の `migrate deploy` はこのbaselineをスキップし、新規マイグレーションのみ適用する。
