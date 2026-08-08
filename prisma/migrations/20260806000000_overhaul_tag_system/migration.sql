-- AddColumns
ALTER TABLE "Tag"
ADD COLUMN "category" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "isWorkTag" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the existing tags' QA behavior while requiring explicit opt-in for new tags.
UPDATE "Tag"
SET "category" = "name",
    "isWorkTag" = true;

-- Make category required after existing rows have been backfilled.
ALTER TABLE "Tag"
ALTER COLUMN "category" SET NOT NULL;
