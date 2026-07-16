import { prisma } from '../lib/prisma/client'
import { createSupabaseAdminClient } from '../lib/supabase/admin'

const supabaseAdmin = createSupabaseAdminClient()

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

void main().finally(() => prisma.$disconnect())
