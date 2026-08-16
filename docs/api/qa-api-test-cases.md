# Q&A API テスト項目

## 自動テスト対象

| ID | 対象 | 条件 | 期待結果 |
| --- | --- | --- | --- |
| QA-001 | `GET /api/questions` | Queryなし | page=1、pageSize=10、単数 `tag` を返す |
| QA-002 | 質問一覧 | `keyword` | タイトル・本文の部分一致だけ返す |
| QA-003 | 質問一覧 | `status=unanswered` | `OPEN` だけ返す |
| QA-004 | 質問一覧 | `status=resolved` | `RESOLVED` だけ返す |
| QA-005 | 質問一覧 | `tagId` | 対象PostTagを持つ質問だけ返す |
| QA-006 | 質問一覧 | `page=2&pageSize=2` | 件数とpaginationが一致する |
| QA-007 | 質問詳細 | 存在するID | Viewer状態を含むQuestionを返す |
| QA-008 | 質問詳細 | 不明・削除済み | 404 |
| QA-009 | 回答一覧 | 未解決 | 全回答 `isMostLiked=false` |
| QA-010 | 回答一覧 | 解決済み・最多1票以上 | 1件だけ `isMostLiked=true` |
| QA-011 | 回答一覧 | 解決済み・最多0票 | 全回答false |
| QA-012 | 回答一覧 | 最多同数 | `createdAt ASC, id ASC` の1件だけtrue |
| QA-013 | 自分の投稿 | ページング | 本人の質問だけ返す |
| QA-014 | 保存した質問 | ページング | 保存日時降順、全件 `saved=true` |
| QA-015 | 旧API | `GET /api/posts` | 404 |
| QA-016 | 回答作成 | 質問が存在しない | 404 |
| QA-017 | 回答作成 | 質問が論理削除済み | 410 Gone（実DB・MOCK_MODE） |
| QA-018 | 回答作成 | 質問が回答受付終了 | 409 |

実装: `tests/api/qa-questions.test.ts`

## 認証・権限

| ID | 操作 | 期待結果 |
| --- | --- | --- |
| QA-A01 | 各Q&A APIをセッションなしで実行 | 401 `{ error: "Unauthorized" }` |
| QA-A02 | 他人の質問をresolve | 403 |
| QA-A03 | 自分の質問へ足跡POST | 403 |
| QA-A04 | 自分の回答へ足跡POST | 403 |
| QA-A05 | 一般ユーザーが `DELETE /api/admin/posts/{id}` | 403 |
| QA-A06 | 管理者が `DELETE /api/admin/posts/{id}` | 200 |
| QA-A07 | 廃止した `DELETE /api/questions/{id}` | 404 |
| QA-A08 | 管理者が存在しない投稿を削除 | 200（冪等） |

## 更新・冪等性

| ID | 操作 | 期待結果 |
| --- | --- | --- |
| QA-M01 | 同じIdempotency-Key・同じ質問を2回POST | 201の後200、重複なし |
| QA-M02 | 同じIdempotency-Key・異なる質問をPOST | 409 |
| QA-M03 | 同じIdempotency-Key・同じ回答を2回POST | 201の後200、answerCountは1回だけ増える |
| QA-M04 | 足跡POSTを2回 | 200、1件だけ作成、count一致 |
| QA-M05 | 足跡DELETEを2回 | 200、countは0未満にならない |
| QA-M06 | 保存POSTを2回 | 200、1件だけ作成 |
| QA-M07 | 保存DELETEを2回 | 200 |
| QA-M08 | 質問をresolve | 成功後の回答再取得でメダル規則を適用 |
| QA-M09 | AIタグ付与 | 新規質問へのPostTag作成が最大1件 |
| QA-M10 | AI非公開の質問作成 | 201で `moderation.isHidden=true`、理由は含めない |
| QA-M11 | AI非公開の質問を冪等再送 | 200でも `moderation.isHidden=true` |
| QA-M12 | AI非公開の回答作成 | 201で `moderation.isHidden=true`、理由は含めない |
| QA-M13 | AI非公開の回答を冪等再送 | 200でも `moderation.isHidden=true` |

## 手動確認

- Swaggerの全Q&A GETに鍵マークが表示される。
- `/api/openapi.json` と `openapi/openapi.{json,yaml}` のpathsが一致する。
- MOCK_MODEで対象3画面の空状態・取得中・エラー表示を確認する。
- Figmaコメントに記載したMETHOD、PATH、Query、表示条件を実APIと照合する。
- AI非公開の質問・回答で標準アラートが表示され、質問は一覧へ遷移、回答は入力リセット後に詳細を更新する。
- 一般ユーザーの3画面に質問削除ボタンが表示されず、管理者だけ削除ボタンが表示される。
- AIフラグの検出日時、招待リンクの作成日時・有効期限がJST時刻で表示される。
- UTCとJSTで日付が変わるユーザー登録日がJSTの日付で表示される。
- 招待リンクの作成日検索がJSTの00:00:00〜23:59:59.999境界で一致する。
- 左ナビで「マイページ」の直下に「投稿・保存した質問」があり、`/my-questions` でアクティブになる。
