import { describe, expect, it } from 'vitest'
import { createTagSchema } from '@/lib/schemas/tag'

const validTag = {
  name: '給与',
  category: '人事',
  description: '給与計算に関する投稿',
  isWorkTag: false,
}

describe('createTagSchema', () => {
  it('タグの管理項目を受け付ける', () => {
    expect(createTagSchema.safeParse(validTag).success).toBe(true)
  })

  it('カテゴリーが空のタグを拒否する', () => {
    expect(createTagSchema.safeParse({ ...validTag, category: '' }).success).toBe(false)
  })

  it('説明を省略できる', () => {
    const { description: _, ...withoutDescription } = validTag
    expect(createTagSchema.safeParse(withoutDescription).success).toBe(true)
  })
})
