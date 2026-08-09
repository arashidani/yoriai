# Q&A Figma貼り付け用APIコメント

各コードブロックを、Figmaの対象要素へそのまま貼り付ける。

## Q&A一覧

### 質問一覧

```text
【仕様】

GET：質問一覧を取得
`/api/questions`

page・pageSizeでページング、
keyword・status・tagIdで絞り込む。
```

### カテゴリー選択

```text
【仕様】

GET：Q&Aカテゴリー候補を取得
`/api/question-tags`

選択したタグIDを質問一覧のtagIdへ指定する。
質問にtagがない場合、カテゴリーは表示しない。
```

### 質問する

```text
【仕様】

POST：質問を投稿
`/api/questions`

Body：title、body
moderation.isHidden=trueの場合、
AI判定で非公開になったことをアラート表示する。
```

### 質問カード

```text
【仕様】

GET：質問詳細を取得
`/api/questions/{questionId}`

カード選択時、questionIdの質問詳細へ遷移する。
```

### 質問への足跡

```text
【仕様】

POST：質問に足跡を付ける
DELETE：質問の足跡を外す
`/api/questions/{questionId}/likes`

自分の質問には足跡ボタンを表示しない。
```

### 質問を保存

```text
【仕様】

POST：質問を保存
DELETE：質問の保存を解除
`/api/questions/{questionId}/bookmarks`

成功した場合、ボタンの保存済み表示を切り替える。
```

### あなたが回答できる質問

```text
【仕様】

GET：質問一覧を取得
`/api/questions?page=1&pageSize=10`

現状は取得結果の先頭3件を表示する。
ビジネススキル連携は今後対応する。
```

### ページ切り替え

```text
【仕様】

GET：指定ページの質問を取得
`/api/questions`

Query：page、pageSize
検索・絞り込み条件はページ切り替え後も維持する。
```

## 質問詳細

### 質問本文

```text
【仕様】

GET：質問詳細を取得
`/api/questions/{questionId}`

status=RESOLVEDの場合、募集終了表示にする。
```

### 回答一覧

```text
【仕様】

GET：回答一覧を取得
`/api/questions/{questionId}/answers`

isMostLiked=trueの回答だけメダルを表示する。
メダルは募集終了後かつ最多いいねが1件以上の場合のみ表示する。
```

### 回答を投稿

```text
【仕様】

POST：回答を投稿
`/api/questions/{questionId}/answers`

Body：body
moderation.isHidden=trueの場合、
AI判定で非公開になったことをアラート表示する。
```

### 回答できない状態

```text
【仕様】

POST：回答を投稿
`/api/questions/{questionId}/answers`

404または410の場合、入力と送信を無効化し
「一覧に戻る」を表示する。
409の場合、募集終了状態へ更新する。
```

### 回答への足跡

```text
【仕様】

POST：回答に足跡を付ける
DELETE：回答の足跡を外す
`/api/answers/{answerId}/likes`

自分の回答には足跡ボタンを表示しない。
```

### 募集を終了する

```text
【仕様】

POST：回答募集を終了
`/api/questions/{questionId}/resolve`

自分の質問かつ募集終了前だけボタンを表示する。
成功後、質問と回答一覧を再取得する。
```

## 投稿・保存した質問一覧

### 投稿した質問

```text
【仕様】

GET：自分が投稿した質問を取得
`/api/users/me/questions`

Query：page、pageSize
一般ユーザーには質問削除ボタンを表示しない。
```

### 保存した質問

```text
【仕様】

GET：自分が保存した質問を取得
`/api/users/me/saved-questions`

Query：page、pageSize
保存解除後は一覧を更新する。
```

### 左ナビ

```text
【仕様】

「投稿・保存した質問」を選択すると
`/my-questions` へ遷移する。

表示中はメニューをアクティブ表示にする。
```

## 管理者向け

### 質問を削除

```text
【仕様】

DELETE：質問を削除
`/api/admin/posts/{questionId}`

管理者だけ削除ボタンを表示する。
存在しない質問でも成功扱いとする。
```
