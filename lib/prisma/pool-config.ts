import type { PoolConfig } from 'pg'

/**
 * 1 インスタンスあたりの接続プール上限のデフォルト値。
 *
 * 根拠:
 * - Vercel のサーバーレス関数はインスタンスごとに独立したプールを持つため、
 *   DB への同時接続数は「同時に生きているインスタンス数 N × max」になる。
 * - Supabase の直接接続 (5432) の `max_connections` は Small インスタンスで 60 前後、
 *   うち数本は Supabase 自身の管理用に予約されている。実質 50 本として
 *   `3 × N ≦ 50` → N ≦ 16 インスタンスまで耐える。
 * - Supavisor の transaction pooler (6543) はクライアント接続の上限がこれより桁で大きく、
 *   3 でも上限に当たらない。
 * - 1 本だとインスタンス内の並列リクエストが直列化し、Like / Bookmark のような
 *   短いクエリでも待ち行列ができる。3 本は「待ちを作らない最小値」として置いている。
 *
 * 実際の `max_connections` はプランと Compute サイズで変わるので、
 * プランを変えたときは Supabase ダッシュボード → Settings → Database の値と
 * 突き合わせて `DATABASE_POOL_MAX` で上書きする。
 */
export const DEFAULT_POOL_MAX = 3

/** 空きコネクションを保持する時間。pg のデフォルトと同値だが、意図を明示するために書いている。 */
export const IDLE_TIMEOUT_MS = 10_000

/**
 * プールが飽和したときに待つ上限。
 * pg のデフォルトは 0（無制限）で、上限に当たるとリクエストがハングしたまま返らない。
 * 有限値にして「遅い」ではなく「失敗した」として観測できるようにする。
 */
export const CONNECTION_TIMEOUT_MS = 10_000

export type ConnectionTargetKind = 'transaction-pooler' | 'session-pooler' | 'direct' | 'unknown'

export type ConnectionTarget = {
  kind: ConnectionTargetKind
  /** ログに出す用。接続文字列そのものは秘匿情報なので持たせない。 */
  port: number | null
}

const POSTGRES_DEFAULT_PORT = 5432
const SUPABASE_TRANSACTION_POOLER_PORT = 6543

/**
 * 接続文字列が Supabase のどの入口を指しているかを判定する。
 *
 * - `*.pooler.supabase.com:6543` … Supavisor transaction mode
 * - `*.pooler.supabase.com:5432` … Supavisor session mode
 * - `db.*.supabase.co:5432`      … 直接接続
 */
export function describeConnectionTarget(connectionString: string): ConnectionTarget {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    return { kind: 'unknown', port: null }
  }

  const port = url.port ? Number(url.port) : POSTGRES_DEFAULT_PORT
  const host = url.hostname.toLowerCase()

  if (host.endsWith('.pooler.supabase.com')) {
    return {
      kind: port === SUPABASE_TRANSACTION_POOLER_PORT ? 'transaction-pooler' : 'session-pooler',
      port,
    }
  }

  if (host.endsWith('.supabase.co') || host.endsWith('.supabase.com')) {
    return { kind: 'direct', port }
  }

  return { kind: 'unknown', port }
}

/**
 * `DATABASE_POOL_MAX` を読む。未設定・数値でない・1 未満の場合はデフォルトへ落とす。
 */
export function resolvePoolMax(rawValue: string | undefined): number {
  if (rawValue === undefined || rawValue.trim() === '') {
    return DEFAULT_POOL_MAX
  }

  const parsed = Number(rawValue)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_POOL_MAX
  }

  return parsed
}

export function buildPoolConfig(connectionString: string, poolMaxEnv?: string): PoolConfig {
  return {
    connectionString,
    max: resolvePoolMax(poolMaxEnv),
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  }
}

/**
 * 直接接続 (5432) のままサーバーレスへ載っている場合に警告を返す。
 * 返り値が null なら何も出さない。
 */
export function poolTargetWarning(target: ConnectionTarget): string | null {
  if (target.kind !== 'direct') {
    return null
  }

  return `[prisma] DATABASE_URL が Supabase の直接接続 (port ${target.port}) を指している。サーバーレス環境では接続数と接続確立レイテンシの両方で不利になるため、Connect → ORMs → Prisma の transaction pooler (6543) を使うこと。`
}
