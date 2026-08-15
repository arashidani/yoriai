-- 回答が付いても質問は解決済みになるまでOPENのままとする。
ALTER TYPE "QuestionStatus" RENAME TO "QuestionStatus_old";

CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'RESOLVED', 'HIDDEN');

ALTER TABLE "Post" ALTER COLUMN "status" DROP DEFAULT;

UPDATE "Post"
SET "status" = 'OPEN'
WHERE "status" = 'ANSWERED';

ALTER TABLE "Post"
ALTER COLUMN "status" TYPE "QuestionStatus"
USING ("status"::text::"QuestionStatus");

ALTER TABLE "Post" ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "QuestionStatus_old";
