-- AlterTable
ALTER TABLE "TagCategory" ADD COLUMN "businessSkillId" TEXT;

-- Preserve an existing same-name relationship when one already exists.
UPDATE "TagCategory" AS category
SET "businessSkillId" = skill."id"
FROM "BusinessSkill" AS skill
WHERE category."name" = skill."name";

-- CreateIndex
CREATE INDEX "TagCategory_businessSkillId_idx" ON "TagCategory"("businessSkillId");

-- AddForeignKey
ALTER TABLE "TagCategory"
ADD CONSTRAINT "TagCategory_businessSkillId_fkey"
FOREIGN KEY ("businessSkillId") REFERENCES "BusinessSkill"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
