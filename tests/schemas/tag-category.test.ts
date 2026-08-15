import { describe, expect, it } from 'vitest'
import { createTagCategorySchema } from '@/lib/schemas/tag-category'

describe('createTagCategorySchema', () => {
  it('カテゴリー名を受け付ける', () => {
    expect(createTagCategorySchema.safeParse({ name: '人事' }).success).toBe(true)
  })

  it('空のカテゴリー名を拒否する', () => {
    expect(createTagCategorySchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('50文字を超えるカテゴリー名を拒否する', () => {
    expect(createTagCategorySchema.safeParse({ name: 'あ'.repeat(51) }).success).toBe(false)
  })
})
