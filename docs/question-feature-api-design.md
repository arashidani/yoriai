# 質問機能：API設計メモ

## この資料の目的

質問機能MVPに必要になりそうなAPIの役割を整理する。詳細なrequest/response仕様を確定する資料ではなく、画面・機能から見たAPIの分け方を確認するためのメモとする。

## 現在の確度

- OpenAPI定義とモックAPIは存在する。
- 質問機能用のDBモデルと実処理は未実装。
- 以下のエンドポイント、認可、レスポンスは設計仮説であり、要件合意後に確定する。

## Questions

### `GET /api/questions`

| 項目 | 内容 |
| --- | --- |
| 用途 | 新着一覧、キーワード検索、未回答・解決済みの絞り込み |
| 想定クエリ | `q`、`status`、`unansweredOnly` |
| 方針 | 検索専用APIは作らず、一覧APIに検索条件を渡す |

### `POST /api/questions`

| 項目 | 内容 |
| --- | --- |
| 用途 | タイトルと本文を受け取り、質問スレッドを作成する |
| 認証 | 必要 |

### `GET /api/questions/{questionId}`

| 項目 | 内容 |
| --- | --- |
| 用途 | 質問本文、状態、回答一覧を取得する |
| 利用画面 | 質問詳細の初期表示 |

### `POST /api/questions/{questionId}/answers`

| 項目 | 内容 |
| --- | --- |
| 用途 | 質問へ回答を追加する |
| 認証 | 必要 |
| 制約案 | 解決済み・非表示の質問には投稿できない |

### `POST /api/questions/{questionId}/resolve`

| 項目 | 内容 |
| --- | --- |
| 用途 | 質問者が回答受付を終了し、解決済みにする |
| 認証 | 必要。質問者のみ操作可能とする案 |

## Reports

### `POST /api/questions/{questionId}/reports`

| 項目 | 内容 |
| --- | --- |
| 用途 | 不適切な質問を通報する |
| 認証 | 必要 |

### `POST /api/answers/{answerId}/reports`

| 項目 | 内容 |
| --- | --- |
| 用途 | 不適切な回答を通報する |
| 認証 | 必要 |

## Admin

### `GET /api/admin/reports`

| 項目 | 内容 |
| --- | --- |
| 用途 | 未対応の通報を確認する |
| 認可 | 管理者のみ |

### 非表示にするAPI

| エンドポイント | 用途 |
| --- | --- |
| `POST /api/admin/questions/{questionId}/hide` | 質問を非表示にする |
| `POST /api/admin/answers/{answerId}/hide` | 回答を非表示にする |

いずれも管理者のみが操作する。

### 実ユーザーを確認するAPI

| エンドポイント | 用途 |
| --- | --- |
| `GET /api/admin/questions/{questionId}/identity` | 質問者の実ユーザーを確認する |
| `GET /api/admin/answers/{answerId}/identity` | 回答者の実ユーザーを確認する |

いずれも管理者のみが操作する。

## MTGで確認したいこと

1. 一覧取得と検索を同じAPIにまとめる方針でよいか。
2. 解決済み後に回答受付を終了する仕様でよいか。
3. 通報・非表示・実ユーザー確認をMVPからAPIとして用意する範囲でよいか。
4. 認可やエラー仕様を、どの段階で詳細化するか。
