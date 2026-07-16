# 質問機能 API 設計メモ

## このドキュメントの目的

質問機能 MVP の API について、先に「どのエンドポイントが必要か」と「何に使うか」を整理するためのメモ。

今回は詳細な request / response schema を詰め切ることは目的にせず、`OpenAPI` と `Swagger` で会話しやすい最小単位に留める。

---

## 今回含める API

今回は、質問機能 MVP を一通り回せるところまで OpenAPI に含める。

---

## API 一覧

### Questions

#### `GET /api/questions`

質問一覧を取得する。

用途:
- 新着質問一覧の表示
- キーワード検索結果の表示
- 未回答フィルター
- 解決済みフィルター

今回は、検索専用 API を分けずに、一覧 API にクエリを付けて検索する前提で考える。

想定クエリ例:
- `q`
- `status`
- `unansweredOnly`

#### `POST /api/questions`

新しい質問を投稿する。

用途:
- 質問投稿フォームからタイトルと本文を送信する
- 質問スレッドを新規作成する

認証ありの API とする。

#### `GET /api/questions/{questionId}`

質問詳細を取得する。

用途:
- 質問本文の表示
- 質問ステータスの表示
- 回答一覧の表示

質問詳細画面の初期表示に使う。

#### `POST /api/questions/{questionId}/answers`

対象質問に回答を追加する。

用途:
- 質問詳細画面から回答を投稿する

認証ありの API とする。

#### `POST /api/questions/{questionId}/resolve`

質問を解決済みにする。

用途:
- 質問者が回答受付を終了する

認証ありの API とする。

### Reports

#### `POST /api/questions/{questionId}/reports`

質問を通報する。

用途:
- 不適切な質問を通報する

認証ありの API とする。

#### `POST /api/answers/{answerId}/reports`

回答を通報する。

用途:
- 不適切な回答を通報する

認証ありの API とする。

### Admin

#### `GET /api/admin/reports`

通報一覧を取得する。

用途:
- 管理者が未対応通報を確認する

管理者専用の API とする。

#### `POST /api/admin/questions/{questionId}/hide`

質問を非表示にする。

用途:
- 管理者が不適切な質問に対応する

管理者専用の API とする。

#### `POST /api/admin/answers/{answerId}/hide`

回答を非表示にする。

用途:
- 管理者が不適切な回答に対応する

管理者専用の API とする。

#### `GET /api/admin/questions/{questionId}/identity`

質問者の実ユーザー情報を確認する。

用途:
- 匿名表示の裏側を管理者だけ確認する

管理者専用の API とする。

#### `GET /api/admin/answers/{answerId}/identity`

回答者の実ユーザー情報を確認する。

用途:
- 匿名表示の裏側を管理者だけ確認する

管理者専用の API とする。

---

## OpenAPI 上の扱い

Swagger で会話できるように、今回の API は `questions`、`reports`、`admin` タグで公開する。

ただし、現時点では実処理まで確定していないため、OpenAPI に最低限の request / response 例だけを置き、サーバー実装は未実装レスポンスを返す段階に留めてもよい。

この方針にすると、以下を分離できる。

1. API の役割を先に合意する
2. request / response schema をあとから精密化する
3. DB 実装や検索 SQL をあとからつなぐ
