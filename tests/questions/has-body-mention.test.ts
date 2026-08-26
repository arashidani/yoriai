import { describe, expect, it } from 'vitest'
import { hasBodyMention } from '@/lib/mentions/has-body-mention'

describe('hasBodyMention', () => {
  it('本文にあるメンションを検出する', () => {
    expect(hasBodyMention('こんにちは @一般ユーザー さん', '一般ユーザー')).toBe(true)
  })

  it('名前の一部だけのメンションは検出しない', () => {
    expect(hasBodyMention('@一般ユーザーさん こんにちは', '一般ユーザー')).toBe(false)
  })

  it('正規表現の特殊文字を含む名前をそのまま照合する', () => {
    expect(hasBodyMention('@foo.bar+1 確認です', 'foo.bar+1')).toBe(true)
  })
})
