# 質問投稿・タグ付与API フロントエンド連携ガイド

対象API:

- `POST /api/questions`
- `POST /api/questions/{id}/tag-assignment`

このドキュメントは、質問投稿時の手動タグ選択と、AIタグ付与失敗後の復旧フローをフロントエンドから利用するための契約をまとめたものです。最新の機械可読仕様は `/api/openapi.json`、Swagger UIは `/api/docs` を参照してください。

## 変更概要

1. 質問作成リクエストに任意の `tagId` が追加されました。
2. 質問作成レスポンスに `tagAssignment` が追加されました。
3. AIタグ付与失敗後に、AI再試行または手動付与を行うAPIが追加されました。
4. `その他（雑談に近い質問）` も他のQ&Aタグと同様に、投稿時の手動選択とAI付与で使用できます。

## 1. `POST /api/questions`

### 用途

質問を作成します。`tagId` を送れば手動タグを付与し、省略するとAIが最大1件のタグを選択します。

### リクエスト

```http
POST /api/questions
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

AIにタグ選択を任せる場合:

```json
{
  "title": "有給申請の方法を教えてください",
  "body": "申請画面の場所が分かりません"
}
```

手動でタグを選択する場合:

```json
{
  "title": "最近のおすすめランチは？",
  "body": "オフィス近くのお店を知りたいです",
  "tagId": "<その他（雑談に近い質問）のtagId>"
}
```

| フィールド | 必須 | 説明 |
|---|---:|---|
| `title` | はい | 1〜200文字 |
| `body` | はい | 1文字以上 |
| `tagId` | いいえ | `GET /api/question-tags` が返す小ジャンルのID。省略時はAI付与 |

`Idempotency-Key` はUUID形式で毎回付与してください。同じ投稿操作の再送では同じキーと同じボディを使い、フォーム内容が変わった場合は新しいキーを生成してください。

### 成功レスポンス

- `201 Created`: 新規作成
- `200 OK`: 同じ `Idempotency-Key` による再送

以下はタグ連携に必要な主要フィールドの抜粋です。`question` の完全な型はOpenAPIの `Question` スキーマを参照してください。

```json
{
  "question": {
    "id": "question-id",
    "title": "有給申請の方法を教えてください",
    "body": "申請画面の場所が分かりません",
    "tag": {
      "id": "tag-category-id",
      "name": "社内ルール・手続き"
    }
  },
  "moderation": {
    "isHidden": false
  },
  "tagAssignment": "assigned"
}
```

`question.tag` は小ジャンルではなく、表示用の親カテゴリーです。小ジャンルのID・名称は、後述のタグ付与APIの成功レスポンスから取得できます。

### `tagAssignment`

| 値 | 意味 | フロントの推奨動作 |
|---|---|---|
| `assigned` | 手動またはAIでタグ付与成功 | 投稿完了画面へ進む |
| `failed` | 質問作成は成功したがタグ付与失敗 | 画面を閉じず、AI再試行／手動選択UIを表示 |
| `skipped` | 非公開判定などでタグ付与なし | `moderation.isHidden` を優先して非公開エラーを表示 |

質問作成自体が成功しているため、`tagAssignment: "failed"` の場合に `POST /api/questions` を再送しないでください。返却された `question.id` でタグ付与APIを呼びます。

### 主なエラー

| HTTP | 意味 | 代表メッセージ |
|---:|---|---|
| `400` | `tagId` がQ&A用タグではない／存在しない | `選択されたタグが見つかりません` |
| `401` | 未認証 | `Unauthorized` |
| `409` | 同じ冪等キーで異なる本文を再送 | `同じ投稿操作に異なる内容が指定されています` |
| `500` | 質問作成失敗 | `投稿の作成に失敗しました` |

## 2. `POST /api/questions/{id}/tag-assignment`

### 用途

`POST /api/questions` が `tagAssignment: "failed"` を返した場合に、作成済み質問へタグを復旧付与します。操作できるのは質問者本人だけです。

### AIで再試行

```json
{
  "mode": "ai"
}
```

### 手動で付与

```json
{
  "mode": "manual",
  "tagId": "<GET /api/question-tags が返すtagId>"
}
```

`mode` は `ai` / `manual` の判別キーです。`manual` の場合だけ `tagId` が必須です。

### 成功レスポンス

```json
{
  "tag": {
    "id": "tag-id",
    "name": "その他（雑談に近い質問）"
  }
}
```

すでにタグが付いている場合も `200 OK` で既存タグを返します。フロントはこれを成功として扱えます。

### エラー

| HTTP | 意味 | フロントの推奨動作 |
|---:|---|---|
| `400` | 手動タグが不正 | タグ候補を再取得し、再選択を促す |
| `401` | 未認証 | ログイン導線へ |
| `403` | 質問者本人ではない | 復旧UIを閉じる |
| `404` | 質問が存在しない | 一覧へ戻す |
| `409` | 削除済み・非公開などで付与不可 | 復旧UIを閉じ、APIの `error` を表示 |
| `503` | AI再試行失敗 | モーダルを保持し、AI再試行または手動選択を促す |

## フロント実装例

API呼び出しは `@/lib/hono/client` を使います。

```ts
const createResponse = await client.api.questions.$post({
  header: { 'idempotency-key': idempotencyKey },
  json: { title, body, tagId },
})

if (!createResponse.ok) {
  const { error } = await createResponse.json()
  throw new Error(error)
}

const result = await createResponse.json()

if (result.moderation.isHidden) {
  showModerationError()
} else if (result.tagAssignment === 'failed') {
  showTagRecovery({ questionId: result.question.id })
} else {
  showCompletion({ questionId: result.question.id })
}
```

AI再試行:

```ts
await client.api.questions[':id']['tag-assignment'].$post({
  param: { id: questionId },
  json: { mode: 'ai' },
})
```

手動付与:

```ts
await client.api.questions[':id']['tag-assignment'].$post({
  param: { id: questionId },
  json: { mode: 'manual', tagId },
})
```

## 実装時の注意点

- `tagAssignment: "failed"` は「投稿失敗」ではありません。質問はすでに作成されています。
- タグ復旧中は質問作成APIを再実行せず、`question.id` を保持してください。
- AI再試行失敗の `503` は再試行可能です。ただし自動ループはせず、ユーザー操作で再実行してください。
- 手動付与の `tagId` は画面にハードコードせず、`GET /api/question-tags` の値を使ってください。
- `その他（雑談に近い質問）` も通常のQ&Aタグと同じ扱いです。
