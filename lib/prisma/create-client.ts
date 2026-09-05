import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/app/generated/prisma/client'
import { requireEnv } from '@/lib/env'
import {
  buildPoolConfig,
  describeConnectionTarget,
  poolTargetWarning,
} from '@/lib/prisma/pool-config'

export function createPrismaClient() {
  const connectionString = requireEnv('DATABASE_URL')
  const target = describeConnectionTarget(connectionString)

  if (process.env.NODE_ENV === 'production') {
    const warning = poolTargetWarning(target)
    if (warning) console.warn(warning)
  }

  // `@prisma/adapter-pg` は `statementNameGenerator` を渡さない限り
  // `pg.Client#query()` に `name` を付けない。名前付き prepared statement を作らないので、
  // transaction mode の pooler (6543) でもそのまま動く。`pgbouncer=true` の類は不要。
  // ここに `statementNameGenerator` を足すときは、接続先が session pooler か直接接続で
  // あることを確認すること。
  const adapter = new PrismaPg(buildPoolConfig(connectionString, process.env.DATABASE_POOL_MAX))
  return new PrismaClient({ adapter })
}
