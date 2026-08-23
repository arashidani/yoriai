-- 「その他」はQ&Aの手動選択・AI自動付与の両方で使用する。
UPDATE "Tag"
SET "isWorkTag" = true
WHERE "name" = 'その他（雑談に近い質問）';
