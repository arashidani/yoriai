import type { SquareIconName } from '@/components/design-system/ui/square-icons'

export const HIROBA_CATEGORIES = [
  'pickup',
  'active',
  'indoor',
  'maniac',
  'food',
  'knowhow',
  'mbtiGreen',
  'mbtiBlue',
  'mbtiYellow',
  'mbtiPurple',
] as const

export type HirobaCategory = (typeof HIROBA_CATEGORIES)[number]

export type HirobaCatalogItem = {
  id: string
  slug: string
  name: string
  description: string
  icon: SquareIconName
  category: HirobaCategory
}

export const DEFAULT_HIROBA_SLUGS = ['feature-testing'] as const

export function isDefaultHiroba(slug: string) {
  return (DEFAULT_HIROBA_SLUGS as readonly string[]).includes(slug)
}

type HirobaSection = {
  title: string
  category: HirobaCategory
  items: HirobaCatalogItem[]
}

function item(
  slug: string,
  name: string,
  description: string,
  icon: SquareIconName,
  category: HirobaCategory,
): HirobaCatalogItem {
  return { id: `hiroba-${slug}`, slug, name, description, icon, category }
}

export const PICKUP_SECTION: HirobaSection = {
  title: '迷ったらこれ',
  category: 'pickup',
  items: [
    item(
      'feature-testing',
      '機能たしかめ広場',
      '新しい機能を気軽に試して、感想や気づきを共有するひろばです。',
      'tutorial',
      'pickup',
    ),
    item(
      'outdoor',
      'アウトドア派',
      '外遊びや自然の楽しみ方を話すひろばです。',
      'mountain',
      'pickup',
    ),
    item('indoor', 'インドア派', 'おうち時間の過ごし方を話すひろばです。', 'house', 'pickup'),
    item(
      'alcohol',
      'お酒',
      '好きなお酒やおすすめのおつまみを紹介し合うひろばです。',
      'alcohol',
      'pickup',
    ),
    item(
      'strength-training',
      '筋トレ',
      'トレーニングや体づくりを応援し合うひろばです。',
      'dumbbell',
      'pickup',
    ),
    item(
      'sauna-onsen',
      'サウナ・温泉',
      'お気に入りのサウナや温泉を語るひろばです。',
      'hotSpring',
      'pickup',
    ),
    item('dogs', 'いぬ', '犬のかわいさや暮らしの知恵を共有するひろばです。', 'dog', 'pickup'),
    item('cats', 'ねこ', '猫のかわいさや暮らしの知恵を共有するひろばです。', 'cat', 'pickup'),
    item(
      'company-events',
      '社内イベント',
      '社内イベントの情報や感想を共有するひろばです。',
      'event',
      'pickup',
    ),
  ],
}

export const LEFT_SECTIONS: HirobaSection[] = [
  {
    title: 'アクティブ・スポーツ',
    category: 'active',
    items: [
      item(
        'yoga-pilates',
        'ヨガ・ピラティス',
        '心と体を整える習慣を話すひろばです。',
        'yoga',
        'active',
      ),
      item('baseball', '野球', '観戦やプレーの話で盛り上がるひろばです。', 'baseball', 'active'),
      item('soccer', 'サッカー', '国内外の試合やプレーを語るひろばです。', 'soccer', 'active'),
      item('camping', 'キャンプ', '道具やキャンプ場の情報を交換するひろばです。', 'camp', 'active'),
      item('travel', '旅行', '旅先の思い出やおすすめを共有するひろばです。', 'travel', 'active'),
    ],
  },
  {
    title: 'インドア・カルチャー',
    category: 'indoor',
    items: [
      item('manga', '漫画', '好きな作品や新刊を語るひろばです。', 'comic', 'indoor'),
      item('photography', '写真・カメラ', '撮影や機材について話すひろばです。', 'camera', 'indoor'),
      item('cooking', '料理', 'レシピや料理の工夫を共有するひろばです。', 'cook', 'indoor'),
      item('music', '音楽', '好きな曲やライブを語るひろばです。', 'music', 'indoor'),
      // TODO: Figmaにアニメ専用イラストが追加され次第、dramaから差し替える
      item('anime', 'アニメ', '今期作品や名作を語るひろばです。', 'drama', 'indoor'),
      item('drama', 'ドラマ', '国内外のドラマを語るひろばです。', 'drama', 'indoor'),
      item('movies', '映画', '新作やお気に入りの映画を語るひろばです。', 'popcorn', 'indoor'),
      item('art', 'アート・芸術', '作品や展示の感想を共有するひろばです。', 'art', 'indoor'),
      item('games', 'ゲーム', '遊んでいるゲームや攻略を話すひろばです。', 'game', 'indoor'),
    ],
  },
]

export const RIGHT_SECTIONS: HirobaSection[] = [
  {
    title: '推し活・愛好家',
    category: 'maniac',
    items: [
      item(
        'two-dimensional',
        '二次元',
        '好きなキャラクターや作品を語るひろばです。',
        'twoD',
        'maniac',
      ),
      item('idols', 'アイドル・有名人', '推しの魅力や活動を応援するひろばです。', 'idol', 'maniac'),
    ],
  },
  {
    title: 'ライフスタイル・食',
    category: 'food',
    items: [
      item('gourmet', 'グルメ', 'おいしかったお店や一皿を共有するひろばです。', 'food', 'food'),
      item(
        'cafe-sweets',
        'カフェ・スイーツ',
        'お気に入りのカフェや甘いものを紹介するひろばです。',
        'cafe',
        'food',
      ),
    ],
  },
  {
    title: 'ノウハウ',
    category: 'knowhow',
    items: [
      item(
        'life-hacks',
        'ライフハック',
        '毎日を少し便利にする工夫を共有するひろばです。',
        'knowhow',
        'knowhow',
      ),
    ],
  },
]

export const HIROBA_SECTIONS: HirobaSection[] = [
  PICKUP_SECTION,
  ...LEFT_SECTIONS,
  ...RIGHT_SECTIONS,
]

export const HIROBA_CATALOG = HIROBA_SECTIONS.flatMap((section) => section.items)

export function findHiroba(slug: string) {
  return HIROBA_CATALOG.find((hiroba) => hiroba.slug === slug)
}
