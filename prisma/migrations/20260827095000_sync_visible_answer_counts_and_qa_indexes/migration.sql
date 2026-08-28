-- answerCount は画面に表示する公開回答（isHidden = false）の件数に揃える。
UPDATE "Post" AS p
SET "answerCount" = sub.cnt
FROM (
  SELECT p2.id AS post_id, COUNT(a.id)::int AS cnt
  FROM "Post" AS p2
  LEFT JOIN "Answer" AS a ON a."postId" = p2.id AND a."isHidden" = false
  GROUP BY p2.id
) AS sub
WHERE p.id = sub.post_id
  AND p."answerCount" IS DISTINCT FROM sub.cnt;

UPDATE "HirobaPost" AS p
SET "answerCount" = sub.cnt
FROM (
  SELECT p2.id AS post_id, COUNT(a.id)::int AS cnt
  FROM "HirobaPost" AS p2
  LEFT JOIN "HirobaAnswer" AS a
    ON a."hirobaPostId" = p2.id AND a."isHidden" = false
  GROUP BY p2.id
) AS sub
WHERE p.id = sub.post_id
  AND p."answerCount" IS DISTINCT FROM sub.cnt;

-- 公開質問の状態絞り込みと最終アクティビティ順ページングを支援する。
CREATE INDEX IF NOT EXISTS "Post_visible_activity_idx"
ON "Post"("activityAt" DESC, "id" DESC)
WHERE "deletedAt" IS NULL AND "status" IN ('OPEN', 'RESOLVED');

-- タグ・カテゴリー絞り込み時に中間テーブルを tagId 側から探索できるようにする。
CREATE INDEX IF NOT EXISTS "PostTag_tagId_postId_idx"
ON "PostTag"("tagId", "postId");
