import { describe, expect, it } from 'vitest'
import {
  buildPoolConfig,
  CONNECTION_TIMEOUT_MS,
  DEFAULT_POOL_MAX,
  describeConnectionTarget,
  IDLE_TIMEOUT_MS,
  poolTargetWarning,
  resolvePoolMax,
} from '@/lib/prisma/pool-config'

describe('接続先の判定', () => {
  it('6543 の pooler を transaction mode と判定する', () => {
    expect(
      describeConnectionTarget(
        'postgresql://postgres.abcdefg:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ),
    ).toEqual({ kind: 'transaction-pooler', port: 6543 })
  })

  it('5432 の pooler を session mode と判定する', () => {
    expect(
      describeConnectionTarget(
        'postgresql://postgres.abcdefg:pw@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
      ),
    ).toEqual({ kind: 'session-pooler', port: 5432 })
  })

  it('db.*.supabase.co を直接接続と判定する', () => {
    expect(
      describeConnectionTarget('postgresql://postgres:pw@db.abcdefg.supabase.co:5432/postgres'),
    ).toEqual({ kind: 'direct', port: 5432 })
  })

  it('ポート省略時は 5432 として扱う', () => {
    expect(
      describeConnectionTarget('postgresql://postgres:pw@db.abcdefg.supabase.co/postgres'),
    ).toEqual({ kind: 'direct', port: 5432 })
  })

  it('Supabase 以外のホストは unknown にする', () => {
    expect(describeConnectionTarget('postgresql://postgres:pw@localhost:5432/yoriai')).toEqual({
      kind: 'unknown',
      port: 5432,
    })
  })

  it('URL として壊れている場合も例外を投げない', () => {
    expect(describeConnectionTarget('not-a-url')).toEqual({ kind: 'unknown', port: null })
  })
})

describe('プール上限の解決', () => {
  it('未設定ならデフォルトを使う', () => {
    expect(resolvePoolMax(undefined)).toBe(DEFAULT_POOL_MAX)
    expect(resolvePoolMax('')).toBe(DEFAULT_POOL_MAX)
    expect(resolvePoolMax('   ')).toBe(DEFAULT_POOL_MAX)
  })

  it('整数ならその値を使う', () => {
    expect(resolvePoolMax('1')).toBe(1)
    expect(resolvePoolMax('10')).toBe(10)
  })

  it('数値でない・1 未満・小数はデフォルトへ落とす', () => {
    expect(resolvePoolMax('abc')).toBe(DEFAULT_POOL_MAX)
    expect(resolvePoolMax('0')).toBe(DEFAULT_POOL_MAX)
    expect(resolvePoolMax('-3')).toBe(DEFAULT_POOL_MAX)
    expect(resolvePoolMax('2.5')).toBe(DEFAULT_POOL_MAX)
  })
})

describe('PoolConfig の組み立て', () => {
  const connectionString =
    'postgresql://postgres.abcdefg:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'

  it('上限とタイムアウトを明示する', () => {
    expect(buildPoolConfig(connectionString)).toEqual({
      connectionString,
      max: DEFAULT_POOL_MAX,
      idleTimeoutMillis: IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    })
  })

  it('環境変数で上限を上書きできる', () => {
    expect(buildPoolConfig(connectionString, '5').max).toBe(5)
  })
})

describe('接続先の警告', () => {
  it('直接接続には警告を返す', () => {
    expect(poolTargetWarning({ kind: 'direct', port: 5432 })).toContain('5432')
  })

  it('pooler と unknown には警告を返さない', () => {
    expect(poolTargetWarning({ kind: 'transaction-pooler', port: 6543 })).toBeNull()
    expect(poolTargetWarning({ kind: 'session-pooler', port: 5432 })).toBeNull()
    expect(poolTargetWarning({ kind: 'unknown', port: 5432 })).toBeNull()
  })
})
