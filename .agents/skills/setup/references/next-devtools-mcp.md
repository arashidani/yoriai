# next-devtools-mcp 導入手順書

起動中の Next.js 開発サーバーに接続し、ビルドエラー・ランタイムエラー・型エラーやルート情報をClaude Codeから直接取得できるMCPサーバー([vercel/next-devtools-mcp](https://github.com/vercel/next-devtools-mcp))を導入する手順。

このプロジェクトは Next.js 16 を使っており、16以降は開発サーバー内蔵の MCP エンドポイント（`/_next/mcp`）を持つため、`next-devtools-mcp` がそれを検出してプロキシする。

---

## 1. 前提

- `npm run dev`（`next dev`）でローカル開発サーバーが起動している必要がある。起動していないと next-devtools-mcp は接続先を検出できない。
- ローカルプロセスとして stdio 経由で起動する（hono-docs / context7 のようなリモートHTTPサーバーではない）。
- 提供される主な機能:
  - **Error Detection** — ビルドエラー・ランタイムエラー・型エラーの取得
  - **Live State Queries** — 実行中アプリのリアルタイム状態取得
  - **Page Metadata** — ルート・コンポーネント・レンダリング詳細の取得

## 2. 導入コマンド

プロジェクトスコープ（`.mcp.json` に保存、リポジトリにコミットされチームで共有）で追加する。

```bash
claude mcp add --scope project next-devtools -- npx -y next-devtools-mcp@latest
```

実行結果として `.mcp.json` に以下が追記される。

```json
{
  "next-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "next-devtools-mcp@latest"],
    "env": {}
  }
}
```

## 3. 使い方

1. 別ターミナルで `npm run dev` を起動しておく
2. Claude Code で `claude` を起動し、`next-devtools` サーバーの利用を承認する（`/mcp` でも状態確認・承認可能）
3. 「今出ているビルドエラーを教えて」のようにエラー内容を尋ねると、next-devtools のツールが呼ばれる

```bash
claude mcp list
# next-devtools: npx -y next-devtools-mcp@latest (stdio) - ⏸ Pending approval (run `claude` to approve)
```

## 4. 動作確認

`npm run dev` を起動した状態で、Claude Code に現在のビルド/型エラーやルート一覧を質問し、next-devtools 経由の情報が返ってくることを確認する。

## 5. 削除する場合

```bash
claude mcp remove next-devtools --scope project
```
