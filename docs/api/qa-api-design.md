# Q&A API 設計書

## 1. 対象

対象画面は次の3画面とする。

- Q&A一覧
- 質問詳細
- 投稿・保存した質問一覧

広場、趣味タグ、タグ管理画面の刷新、ビジネススキルとQ&Aタグの関連付けは対象外とする。

## 2. 現行仕様

- 公開ルートは `/api/posts`。
- 一覧・詳細・回答一覧は未認証でも取得できる。
- 一覧は全件取得で、検索・絞り込み・ページングをフロント側で行う。
- 質問詳細と回答一覧をServer ComponentがPrismaから直接取得する。
- 質問タグは `tags` 配列で返す。AIは最大3件付与する。
- 投稿した質問・保存した質問の専用取得APIはない。
- `liked`、`saved`、`isOwnQuestion`、回答の `liked` はAPIの共通レスポンスに含まれない。
- 回答はいいね数降順、同数なら古い順で並ぶが、メダル表示用の契約はない。
- 「あなたが回答できそうな質問」は一覧先頭3件を表示している。

## 3. 変更前・変更後

| 項目 | 変更前 | 変更後 |
| --- | --- | --- |
| 公開ルート | `/api/posts` | `/api/questions` |
| 認証 | 一部のGETは不要 | Q&A APIはすべて必須 |
| 一覧取得 | 全件 | `page` / `pageSize`、既定10件 |
| 絞り込み | フロント内 | `keyword` / `status` / `tagId` |
| 質問タグ | `tags: Tag[]` | `tag: TagLite \| null` |
| 詳細と回答 | 画面からPrisma直読 | それぞれ専用API |
| 閲覧者状態 | 別クエリ・画面内合成 | `liked` / `saved` / 所有者判定をAPIで返す |
| 自分の一覧 | 専用APIなし | 投稿・保存それぞれ専用API |
| 回答メダル | 契約なし | 解決済み質問の最多いいね回答1件だけ `isMostLiked=true` |
| AIタグ付与 | 最大3件 | 最大1件 |
| 旧API | 利用中 | `/api/posts` を廃止し404 |

Prismaの `PostTag` は複数件を保持できる現行構造を変更しない。公開APIは `PostTag.createdAt ASC, PostTag.id ASC` の先頭1件だけを `tag` として返す。

## 4. 共通仕様

### 4.1 認証

全エンドポイントでSupabaseセッションクッキーを必須とする。未認証は次を返す。

```json
{
  "error": "Unauthorized"
}
```

Status: `401`

### 4.2 日時

日時はISO 8601の文字列として返す。

### 4.3 ページング

- `page`: 1以上。既定 `1`
- `pageSize`: 1〜50。既定 `10`
- 一覧順: `updatedAt DESC, id DESC`

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 24,
    "totalPages": 3
  }
}
```

該当0件では `totalPages` は `0` とする。

### 4.4 質問レスポンス

```ts
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
  displayAuthor: {
    displayName: string
    avatarUrl: string | null
  }
  tag: { id: string; name: string } | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}
