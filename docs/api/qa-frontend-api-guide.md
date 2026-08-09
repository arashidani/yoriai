# Q&A API フロントエンド実装ガイド

## 1. 画面別エンドポイント早見表

| 画面・操作 | METHOD | PATH |
| --- | --- | --- |
| Q&A一覧 | GET | `/api/questions` |
| タグ候補 | GET | `/api/question-tags` |
| 質問詳細 | GET | `/api/questions/{id}` |
| 回答一覧 | GET | `/api/questions/{id}/answers` |
| 投稿した質問 | GET | `/api/users/me/questions` |
| 保存した質問 | GET | `/api/users/me/saved-questions` |
| 質問投稿 | POST | `/api/questions` |
| 回答投稿 | POST | `/api/questions/{id}/answers` |
| 質問の足跡 | POST / DELETE | `/api/questions/{id}/likes` |
| 回答の足跡 | POST / DELETE | `/api/answers/{id}/likes` |
| 保存 | POST / DELETE | `/api/questions/{id}/bookmarks` |
| 募集終了 | POST | `/api/questions/{id}/resolve` |
| 質問削除 | DELETE | `/api/questions/{id}` |

## 2. 共通の認証方法

全APIでSupabaseセッションクッキーが必須。ブラウザのHono RPCは同一オリジンなので通常は追加指定不要。

- `401`: ログイン画面へ遷移
- `403`: 操作権限なし
- `404`: 対象なし・削除済み
- `409`: 現在の状態では操作不可、または冪等キー競合

## 3. Query・Body・レスポンス型

```ts
type QuestionTag = { id: string; name: string }

type Question = {
  id: string
  title: string
  body: string
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED'
  answerCount: number
  likeCount: number
  liked: boolean
  saved: boolean
  isOwnQuestion: boolean
  displayAuthor: { displayName: string; avatarUrl: string | null }
  tag: QuestionTag | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

type Answer = {
  id: string
  questionId: string
  body: string
  likeCount: number
  liked: boolean
  isOwnAnswer: boolean
  isMostLiked: boolean
  displayAuthor: { displayName: string; avatarUrl: string | null }
  createdAt: string
  updatedAt: string
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
```

## 質問一覧

`GET /api/questions`

Query:

- `page`（既定1）
- `pageSize`（既定10、最大50）
- `keyword`
- `status`: `all | unanswered | resolved`
- `tagId`

Response: `{ questions: Question[], pagination: Pagination }`

使用画面: なんでもQ&A一覧

Hono RPC:

```ts
const res = await client.api.questions.$get({
  query: { page: '1', pageSize: '10', status: 'all', keyword, tagId },
})
if (!res.ok) throw new Error('質問一覧の取得に失敗しました')
const { questions, pagination } = await res.json()
```

## 質問詳細

`GET /api/questions/{id}`

Response: `{ question: Question }`

```ts
const res = await client.api.questions[':id'].$get({ param: { id } })
const { question } = await res.json()
```

## 回答一覧

`GET /api/questions/{id}/answers`

Response: `{ answers: Answer[] }`

```ts
const res = await client.api.questions[':id'].answers.$get({ param: { id } })
const { answers } = await res.json()
```

## 投稿した質問

`GET /api/users/me/questions`

Query: `page`, `pageSize`

Response: `{ questions: Question[], pagination: Pagination }`

```ts
const res = await client.api.users.me.questions.$get({
  query: { page: '1', pageSize: '10' },
})
```

## 保存した質問

`GET /api/users/me/saved-questions`

Query: `page`, `pageSize`

Response: `{ questions: Question[], pagination: Pagination }`

```ts
const res = await client.api.users.me['saved-questions'].$get({
  query: { page: '1', pageSize: '10' },
})
```

## 質問・回答投稿

Body:

```ts
// 質問
{ title: string, body: string }

// 回答
{ body: string }
```

同じ内容を再送するときは同じUUIDを使う。

```ts
const res = await client.api.questions.$post({
  header: { 'idempotency-key': crypto.randomUUID() },
  json: { title, body },
})
```

## 4. UI表示条件

- `tag === null`: タグを表示しない。
- `isOwnQuestion`: 質問の足跡ボタンを表示しない。
- `isOwnAnswer`: 回答の足跡ボタンを表示しない。
- `status === 'RESOLVED'`: 回答フォーム・募集終了ボタンを表示しない。
- `isMostLiked === true`: その回答だけメダルを表示する。
- `questions.length === 0`: 一覧の空状態を表示する。
- `answers.length === 0`: 「まだ回答がありません」を表示する。

## 5. エラー処理早見表

| Status | UI |
| --- | --- |
| 400 | APIの `error` をフォーム付近に表示 |
| 401 | ログイン画面へ遷移 |
| 403 | 権限エラー通知 |
| 404 | 詳細はNot Found、投稿フォームは無効化 |
| 409 | 最新状態を再取得しAPIの `error` を表示 |
| 500 | 再試行ボタン付き共通エラー |

足跡・保存は楽観更新してよいが、失敗時に必ず元へ戻す。

## 6. MOCK_MODEの使い方

Server/APIは `MOCK_MODE=true`、ブラウザ側の既存モック判定は `NEXT_PUBLIC_MOCK_MODE=true` を使う。APIパスとレスポンス型は本番と同一。

認証済みセッションなしで対象3画面を確認するときだけ、追加で `MOCK_AUTH_BYPASS=true` を指定する。このフラグはQ&A画面以外には作用しない。

`post-3` の回答で、募集終了後の `isMostLiked=true` を確認できる。

## 7. Swagger

- 開発サーバー: [Swagger UI](/api/docs)
- JSON: [OpenAPI JSON](/api/openapi.json)
- 静的ファイル: `openapi/openapi.json` / `openapi/openapi.yaml`
