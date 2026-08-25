import { expect, it, vi } from 'vitest'

const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }))

vi.mock('next/server', () => ({ after: afterMock }))

import { scheduleAfterResponse } from '@/lib/hono/after-response'

it('Next.jsのafterへ処理を登録する', () => {
  const task = vi.fn()

  scheduleAfterResponse(task)

  expect(afterMock).toHaveBeenCalledWith(task)
})
