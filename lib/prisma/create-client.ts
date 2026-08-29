import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/app/generated/prisma/client'
import { requireEnv } from '@/lib/env'

export function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: requireEnv('DATABASE_URL') })
  return new PrismaClient({ adapter })
}
