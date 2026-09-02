-- Add the service-wide feature-testing hiroba and enroll every existing user.
INSERT INTO "Hiroba" ("id", "slug", "name", "description", "createdAt")
VALUES (
  'hiroba-feature-testing',
  'feature-testing',
  '機能たしかめ広場',
  '新しい機能を気軽に試して、感想や気づきを共有するひろばです。',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

INSERT INTO "HirobaMembership" ("userId", "hirobaId", "createdAt")
SELECT "User"."id", "Hiroba"."id", CURRENT_TIMESTAMP
FROM "User"
JOIN "Hiroba" ON "Hiroba"."slug" = 'feature-testing'
ON CONFLICT ("userId", "hirobaId") DO NOTHING;
