import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })
config()

import { requireEnv } from '@/lib/env'

const require = createRequire(import.meta.url)
const prismaPackageJsonPath = require.resolve('prisma/package.json')
const { bin } = require(prismaPackageJsonPath) as { bin: { prisma: string } }
const prismaCli = join(dirname(prismaPackageJsonPath), bin.prisma)

function runPrisma(...args: string[]) {
  execFileSync(process.execPath, [prismaCli, ...args], { stdio: 'inherit' })
}

const RESET_PHASES = {
  GENERATE: 'prisma generate',
  BACKUP: 'profile options backup',
  MIGRATE_RESET: 'prisma migrate reset',
  RESTORE: 'profile options restore',
  SUPER_ADMIN: 'super admin provisioning',
} as const

type ResetPhase = (typeof RESET_PHASES)[keyof typeof RESET_PHASES]

const PHASE_RECOVERY: Record<ResetPhase, string> = {
  [RESET_PHASES.GENERATE]:
    'schema.prisma と prisma.config.ts を確認し、`npx prisma generate` を単体で実行して原因を切り分けてください。',
  [RESET_PHASES.BACKUP]:
    'DATABASE_URL の接続と DB の稼働を確認してください。この段階ではまだ migrate reset は実行されていません。',
  [RESET_PHASES.MIGRATE_RESET]:
    'DIRECT_URL の接続、マイグレーション履歴、shadow database を確認してください。DB は中途半端な状態の可能性があります。修正後に `npm run db:reset -- --confirm-reset` を再実行してください。',
  [RESET_PHASES.RESTORE]:
    'migrate reset は完了しています。マイグレーション由来のマスターは入っているはずです。接続を確認して再実行してください。',
  [RESET_PHASES.SUPER_ADMIN]:
    'Supabase Auth と Prisma の整合性を確認してください。Auth だけ先に進んでいる場合はログのロールバック結果を参照し、必要なら Supabase ダッシュボードで Super Admin を手動整理してから再実行してください。',
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message
  return String(error)
}

async function runPhase<T>(phase: ResetPhase, fn: () => T | Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`\n[reset-db] FAILED at phase: ${phase}`)
    console.error(`[reset-db] ${formatError(error)}`)
    console.error(`[reset-db] Recovery: ${PHASE_RECOVERY[phase]}`)
    throw error
  }
}

const CONFIRMATION_FLAG = '--confirm-reset'
const SUPER_ADMIN_EMAIL = 'superadmin@yoriai.dev'
const SUPER_ADMIN_PASSWORD = requireEnv('SUPER_ADMIN_PASSWORD')
const SUPER_ADMIN_NAME = 'Super Admin'
const SUPER_ADMIN_USER_METADATA = { name: SUPER_ADMIN_NAME }
let disconnectPrisma: (() => Promise<void>) | undefined

if (!process.argv.includes(CONFIRMATION_FLAG)) {
  throw new Error(`Refusing to reset the database without ${CONFIRMATION_FLAG}`)
}
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to reset the database while NODE_ENV=production')
}

async function findAuthUserByEmail(
  email: string,
  createSupabaseAdminClient: typeof import('@/lib/supabase/admin').createSupabaseAdminClient,
) {
  const supabase = createSupabaseAdminClient()

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    )
    if (user || data.users.length < 1000) return { supabase, user }
  }
}

