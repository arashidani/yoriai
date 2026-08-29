import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })
config()

import type { PrismaClient } from '@/app/generated/prisma/client'
import type { createSupabaseAdminClient } from '@/lib/supabase/admin'

const DEFAULT_CSV_PATH = resolve(process.cwd(), 'admins.csv')

const USAGE = `Usage:
  npm run db:add-admins
  npm run db:add-admins -- --file ./admins.csv

Setup:
  1. cp admins.csv.example admins.csv
  2. admins.csv に email,password[,name] を記入（リポジトリにはコミットしない）

CSV format:
  email,password
  email,password,name
  # 行頭 # はコメント。1行目が email で始まる場合はヘッダーとしてスキップする。`

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to create admins while NODE_ENV=production')
}

type AdminInput = {
  email: string
  password: string
  name?: string
}

function defaultNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? 'admin'
  return localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function parseCsvRow(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsv(content: string): AdminInput[] {
  const admins: AdminInput[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const [email, password, name] = parseCsvRow(line)
    if (!email || !password) {
      throw new Error(`email と password が必要です: ${rawLine}`)
    }
    if (email.toLowerCase() === 'email') continue

    if (!email.includes('@')) {
      throw new Error(`Invalid email: ${email}`)
    }

    admins.push({ email, password, name: name || undefined })
  }

  return admins
}

function resolveCsvPath(argv: string[]): string {
  const fileFlagIndex = argv.indexOf('--file')
  if (fileFlagIndex === -1) return DEFAULT_CSV_PATH

  const csvPath = argv[fileFlagIndex + 1]
  if (!csvPath) {
    throw new Error('--file には CSV パスを指定してください')
  }

  return resolve(process.cwd(), csvPath)
}

function loadAdminsFromCsv(csvPath: string): AdminInput[] {
  let content: string
  try {
    content = readFileSync(csvPath, 'utf8')
  } catch {
    throw new Error(
      `CSV が見つかりません: ${csvPath}\n` +
        '`cp admins.csv.example admins.csv` で作成してから実行してください。',
    )
  }

  return parseCsv(content)
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    )
    if (user || data.users.length < 1000) return user
  }
}

async function addAdmin(
  prisma: PrismaClient,
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  { email, password, name }: AdminInput,
) {
  const displayName = name ?? defaultNameFromEmail(email)
  const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email)

  const authResult = existingAuthUser
    ? await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        password,
        app_metadata: { ...existingAuthUser.app_metadata, role: 'ADMIN' },
        user_metadata: { ...existingAuthUser.user_metadata, name: displayName },
      })
    : await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'ADMIN' },
        user_metadata: { name: displayName },
      })
  if (authResult.error) throw authResult.error

  await prisma.user.upsert({
    where: { email },
    create: {
      supabaseId: authResult.data.user.id,
      email,
      name: displayName,
      role: 'ADMIN',
      onboardingCompletedAt: new Date(),
    },
    update: {
      supabaseId: authResult.data.user.id,
      name: displayName,
      role: 'ADMIN',
      onboardingCompletedAt: new Date(),
    },
  })

  console.log(`${existingAuthUser ? 'Admin updated' : 'Admin created'}:`, email)
}

async function main() {
  let admins: AdminInput[]
  try {
    const csvPath = resolveCsvPath(process.argv.slice(2))
    admins = loadAdminsFromCsv(csvPath)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    console.error(`\n${USAGE}`)
    process.exit(1)
  }

  if (admins.length === 0) {
    console.error('作成対象の管理者がありません。CSV に行を追加してください。')
    console.error(`\n${USAGE}`)
    process.exit(1)
  }

  const [{ createPrismaClient }, { createSupabaseAdminClient }] = await Promise.all([
    import('@/lib/prisma/create-client'),
    import('@/lib/supabase/admin'),
  ])
  const prisma = createPrismaClient()
  const supabaseAdmin = createSupabaseAdminClient()

  try {
    for (const admin of admins) {
      await addAdmin(prisma, supabaseAdmin, admin)
    }
  } finally {
    await prisma.$disconnect()
  }
}

void main()
