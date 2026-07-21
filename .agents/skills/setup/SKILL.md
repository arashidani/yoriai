---
name: setup
description: yoriai のプロジェクト構築・MCPサーバー導入スキル。ゼロからのプロジェクト再現手順、Codex用MCPサーバー(hono-docs, context7, next-devtools, shadcn)の導入コマンド、tsconfigパス設定をまとめる。新規環境構築や新しいMCPサーバー追加時に使う。
paths: ".mcp.json, package.json, prisma.config.ts, prisma/schema.prisma"
---

# Setup Skill — プロジェクト構築 & MCP (yoriai)

ゼロから同じ構成のプロジェクトを再現する手順は [references/project-setup.md](references/project-setup.md) を参照。

---

## Codex MCPサーバー

プロジェクトスコープ（`.mcp.json`、リポジトリにコミットしてチーム共有）で導入済みのMCPサーバー一覧。各サーバーの詳細手順・動作確認方法は references/ 配下を参照。

### hono-docs（[詳細](references/hono-docs-mcp.md)）
Hono公式ドキュメントの検索・取得。リモートHTTP。
```bash
Codex mcp add --transport http --scope project hono-docs https://hono-docs-mcp.yusukebe.workers.dev/mcp
```

### context7（[詳細](references/context7-mcp.md)）
最新ライブラリ・フレームワークのドキュメント/コード例を検索・取得。リモートHTTP。
```bash
Codex mcp add --transport http --scope project context7 https://mcp.context7.com/mcp
```

### next-devtools（[詳細](references/next-devtools-mcp.md)）
起動中のNext.js開発サーバー（`next dev`）のビルド/ランタイム/型エラーやルート情報を取得。ローカルstdio。`npm run dev` が起動している必要あり。
```bash
Codex mcp add --scope project next-devtools -- npx -y next-devtools-mcp@latest
```

### shadcn（[詳細](references/shadcn-mcp.md)）
shadcn/ui コンポーネントの検索・閲覧・追加コマンド取得。ローカルstdio。[frontend skill](../frontend/SKILL.md) でコンポーネントを追加するときは `npx shadcn@latest add` を直接叩かず、必ずこのMCP経由で行う。
```bash
Codex mcp add --scope project shadcn -- npx shadcn@latest mcp
```

### 共通の注意点
- いずれもリモート/ローカル問わず初回利用時に承認が必要（`Codex` 起動時 or `/mcp` で承認）
- `Codex mcp list` で登録状況・承認状況を確認できる
- 削除は `Codex mcp remove <name> --scope project`

---

## tsconfig パス設定

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

`@/` はプロジェクトルートからの絶対パス。`@/lib/prisma/client` = `lib/prisma/client.ts`。