async function provisionSuperAdmin(
  prisma: ReturnType<typeof import('@/lib/prisma/create-client').createPrismaClient>,
  createSupabaseAdminClient: typeof import('@/lib/supabase/admin').createSupabaseAdminClient,
) {
  console.log('Provisioning Super Admin (Supabase Auth + Prisma User)...')

  const { supabase, user: existingAuthUser } = await findAuthUserByEmail(
    SUPER_ADMIN_EMAIL,
    createSupabaseAdminClient,
  )
  const createdNewAuthUser = !existingAuthUser

  const authUser = existingAuthUser
    ? await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password: SUPER_ADMIN_PASSWORD,
        app_metadata: { ...existingAuthUser.app_metadata, role: 'ADMIN' },
        user_metadata: { ...existingAuthUser.user_metadata, ...SUPER_ADMIN_USER_METADATA },
      })
    : await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        app_metadata: { role: 'ADMIN' },
        user_metadata: SUPER_ADMIN_USER_METADATA,
      })

  if (authUser.error) throw authUser.error

  const superAdminData = {
    supabaseId: authUser.data.user.id,
    email: SUPER_ADMIN_EMAIL,
    username: '管理者',
    name: SUPER_ADMIN_NAME,
    role: 'ADMIN' as const,
    onboardingCompletedAt: new Date(),
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: SUPER_ADMIN_EMAIL },
        create: superAdminData,
        update: superAdminData,
      })
      const featureTesting = await tx.hiroba.findUniqueOrThrow({
        where: { slug: 'feature-testing' },
      })
      await tx.hirobaMembership.upsert({
        where: { userId_hirobaId: { userId: user.id, hirobaId: featureTesting.id } },
        create: { userId: user.id, hirobaId: featureTesting.id },
        update: {},
      })
    })
  } catch (error) {
    if (createdNewAuthUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.data.user.id)
      if (deleteError) {
        console.error(
          `[reset-db] Prisma User の作成に失敗し、Auth ユーザーのロールバックにも失敗しました: ${deleteError.message}`,
        )
        console.error(
          `[reset-db] Supabase Auth に孤立した Super Admin (${SUPER_ADMIN_EMAIL}) が残っています。手動で削除してください。`,
        )
      } else {
        console.error(
          '[reset-db] Prisma User の作成に失敗したため、新規作成した Supabase Auth ユーザーを削除しました。',
        )
      }
    } else {
      console.error(
        '[reset-db] Prisma User の作成に失敗しました。Supabase Auth のパスワード更新はロールバックしていません。',
      )
    }
    throw error
  }
}

async function main() {
  await runPhase(RESET_PHASES.GENERATE, () => {
    runPrisma('generate')
  })

  const [{ createPrismaClient }, { createSupabaseAdminClient }] = await Promise.all([
    import('@/lib/prisma/create-client'),
    import('@/lib/supabase/admin'),
  ])

  const [departments, businessAreas, businessSkills, interests] = await runPhase(
    RESET_PHASES.BACKUP,
    async () => {
      console.log('Backing up profile options...')
      const backupClient = createPrismaClient()
      try {
        return await Promise.all([
          backupClient.department.findMany(),
          backupClient.businessArea.findMany(),
          backupClient.businessSkill.findMany(),
          backupClient.interest.findMany(),
        ])
      } finally {
        await backupClient.$disconnect()
      }
    },
  )

  await runPhase(RESET_PHASES.MIGRATE_RESET, () => {
    console.log('Running prisma migrate reset...')
    runPrisma('migrate', 'reset', '--force')
  })

  const prisma = createPrismaClient()
  disconnectPrisma = () => prisma.$disconnect()

  await runPhase(RESET_PHASES.RESTORE, async () => {
    console.log('Restoring profile options...')
    const profileOptionWrites = [
      ...departments.map((option) =>
        prisma.department.upsert({
          where: { name: option.name },
          update: { isActive: option.isActive, sortOrder: option.sortOrder },
          create: option,
        }),
      ),
      ...businessAreas.map((option) =>
        prisma.businessArea.upsert({
          where: { name: option.name },
          update: { isActive: option.isActive, sortOrder: option.sortOrder },
          create: option,
        }),
      ),
      ...businessSkills.map((option) =>
        prisma.businessSkill.upsert({
          where: { name: option.name },
          update: { isActive: option.isActive, sortOrder: option.sortOrder },
          create: option,
        }),
      ),
      ...interests.map((option) =>
        prisma.interest.upsert({
          where: { name: option.name },
          update: { isActive: option.isActive, sortOrder: option.sortOrder },
          create: option,
        }),
      ),
    ]
    if (profileOptionWrites.length > 0) {
      await prisma.$transaction(profileOptionWrites)
    }
  })

  await runPhase(RESET_PHASES.SUPER_ADMIN, () =>
    provisionSuperAdmin(prisma, createSupabaseAdminClient),
  )

  console.log(`Database reset complete. Super admin: ${SUPER_ADMIN_EMAIL}`)
}

void main()
  .catch(() => {
    process.exitCode = 1
  })
  .finally(() => disconnectPrisma?.())
