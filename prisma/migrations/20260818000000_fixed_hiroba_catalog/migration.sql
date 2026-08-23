-- Seed the fixed Hiroba catalog. Existing legacy hirobas are intentionally preserved
-- so this data-only migration never cascades into deleting posts or answers.
INSERT INTO "Hiroba" ("id", "slug", "name", "description", "createdAt")
VALUES
  ('hiroba-outdoor', 'outdoor', 'アウトドア派', '外遊びや自然の楽しみ方を話すひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-indoor', 'indoor', 'インドア派', 'おうち時間の過ごし方を話すひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-alcohol', 'alcohol', 'お酒', '好きなお酒やおすすめのおつまみを紹介し合うひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-strength-training', 'strength-training', '筋トレ', 'トレーニングや体づくりを応援し合うひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-sauna-onsen', 'sauna-onsen', 'サウナ・温泉', 'お気に入りのサウナや温泉を語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-dogs', 'dogs', 'いぬ', '犬のかわいさや暮らしの知恵を共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-cats', 'cats', 'ねこ', '猫のかわいさや暮らしの知恵を共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-yoga-pilates', 'yoga-pilates', 'ヨガ・ピラティス', '心と体を整える習慣を話すひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-baseball', 'baseball', '野球', '観戦やプレーの話で盛り上がるひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-soccer', 'soccer', 'サッカー', '国内外の試合やプレーを語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-camping', 'camping', 'キャンプ', '道具やキャンプ場の情報を交換するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-travel', 'travel', '旅行', '旅先の思い出やおすすめを共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-manga', 'manga', '漫画', '好きな作品や新刊を語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-photography', 'photography', '写真・カメラ', '撮影や機材について話すひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-cooking', 'cooking', '料理', 'レシピや料理の工夫を共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-music', 'music', '音楽', '好きな曲やライブを語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-anime', 'anime', 'アニメ', '今期作品や名作を語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-drama', 'drama', 'ドラマ', '国内外のドラマを語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-movies', 'movies', '映画', '新作やお気に入りの映画を語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-art', 'art', 'アート・芸術', '作品や展示の感想を共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-games', 'games', 'ゲーム', '遊んでいるゲームや攻略を話すひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-two-dimensional', 'two-dimensional', '二次元', '好きなキャラクターや作品を語るひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-idols', 'idols', 'アイドル・有名人', '推しの魅力や活動を応援するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-gourmet', 'gourmet', 'グルメ', 'おいしかったお店や一皿を共有するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-cafe-sweets', 'cafe-sweets', 'カフェ・スイーツ', 'お気に入りのカフェや甘いものを紹介するひろばです。', CURRENT_TIMESTAMP),
  ('hiroba-life-hacks', 'life-hacks', 'ライフハック', '毎日を少し便利にする工夫を共有するひろばです。', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";
