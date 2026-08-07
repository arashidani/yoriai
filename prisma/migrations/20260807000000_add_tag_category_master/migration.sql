-- CreateTable
CREATE TABLE "TagCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagCategory_pkey" PRIMARY KEY ("id")
);

-- Preserve all existing category values as managed categories.
INSERT INTO "TagCategory" ("id", "name")
SELECT md5('tag-category:' || "category"), "category"
FROM "Tag"
GROUP BY "category";

-- CreateIndex
CREATE UNIQUE INDEX "TagCategory_name_key" ON "TagCategory"("name");

-- AddForeignKey
ALTER TABLE "Tag"
ADD CONSTRAINT "Tag_category_fkey"
FOREIGN KEY ("category") REFERENCES "TagCategory"("name")
ON DELETE RESTRICT ON UPDATE CASCADE;
