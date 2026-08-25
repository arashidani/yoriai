ALTER TABLE "Post" ADD COLUMN "bookmarkCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Post"
SET "bookmarkCount" = (
  SELECT COUNT(*)::INTEGER
  FROM "PostBookmark"
  WHERE "PostBookmark"."postId" = "Post"."id"
);
