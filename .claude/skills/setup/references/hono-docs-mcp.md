# hono-docs-mcp 導入手順書

Hono公式ドキュメントを検索・取得できるリモートMCPサーバー([yusukebe/hono-docs-mcp](https://github.com/yusukebe/hono-docs-mcp))を Claude Code に導入する手順。

このプロジェクトは Hono（`hono` / `@hono/zod-validator`）を API 層に使っているため、Hono の実装を進める際にドキュメントを直接参照できるようにするのが目的。

---

## 1. 前提

- サーバーはリモートホスト版（`https://hono-docs-mcp.yusukebe.workers.dev/mcp`）を利用する。ローカルで動かす必要はない。
- 提供されるツール:
  - `search` — Hono ドキュメントを Algolia 経由で検索（クエリ文字列、任意で件数上限 1〜20）
  - `docs` — パス指定でドキュメントを Markdown 取得。パス省略時は `llms.txt` を返す

## 2. 導入コマンド

プロジェクトスコープ（`.mcp.json` に保存、リポジトリにコミットされチームで共有）で追加する。

```bash
claude mcp add --transport http --scope project hono-docs https://hono-docs-mcp.yusukebe.workers.dev/mcp
```

実行結果として `.mcp.json` が以下のように生成/更新される。

```json
{
  "mcpServers": {
    "hono-docs": {
      "type": "http",
      "url": "https://hono-docs-mcp.yusukebe.workers.dev/mcp"
    }
  }
}
```

## 3. 承認

リモートMCPサーバーは初回利用時に承認が必要。`claude` を起動し、`hono-docs` サーバーの利用を承認する（`/mcp` コマンドでも状態確認・承認が可能）。

```bash
claude mcp list
# hono-docs: https://hono-docs-mcp.yusukebe.workers.dev/mcp (HTTP) - ⏸ Pending approval (run `claude` to approve)
```

## 4. 動作確認

Claude Code のセッション内で、Hono に関する質問（例:「Hono の RPC (`hc`) の使い方を教えて」）をして、`hono-docs` の `search` / `docs` ツールが呼ばれることを確認する。

## 5. 削除する場合

```bash
claude mcp remove hono-docs --scope project
```
