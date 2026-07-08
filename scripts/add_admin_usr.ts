import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only, never expose client-side
)

async function main() {
  const [email, password] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: tsx scripts/create-admin.ts <email> <password>')
    process.exit(1)
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'ADMIN' }, // <- mirrored role for middleware
  })
  if (error) throw error

  await prisma.user.create({
    data: { supabaseId: data.user.id, email, role: 'ADMIN' },
  })

  console.log('Admin created:', email)
}

main().finally(() => prisma.$disconnect())