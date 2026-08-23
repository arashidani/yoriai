-- AlterTable
ALTER TABLE "Post" ADD COLUMN "activityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill with the newer of the question creation time and latest answer creation time.
UPDATE "Post" AS p
SET "activityAt" = GREATEST(
  p."createdAt",
  COALESCE(
    (SELECT MAX(a."createdAt") FROM "Answer" AS a WHERE a."postId" = p.id),
    p."createdAt"
  )
);

-- CreateIndex
CREATE INDEX "Post_activityAt_id_idx" ON "Post"("activityAt", "id");
