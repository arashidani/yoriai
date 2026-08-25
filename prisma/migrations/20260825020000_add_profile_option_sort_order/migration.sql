-- AlterTable
ALTER TABLE "Department" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BusinessArea" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BusinessSkill" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Interest" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Preserve the current alphabetical order for existing options.
WITH ranked AS (
  SELECT "id", (ROW_NUMBER() OVER (ORDER BY "name", "id") - 1)::INTEGER AS position
  FROM "Department"
)
UPDATE "Department" SET "sortOrder" = ranked.position
FROM ranked WHERE "Department"."id" = ranked."id";

WITH ranked AS (
  SELECT "id", (ROW_NUMBER() OVER (ORDER BY "name", "id") - 1)::INTEGER AS position
  FROM "BusinessArea"
)
UPDATE "BusinessArea" SET "sortOrder" = ranked.position
FROM ranked WHERE "BusinessArea"."id" = ranked."id";

WITH ranked AS (
  SELECT "id", (ROW_NUMBER() OVER (ORDER BY "name", "id") - 1)::INTEGER AS position
  FROM "BusinessSkill"
)
UPDATE "BusinessSkill" SET "sortOrder" = ranked.position
FROM ranked WHERE "BusinessSkill"."id" = ranked."id";

WITH ranked AS (
  SELECT "id", (ROW_NUMBER() OVER (ORDER BY "name", "id") - 1)::INTEGER AS position
  FROM "Interest"
)
UPDATE "Interest" SET "sortOrder" = ranked.position
FROM ranked WHERE "Interest"."id" = ranked."id";
