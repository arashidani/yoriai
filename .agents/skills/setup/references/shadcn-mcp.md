# shadcn-mcp 導入手順書

shadcn/ui 公式が提供する MCP サーバー（`shadcn@latest mcp`）を導入する手順。レジストリの検索・閲覧・インストールコマンド取得を Claude Code から直接行える。

---

## 1. 前提

- ローカルプロセスとして stdio 経由で起動する（hono-docs / context7 のようなリモートHTTPサーバーではない）。
- 提供される主なツール:
  - **search_items_in_registries** — 設定済みレジストリ（`@shadcn` など）からコンポーネントを検索
  - **view_items_in_registries** — コンポーネントの詳細（依存関係・ファイル内容）を閲覧
  - **get_add_command_for_items** — 指定コンポーネントを追加する `npx shadcn@latest add ...` コマンドを取得
  - **get_audit_checklist** — 追加後に確認すべきチェックリストを取得
- エイリアスやフレームワークのバージョンなどプロジェクト設定は MCP ツールでは扱わない（`npx shadcn@latest info` を使う）。

## 2. 導入コマンド

プロジェクトスコープ（`.mcp.json` に保存、リポジトリにコミットされチームで共有）で追加する。

```bash
claude mcp add --scope project shadcn -- npx shadcn@latest mcp
```

実行結果として `.mcp.json` に以下が追記される。

```json
{
  "shadcn": {
    "type": "stdio",
    "command": "npx",
    "args": ["shadcn@latest", "mcp"],
    "env": {}
  }
}
```

## 3. 使い方

1. Claude Code で `claude` を起動し、`shadcn` サーバーの利用を承認する（`/mcp` でも状態確認・承認可能）
2. [frontend skill](../../frontend/SKILL.md) の指示に従い、新しい shadcn コンポーネントが必要なときは `npx shadcn@latest add <component>` を端末で直接実行せず、MCP のツール経由で検索・追加コマンド取得・適用を行う
3. 特に `app/(admin)/` 配下の管理画面はコンポーネント追加頻度が高いため、MCP経由での追加を徹底する

```bash
claude mcp list
# shadcn: npx shadcn@latest mcp (stdio) - ⏸ Pending approval (run `claude` to approve)
```

## 4. 動作確認

Claude Code に「shadcn の button コンポーネントを探して」のように尋ね、`search_items_in_registries` ツールが呼ばれてレジストリ情報が返ってくることを確認する。

## 5. 削除する場合

```bash
claude mcp remove shadcn --scope project
```
