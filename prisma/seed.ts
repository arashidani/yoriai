import { prisma } from '@/lib/prisma/client'

/**
 * 仮の匿名キャラ一覧。実際の表示名・アイコンは未確定なのでプレースホルダー。
 * 本番導入前に、実際のデザイン・コピーで置き換えること。
 */
const ANONYMOUS_PROFILES = [
  { displayName: 'ねこ', avatarUrl: '/anonymous-profiles/cat.svg' },
  { displayName: 'いぬ', avatarUrl: '/anonymous-profiles/dog.svg' },
  { displayName: 'うさぎ', avatarUrl: '/anonymous-profiles/rabbit.svg' },
  { displayName: 'きつね', avatarUrl: '/anonymous-profiles/fox.svg' },
  { displayName: 'ぱんだ', avatarUrl: '/anonymous-profiles/panda.svg' },
  { displayName: 'くま', avatarUrl: '/anonymous-profiles/bear.svg' },
]

async function main() {
  for (const profile of ANONYMOUS_PROFILES) {
    await prisma.anonymousProfile.upsert({
      where: { displayName: profile.displayName },
      update: {},
      create: profile,
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
