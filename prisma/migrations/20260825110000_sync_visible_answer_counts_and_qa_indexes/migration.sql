-- answerCount は画面に表示する公開回答（isHidden = false）の件数に揃える。
UPDATE "Post" AS p
SET "answerCount" = (
  SELECT COUNT(*)::int
  FROM "Answer" AS a
  WHERE a."postId" = p.id
    AND a."isHidden" = false
);

UPDATE "HirobaPost" AS p
SET "answerCount" = (
  SELECT COUNT(*)::int
  FROM "HirobaAnswer" AS a
  WHERE a."hirobaPostId" = p.id
    AND a."isHidden" = false
);

-- 公開質問の状態絞り込みと最終アクティビティ順ページングを支援する。
CREATE INDEX "Post_deletedAt_status_activityAt_id_idx"
ON "Post"("deletedAt", "status", "activityAt", "id");

-- タグ・カテゴリー絞り込み時に中間テーブルを tagId 側から探索できるようにする。
CREATE INDEX "PostTag_tagId_postId_idx"
ON "PostTag"("tagId", "postId");
