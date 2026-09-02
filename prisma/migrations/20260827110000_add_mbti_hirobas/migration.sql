-- Add one viewable hiroba per MBTI color and enroll existing users in their selected group.
INSERT INTO "Hiroba" ("id", "slug", "name", "description", "createdAt")
VALUES
  ('hiroba-mbti-green', 'mbti-green', '緑の人の広場', 'MBTIが緑グループの人のためのひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-mbti-yellow', 'mbti-yellow', '黄色の人の広場', 'MBTIが黄色グループの人のためのひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-mbti-blue', 'mbti-blue', '青の人の広場', 'MBTIが青グループの人のためのひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-mbti-purple', 'mbti-purple', '紫の人の広場', 'MBTIが紫グループの人のためのひろばです。', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "HirobaMembership" ("userId", "hirobaId", "createdAt")
SELECT "User"."id", "Hiroba"."id", CURRENT_TIMESTAMP
FROM "User"
JOIN "Hiroba" ON "Hiroba"."slug" = CASE "User"."displayNameColor"
  WHEN 'GREEN' THEN 'mbti-green'
  WHEN 'YELLOW' THEN 'mbti-yellow'
  WHEN 'BLUE' THEN 'mbti-blue'
  WHEN 'PURPLE' THEN 'mbti-purple'
END
WHERE "User"."displayNameColor" IN ('GREEN', 'YELLOW', 'BLUE', 'PURPLE')
ON CONFLICT ("userId", "hirobaId") DO NOTHING;
