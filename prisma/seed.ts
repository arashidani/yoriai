import { prisma } from '@/lib/prisma/client'

/**
 * 仮の匿名キャラ一覧。実際の表示名・アイコンは未確定なのでプレースホルダー。
 * 本番導入前に、実際のデザイン・コピーで置き換えること。
 */
const ANONYMOUS_PROFILES = [
  { displayName: 'ねこ', avatarUrls: ['/anonymous-profiles/cat.svg'] },
  { displayName: 'いぬ', avatarUrls: ['/anonymous-profiles/dog.svg'] },
  { displayName: 'うさぎ', avatarUrls: ['/anonymous-profiles/rabbit.svg'] },
  { displayName: 'きつね', avatarUrls: ['/anonymous-profiles/fox.svg'] },
  { displayName: 'ぱんだ', avatarUrls: ['/anonymous-profiles/panda.svg'] },
  { displayName: 'くま', avatarUrls: ['/anonymous-profiles/bear.svg'] },
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
