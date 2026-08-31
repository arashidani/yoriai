INSERT INTO "Hiroba" ("id", "slug", "name", "description", "createdAt")
VALUES (
  'hiroba-lunch',
  'lunch',
  'ランチ',
  'おすすめのランチや一緒に食べる仲間を探すひろばです。',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";
