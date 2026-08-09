# Q&A Figma貼り付け用APIコメント

各ブロックをFigmaの対象要素へそのまま貼り付ける。

## Q&A一覧

### 画面初期表示・質問カード一覧

```text
仕様
GET: /api/questions
Header: Supabaseセッションクッキー（必須）
Query: page=1, pageSize=10, keyword?, status?, tagId?

使用項目:
questions[].id / title / body / displayAuthor / status / answerCount / likeCount / liked / saved / isOwnQuestion / tag / createdAt
pagination.page / pageSize / total / totalPages

表示条件:
tag が null の場合はカテゴリーチップを表示しない。
isOwnQuestion=true の場合は質問の足跡ボタンを表示しない。
質問カード押下で /posts/{id} へ遷移する。

状態:
取得中はカードスケルトンを表示する。
questions が0件なら「条件に一致する質問がありません」を表示する。
401はログイン画面へ遷移する。その他のエラーは再読み込みボタン付きエラーを表示する。
```

### キーワード検索

```text
仕様
GET: /api/questions
Query: keyword={入力値}, page=1, pageSize=10, status?, tagId?

表示条件:
検索実行時は page を1へ戻す。
空文字は keyword を送信しない。
タイトル・本文の部分一致結果を表示する。

状態:
検索中は現在の条件を保持して一覧をローディング表示する。
0件は検索結果の空状態を表示する。
```

### 状態フィルター

```text
仕様
GET: /api/questions
Query: status=all|unanswered|resolved, page=1, pageSize=10

対応:
すべて = all
未回答 = unanswered（OPENのみ）
解決済み = resolved（RESOLVEDのみ）

表示条件:
変更時は page を1へ戻す。
```

### カテゴリーフィルター

```text
仕様
候補取得 GET: /api/question-tags
一覧取得 GET: /api/questions?tagId={tagId}&page=1&pageSize=10
Header: Supabaseセッションクッキー（必須）

使用項目:
tags[].id / name

表示条件:
現仕様は単一選択。未選択時は tagId を送信しない。
候補0件ならフィルターを無効化する。
```

### ページネーション

```text
仕様
GET: /api/questions?page={page}&pageSize=10&keyword?&status?&tagId?

使用項目:
pagination.page / totalPages / total

表示条件:
totalPages<=1 の場合はページネーションを表示しない。
ページ変更時も検索・状態・カテゴリ条件を保持する。
```

### 質問するボタン

```text
仕様
押下時: /posts/new へ遷移
投稿API: POST /api/questions
Header: Idempotency-Key={UUID}, Supabaseセッションクッキー
Body: { title, body }

状態:
送信中はボタンを無効化する。
201または200で一覧へ遷移する。
400は項目エラー、409は重複キー競合、その他は再送可能なエラーを表示する。
通信再試行では同じ内容に同じIdempotency-Keyを使う。
```

### 質問カード 足跡

```text
仕様
追加 POST: /api/questions/{id}/likes
取消 DELETE: /api/questions/{id}/likes

使用項目:
liked / likeCount

表示条件:
isOwnQuestion=true の場合はボタンを表示しない。
押下中は連打を無効化する。
失敗時は表示を元に戻してエラー通知する。
```

### 質問カード 保存

```text
仕様
保存 POST: /api/questions/{id}/bookmarks
取消 DELETE: /api/questions/{id}/bookmarks

使用項目:
saved

状態:
押下中は連打を無効化する。
失敗時は表示を元に戻してエラー通知する。
```

### あなたが回答できる質問

```text
仕様
現状は GET /api/questions?page=1&pageSize=10 の questions 先頭3件を表示する。

使用項目:
questions[0..2].id / title

空状態:
0件なら「まだ質問がありません」を表示する。

TODO:
BusinessSkill（大ジャンル）とQ&Aタグの関連が未実装のため推薦ロジックは追加しない。
将来はプロフィールのBusinessSkill→小分類タグで、OPEN・本人以外の質問を推薦する。
```

## 質問詳細

### 質問本文カード

```text
仕様
GET: /api/questions/{id}
Header: Supabaseセッションクッキー（必須）

使用項目:
question.id / title / body / displayAuthor / status / likeCount / liked / saved / isOwnQuestion / tag / createdAt

表示条件:
tag=null はカテゴリーチップを表示しない。
status=RESOLVED は募集終了表示にする。
404はNot Found画面、401はログイン画面へ遷移する。
```

### 回答一覧

```text
仕様
GET: /api/questions/{id}/answers
Header: Supabaseセッションクッキー（必須）

使用項目:
answers[].id / body / displayAuthor / likeCount / liked / isOwnAnswer / isMostLiked / createdAt

表示条件:
回答はAPI順のまま表示する。
isMostLiked=true の回答だけメダルを表示する。
メダルは質問が募集終了済みかつ最多いいねが1票以上のときだけ1件返る。
isOwnAnswer=true の場合は回答の足跡ボタンを表示しない。

状態:
0件なら「まだ回答がありません」を表示する。
取得失敗時は質問本文を残し、回答欄に再読み込みボタン付きエラーを表示する。
```

### 回答投稿フォーム

```text
仕様
POST: /api/questions/{id}/answers
Header: Idempotency-Key={UUID}, Supabaseセッションクッキー
Body: { body }

表示条件:
question.status が OPEN または ANSWERED の場合だけ表示する。
RESOLVEDでは「この質問は回答を受け付けていません」を表示する。

状態:
送信中はボタンを無効化する。
201または200で回答一覧を再取得する。
404は質問削除済み、409は募集終了としてフォームを無効化する。
通信再試行では同じ内容に同じIdempotency-Keyを使う。
```

### 募集を終了するボタン

```text
仕様
POST: /api/questions/{id}/resolve

表示条件:
isOwnQuestion=true かつ status=OPEN|ANSWERED の場合だけ表示する。

状態:
成功後に質問詳細と回答一覧を再取得する。
再取得後、条件を満たす回答だけ isMostLiked=true となりメダルが表示される。
403は権限エラー、409は既に操作不可として最新状態を再取得する。
```

### 回答カード 足跡

```text
仕様
追加 POST: /api/answers/{id}/likes
取消 DELETE: /api/answers/{id}/likes

使用項目:
liked / likeCount

表示条件:
isOwnAnswer=true の場合は表示しない。
押下中は連打を無効化し、失敗時は表示を元に戻す。
```

## 投稿・保存した質問一覧

### 投稿した質問タブ

```text
仕様
GET: /api/users/me/questions
Header: Supabaseセッションクッキー（必須）
Query: page=1, pageSize=10

使用項目:
questions[] / pagination

表示条件:
0件なら「投稿した質問はありません」を表示する。
回答が0件の自分の質問だけ削除ボタンを表示する。
```

### 保存した質問タブ

```text
仕様
GET: /api/users/me/saved-questions
Header: Supabaseセッションクッキー（必須）
Query: page=1, pageSize=10

使用項目:
questions[] / pagination

表示条件:
保存日時の新しい順でAPI順のまま表示する。
0件なら「保存した質問はありません」を表示する。
保存取消成功後はカードを一覧から取り除く。
```

### 質問削除

```text
仕様
DELETE: /api/questions/{id}

表示条件:
管理者、または isOwnQuestion=true かつ answerCount=0 の場合だけ表示する。

状態:
成功後はカードを一覧から取り除く。
409は「回答がある質問は削除できません」を表示して一覧を再取得する。
```
