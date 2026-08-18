export const HIROBA_TONES = ['yellow', 'blue', 'purple', 'rose', 'lime', 'mint'] as const

export type HirobaTone = (typeof HIROBA_TONES)[number]

export type HirobaCatalogItem = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  tone: HirobaTone
}

type HirobaSection = {
  title: string
  tone: HirobaTone
  items: HirobaCatalogItem[]
}

function item(
  slug: string,
  name: string,
  description: string,
  icon: string,
  tone: HirobaTone,
): HirobaCatalogItem {
  return { id: `hiroba-${slug}`, slug, name, description, icon, tone }
}

export const HIROBA_SECTIONS: HirobaSection[] = [
  {
    title: '迷ったらこれ',
    tone: 'lime',
    items: [
      item(
        'outdoor',
        'アウトドア派',
        '外遊びや自然の楽しみ方を話すひろばです。',
        'mountain',
        'lime',
      ),
      item('indoor', 'インドア派', 'おうち時間の過ごし方を話すひろばです。', 'house', 'lime'),
      item(
        'alcohol',
        'お酒',
        '好きなお酒やおすすめのおつまみを紹介し合うひろばです。',
        'wine',
        'lime',
      ),
      item(
        'strength-training',
        '筋トレ',
        'トレーニングや体づくりを応援し合うひろばです。',
        'dumbbell',
        'lime',
      ),
      item(
        'sauna-onsen',
        'サウナ・温泉',
        'お気に入りのサウナや温泉を語るひろばです。',
        'waves',
        'lime',
      ),
      item('dogs', 'いぬ', '犬のかわいさや暮らしの知恵を共有するひろばです。', 'dog', 'lime'),
      item('cats', 'ねこ', '猫のかわいさや暮らしの知恵を共有するひろばです。', 'cat', 'lime'),
    ],
  },
  {
    title: 'アクティブ・スポーツ',
    tone: 'yellow',
    items: [
      item(
        'yoga-pilates',
        'ヨガ・ピラティス',
        '心と体を整える習慣を話すひろばです。',
        'activity',
        'yellow',
      ),
      item('baseball', '野球', '観戦やプレーの話で盛り上がるひろばです。', 'circle-dot', 'yellow'),
      item('soccer', 'サッカー', '国内外の試合やプレーを語るひろばです。', 'ball', 'yellow'),
      item('camping', 'キャンプ', '道具やキャンプ場の情報を交換するひろばです。', 'tent', 'yellow'),
      item('travel', '旅行', '旅先の思い出やおすすめを共有するひろばです。', 'plane', 'yellow'),
    ],
  },
  {
    title: 'インドア・カルチャー',
    tone: 'blue',
    items: [
      item('manga', '漫画', '好きな作品や新刊を語るひろばです。', 'book', 'blue'),
      item('photography', '写真・カメラ', '撮影や機材について話すひろばです。', 'camera', 'blue'),
      item('cooking', '料理', 'レシピや料理の工夫を共有するひろばです。', 'cooking-pot', 'blue'),
      item('music', '音楽', '好きな曲やライブを語るひろばです。', 'music', 'blue'),
      item('anime', 'アニメ', '今期作品や名作を語るひろばです。', 'play', 'blue'),
      item('drama', 'ドラマ', '国内外のドラマを語るひろばです。', 'clapperboard', 'blue'),
      item('movies', '映画', '新作やお気に入りの映画を語るひろばです。', 'popcorn', 'blue'),
      item('art', 'アート・芸術', '作品や展示の感想を共有するひろばです。', 'palette', 'blue'),
      item('games', 'ゲーム', '遊んでいるゲームや攻略を話すひろばです。', 'gamepad', 'blue'),
    ],
  },
  {
    title: '推し活・愛好家',
    tone: 'rose',
    items: [
      item(
        'two-dimensional',
        '二次元',
        '好きなキャラクターや作品を語るひろばです。',
        'sparkles',
        'rose',
      ),
      item('idols', 'アイドル・有名人', '推しの魅力や活動を応援するひろばです。', 'mic', 'rose'),
    ],
  },
  {
    title: 'ライフスタイル・食',
    tone: 'rose',
    items: [
      item('gourmet', 'グルメ', 'おいしかったお店や一皿を共有するひろばです。', 'utensils', 'rose'),
      item(
        'cafe-sweets',
        'カフェ・スイーツ',
        'お気に入りのカフェや甘いものを紹介するひろばです。',
        'coffee',
        'rose',
      ),
    ],
  },
  {
    title: 'ノウハウ',
    tone: 'mint',
    items: [
      item(
        'life-hacks',
        'ライフハック',
        '毎日を少し便利にする工夫を共有するひろばです。',
        'lightbulb',
        'mint',
      ),
    ],
  },
]

export const HIROBA_CATALOG = HIROBA_SECTIONS.flatMap((section) => section.items)

export function findHiroba(slug: string) {
  return HIROBA_CATALOG.find((hiroba) => hiroba.slug === slug)
}
