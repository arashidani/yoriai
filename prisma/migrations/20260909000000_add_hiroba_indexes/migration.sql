-- ひろば詳細のフィード取得（hirobaId 絞り込み + updatedAt 降順）を支援する。
-- HirobaPost には hirobaId の索引が無く、ひろばを開くたびに全件走査していた。
CREATE INDEX IF NOT EXISTS "HirobaPost_visible_feed_idx"
ON "HirobaPost"("hirobaId", "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- 人気の投稿（直近3日の投稿を対象にいいね数上位を返す）の期間絞り込みを支援する。
CREATE INDEX IF NOT EXISTS "HirobaPost_visible_recent_idx"
ON "HirobaPost"("createdAt" DESC)
WHERE "deletedAt" IS NULL;

-- 閲覧者のいいね・保存状態を userId 側から引けるようにする。
-- 既存の一意制約は (hirobaPostId, userId) 順のため、userId 先頭の探索に使えない。
CREATE INDEX IF NOT EXISTS "HirobaPostLike_userId_hirobaPostId_idx"
ON "HirobaPostLike"("userId", "hirobaPostId");

CREATE INDEX IF NOT EXISTS "HirobaPostBookmark_userId_hirobaPostId_idx"
ON "HirobaPostBookmark"("userId", "hirobaPostId");
