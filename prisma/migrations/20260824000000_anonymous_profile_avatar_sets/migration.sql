-- Preserve existing avatar URLs as the first avatar in each ordered set.
ALTER TABLE "AnonymousProfile"
ADD COLUMN "avatarUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "AnonymousProfile"
SET "avatarUrls" = ARRAY["avatarUrl"];

ALTER TABLE "AnonymousProfile" DROP COLUMN "avatarUrl";

-- Allow an anonymous profile to repeat after every active profile has been used.
ALTER TABLE "PostAnonymousProfile"
ADD COLUMN "aliasNumber" INTEGER NOT NULL DEFAULT 1;

DROP INDEX "PostAnonymousProfile_postId_anonymousProfileId_key";

CREATE UNIQUE INDEX "PostAnonymousProfile_postId_anonymousProfileId_aliasNumber_key"
ON "PostAnonymousProfile"("postId", "anonymousProfileId", "aliasNumber");
