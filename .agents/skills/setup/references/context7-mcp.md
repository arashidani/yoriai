# Context7 MCP 導入手順書

最新のライブラリ・フレームワークのドキュメント/コード例を検索・取得できるリモートMCPサーバー([Context7](https://context7.com) by Upstash)を Claude Code に導入する手順。

このプロジェクトは Next.js 16 / Prisma 7 など破壊的変更の多いバージョンを使っており、学習データが古い可能性があるライブラリの最新仕様を都度参照できるようにするのが目的。

---

## 1. 前提

- サーバーはリモートホスト版（`https://mcp.context7.com/mcp`）を利用する。ローカルで動かす必要はない（ローカル版が必要な場合は npm パッケージ `@upstash/context7-mcp` を stdio で起動する方法もある）。
- 提供される主なツール:
  - `resolve-library-id` — ライブラリ名から Context7 内部の library ID を解決
  - `get-library-docs` — library ID を指定してドキュメント/コード例を取得
- API キーなしでも利用可能。ただしレート制限が低いため、頻繁に使う場合は API キー登録（[context7.com](https://context7.com)）を推奨。

## 2. 導入コマンド

プロジェクトスコープ（`.mcp.json` に保存、リポジトリにコミットされチームで共有）で追加する。

```bash
claude mcp add --transport http --scope project context7 https://mcp.context7.com/mcp
```

実行結果として `.mcp.json` に以下が追記される。

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

### API キーを使う場合（任意）

```bash
claude mcp add --transport http --scope project --header "CONTEXT7_API_KEY: YOUR_API_KEY" context7 https://mcp.context7.com/mcp
```

API キーは `.env` 等の機密情報同様に扱い、`.mcp.json` に直接埋め込む場合はコミット前に内容を確認すること。

## 3. 承認

リモートMCPサーバーは初回利用時に承認が必要。`claude` を起動し、`context7` サーバーの利用を承認する（`/mcp` コマンドでも状態確認・承認が可能）。

```bash
claude mcp list
# context7: https://mcp.context7.com/mcp (HTTP) - ⏸ Pending approval (run `claude` to approve)
```

## 4. 動作確認

Claude Code のセッション内で、プロンプトに「use context7」を含めるか、ライブラリの最新仕様に関する質問（例:「Prisma 7 の driver adapter の使い方を教えて。context7 で確認して」）をして、`resolve-library-id` / `get-library-docs` ツールが呼ばれることを確認する。

## 5. 削除する場合

```bash
claude mcp remove context7 --scope project
```
