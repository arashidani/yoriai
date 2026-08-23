-- AIタグ用（質問・プロフ）シートに合わせて、質問タグ関連のマスターを同期する。
-- Excel上の前後空白は除去し、「その他」はTag.categoryの必須制約を満たすため
-- 専用のTagCategoryとして保持する。

INSERT INTO "TagCategory" ("id", "name", "createdAt")
VALUES
  (md5('tag-category:社内ルール・手続き'), '社内ルール・手続き', CURRENT_TIMESTAMP),
  (md5('tag-category:IT・ツール操作'), 'IT・ツール操作', CURRENT_TIMESTAMP),
  (md5('tag-category:業務スキル'), '業務スキル', CURRENT_TIMESTAMP),
  (md5('tag-category:顧客対応・コミュニケーション'), '顧客対応・コミュニケーション', CURRENT_TIMESTAMP),
  (md5('tag-category:IBJマインド・キャリア'), 'IBJマインド・キャリア', CURRENT_TIMESTAMP),
  (md5('tag-category:その他'), 'その他', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "BusinessSkill" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES
  (md5('business-skill:社内ルール・手続き'), '社内ルール・手続き', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (md5('business-skill:IT・ツール操作'), 'IT・ツール操作', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (md5('business-skill:業務スキル'), '業務スキル', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (md5('business-skill:顧客対応・コミュニケーション'), '顧客対応・コミュニケーション', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (md5('business-skill:IBJマインド・キャリア'), 'IBJマインド・キャリア', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Tag" ("id", "name", "category", "description", "isWorkTag", "createdAt")
VALUES
  (md5('tag:勤怠・有給関連'), '勤怠・有給関連', '社内ルール・手続き', '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:経費精算'), '経費精算', '社内ルール・手続き', '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:福利厚生'), '福利厚生', '社内ルール・手続き', '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:社内設備'), '社内設備', '社内ルール・手続き', '会社で働く上で「必ず正解がある」事務的なこと。総務や経理、社歴の長い人が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:社内ツール'), '社内ツール', 'IT・ツール操作', 'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:Office（Excel等）'), 'Office（Excel等）', 'IT・ツール操作', 'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:デザイナー向け'), 'デザイナー向け', 'IT・ツール操作', 'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:エンジニア向け'), 'エンジニア向け', 'IT・ツール操作', 'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:一般IT知識'), '一般IT知識', 'IT・ツール操作', 'PCやシステムなど「使い方がわからない」こと。ITリテラシーが高い人やシステム部が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:営業・商談'), '営業・商談', '業務スキル', '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:資料作成'), '資料作成', '業務スキル', '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:企画アイディア'), '企画アイディア', '業務スキル', '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:タスク管理'), 'タスク管理', '業務スキル', '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:データ分析'), 'データ分析', '業務スキル', '正解はないが「こうすると上手くいく」という経験やコツ。中堅やエース社員が活躍しやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:仲間とのコミュニケーション'), '仲間とのコミュニケーション', '顧客対応・コミュニケーション', NULL, true, CURRENT_TIMESTAMP),
  (md5('tag:お客様とのコミュニケーション'), 'お客様とのコミュニケーション', '顧客対応・コミュニケーション', '対人関係や「IBJならでは」のソフトスキル。現場の最前線で働く人が答えやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:キャリア相談'), 'キャリア相談', 'IBJマインド・キャリア', '会社の文化や、マニュアル化しづらいこと。マスター層やマネージャー層が語りやすい。', true, CURRENT_TIMESTAMP),
  (md5('tag:その他（雑談に近い質問）'), 'その他（雑談に近い質問）', 'その他', NULL, false, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET
  "category" = EXCLUDED."category",
  "description" = EXCLUDED."description",
  "isWorkTag" = EXCLUDED."isWorkTag";

-- 現行マスターに存在しない旧タグを削除する。
-- Tagの外部キーはON DELETE CASCADEのため、旧タグとの関連レコードも同時に除去される。
DELETE FROM "Tag"
WHERE "name" NOT IN (
  '勤怠・有給関連',
  '経費精算',
  '福利厚生',
  '社内設備',
  '社内ツール',
  'Office（Excel等）',
  'デザイナー向け',
  'エンジニア向け',
  '一般IT知識',
  '営業・商談',
  '資料作成',
  '企画アイディア',
  'タスク管理',
  'データ分析',
  '仲間とのコミュニケーション',
  'お客様とのコミュニケーション',
  'キャリア相談',
  'その他（雑談に近い質問）'
);

DELETE FROM "TagCategory"
WHERE "name" NOT IN (
  '社内ルール・手続き',
  'IT・ツール操作',
  '業務スキル',
  '顧客対応・コミュニケーション',
  'IBJマインド・キャリア',
  'その他'
);

-- 現行マスターに存在しない旧スキルと、そのユーザー選択を削除する。
DELETE FROM "BusinessSkill"
WHERE "name" NOT IN (
  '社内ルール・手続き',
  'IT・ツール操作',
  '業務スキル',
  '顧客対応・コミュニケーション',
  'IBJマインド・キャリア'
);