```

自分の質問では実名を、他ユーザーの質問では質問内の匿名プロフィールを `displayAuthor` に設定する。非表示・削除済み質問は通常の取得対象に含めない。

### 4.5 回答レスポンス

```ts
type Answer = {
  id: string
  questionId: string
  body: string
  likeCount: number
  liked: boolean
  isOwnAnswer: boolean
  isMostLiked: boolean
  displayAuthor: {
    displayName: string
    avatarUrl: string | null
  }
  createdAt: string
  updatedAt: string
}
```

`isMostLiked` の決定規則は次のとおり。

1. 質問が `RESOLVED` であること。
2. 表示対象回答の最大 `likeCount` が1以上であること。
3. 最大いいね数の回答だけを候補にする。
4. 同数の場合は `createdAt ASC, id ASC` の先頭1件だけを `true` にする。
5. 条件を満たさない場合は全回答を `false` にする。

## 5. エンドポイント

### 5.1 質問一覧

`GET /api/questions`

Query:

- `page?: number`
- `pageSize?: number`
- `keyword?: string` — タイトル・本文の部分一致
- `status?: all | unanswered | resolved`
- `tagId?: string`

状態条件:

- `all`: `OPEN`、`ANSWERED`、`RESOLVED`
- `unanswered`: `OPEN`
- `resolved`: `RESOLVED`

Response `200`:

```json
{
  "questions": [],
  "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 0 }
}
```

### 5.2 質問詳細

`GET /api/questions/{id}`

Response `200`: `{ "question": Question }`

Response `404`: `{ "error": "Not found" }`

### 5.3 回答一覧

`GET /api/questions/{id}/answers`

表示対象回答を `likeCount DESC, createdAt ASC, id ASC` で返す。

Response `200`: `{ "answers": Answer[] }`

Response `404`: 質問が存在しない、削除済み、非表示の場合。

### 5.4 投稿した質問

`GET /api/users/me/questions`

Query: `page`、`pageSize`

自分が投稿した質問を更新日時の新しい順で返す。Response形式は質問一覧と同じ。

### 5.5 保存した質問

`GET /api/users/me/saved-questions`

Query: `page`、`pageSize`

自分が保存した質問を保存日時の新しい順、同時刻はBookmark ID降順で返す。Response形式は質問一覧と同じ。

### 5.6 Q&Aタグ候補

`GET /api/question-tags`

`isWorkTag=true` のタグを名前順で返す。

Response `200`: `{ "tags": { "id": string, "name": string }[] }`

現時点ではBusinessSkillとの関連は持たない。

### 5.7 質問作成

`POST /api/questions`

Header: `Idempotency-Key: UUID`

Body: `{ "title": string, "body": string }`

Response: 新規作成 `201`、同一内容の再送 `200`、同じキーで異なる内容 `409`。

AIによるタグ選択・PostTag作成は最大1件とする。

### 5.8 回答作成

`POST /api/questions/{id}/answers`

Header: `Idempotency-Key: UUID`

Body: `{ "body": string }`

Response: 新規作成 `201`、同一内容の再送 `200`、解決済み・非表示 `409`。自分の質問への回答は許可する。

### 5.9 質問の足跡

- `POST /api/questions/{id}/likes`
- `DELETE /api/questions/{id}/likes`

Response `200`: `{ "liked": boolean, "likeCount": number }`

POST/DELETEとも冪等。自分の質問へのPOSTは `403`。

### 5.10 回答の足跡

- `POST /api/answers/{id}/likes`
- `DELETE /api/answers/{id}/likes`

Response `200`: `{ "liked": boolean, "likeCount": number }`

POST/DELETEとも冪等。自分の回答へのPOSTは `403`。

### 5.11 保存

- `POST /api/questions/{id}/bookmarks`
- `DELETE /api/questions/{id}/bookmarks`

Response `200`: `{ "saved": boolean }`

POST/DELETEとも冪等。

### 5.12 募集終了

`POST /api/questions/{id}/resolve`

質問者だけが実行できる。Response `200`: `{ "question": Question }`。

募集終了直後の回答一覧再取得から `isMostLiked` を計算する。DBにメダル状態は保存しない。

### 5.13 質問削除

`DELETE /api/questions/{id}`

管理者、または回答が付く前の質問者本人だけ実行できる。既に存在しない場合も成功とする。

## 6. 画面ごとの利用API

| 画面 | API |
| --- | --- |
| Q&A一覧 | `GET /api/questions`、`GET /api/question-tags`、質問の足跡・保存・削除 |
| 質問詳細 | `GET /api/questions/{id}`、`GET /api/questions/{id}/answers`、回答投稿、足跡、保存、募集終了 |
| 投稿・保存した質問一覧 | `GET /api/users/me/questions`、`GET /api/users/me/saved-questions`、保存・削除 |

## 7. MOCK_MODE

- 認証ユーザーは既存の `MOCK_USERS[0]`。
- 実APIと同じQuery、Status、Body、レスポンス構造を使う。
- 一覧検索・状態・単数タグ・ページングをfixture上でも適用する。
- `post-3` を解決済み、1票以上の回答ありとしてメダル表示を確認できるようにする。
- 認証セッションなしの画面確認は、`MOCK_MODE=true` と `MOCK_AUTH_BYPASS=true` を同時指定したQ&A画面だけ許可する。
- モックの更新系は永続化しないが、返却値とエラー条件を実APIに合わせる。

## 8. 実装内容

- Question/Answer用レスポンスmapperを追加する。
- 一覧・詳細・回答・自分の投稿・保存済みのPrismaクエリを追加する。
- Viewerの足跡・保存・所有状態をAPIレスポンスへ統合する。
- `MOCK_MODE` fixtureを新契約へ変換する。
- Hono `createRoute` とZodを契約の唯一の定義元にする。
- Server ComponentのQ&AデータPrisma直読を廃止し、Cookieを転送する内部Hono RPCクライアントへ変更する。
- Client ComponentのRPCパスを `/questions` へ変更する。
- MSW/Storybookを新契約へ変更する。
- `/api/posts` の公開登録を削除する。`/api/admin/posts` は変更しない。

## 9. 将来TODO

- `isWorkTag=true` とBusinessSkill（大ジャンル）の関連モデルを設計する。
- プロフィールのBusinessSkillから小分類タグを解決し、「あなたが回答できる質問」を `OPEN` かつ本人以外に限定して推薦する。
- 推薦の並び順と、該当0件時のフォールバックを決める。
- タグ名の文字列一致による暫定連携は行わない。
- DB制約として「Q&A質問1件につきタグ1件」を強制するかは、タグ管理仕様確定後に判断する。
