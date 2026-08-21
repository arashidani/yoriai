INSERT INTO "Hiroba" ("id", "slug", "name", "description", "createdAt")
VALUES (
  'hiroba-company-events',
  'company-events',
  '社内イベント',
  '社内イベントの情報や感想を共有するひろばです。',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";
