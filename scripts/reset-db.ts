import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const CONFIRMATION_FLAG = '--confirm-reset'
const SUPER_ADMIN_EMAIL = 'superadmin@yoriai.dev'
const SUPER_ADMIN_PASSWORD = '__REDACTED__'
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

async function main() {
  const prismaCli = resolve('node_modules/prisma/build/index.js')
  execFileSync(process.execPath, [prismaCli, 'generate'], { stdio: 'inherit' })

  const [{ prisma }, { createSupabaseAdminClient }] = await Promise.all([
    import('@/lib/prisma/client'),
    import('@/lib/supabase/admin'),
  ])
  disconnectPrisma = () => prisma.$disconnect()

  const [departments, businessAreas, businessSkills, interests] = await Promise.all([
    prisma.department.findMany(),
    prisma.businessArea.findMany(),
    prisma.businessSkill.findMany(),
    prisma.interest.findMany(),
  ])

  execFileSync(process.execPath, [prismaCli, 'migrate', 'reset', '--force'], {
    stdio: 'inherit',
  })
  execFileSync(process.execPath, [prismaCli, 'generate'], { stdio: 'inherit' })

  await prisma.$transaction([
    prisma.anonymousProfile.create({
      data: {
        displayName: 'プレースホルダー',
        avatarUrls: ['/anonymous-profiles/cat.svg'],
      },
    }),
    prisma.tagCategory.create({ data: { name: 'プレースホルダー' } }),
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
  ])

  await prisma.tag.create({
    data: {
      name: 'プレースホルダー',
      category: 'プレースホルダー',
      description: 'データベースリセット後の初期タグです。',
    },
  })

  const { supabase, user: existingAuthUser } = await findAuthUserByEmail(
    SUPER_ADMIN_EMAIL,
    createSupabaseAdminClient,
  )
  const authUser = existingAuthUser
    ? await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password: SUPER_ADMIN_PASSWORD,
        app_metadata: { ...existingAuthUser.app_metadata, role: 'ADMIN' },
      })
    : await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        app_metadata: { role: 'ADMIN' },
      })

  if (authUser.error) throw authUser.error

  await prisma.user.create({
    data: {
      supabaseId: authUser.data.user.id,
      email: SUPER_ADMIN_EMAIL,
      username: SUPER_ADMIN_EMAIL,
      name: 'Super Admin',
      role: 'ADMIN',
      onboardingCompletedAt: new Date(),
      hirobaMemberships: {
        create: { hiroba: { connect: { slug: 'feature-testing' } } },
      },
    },
  })

  console.log(`Database reset complete. Super admin: ${SUPER_ADMIN_EMAIL}`)
}

void main().finally(() => disconnectPrisma?.())
