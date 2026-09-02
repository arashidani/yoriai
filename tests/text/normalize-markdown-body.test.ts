import { describe, expect, it } from 'vitest'
import { normalizeMarkdownBodySource } from '@/lib/text/normalize-markdown-body'

describe('normalizeMarkdownBodySource', () => {
  it('マーカー行の直後に空行を入れて通常段落と分離する', () => {
    expect(normalizeMarkdownBodySource('- りんご\n普通のテキスト')).toBe('- りんご\n\n普通のテキスト')
    expect(normalizeMarkdownBodySource('1. 手順1\n普通のテキスト')).toBe('1. 手順1\n\n普通のテキスト')
    expect(normalizeMarkdownBodySource('> 引用\n普通のテキスト')).toBe('> 引用\n\n普通のテキスト')
  })

  it('既に空行がある場合は追加しない', () => {
    expect(normalizeMarkdownBodySource('- りんご\n\n普通のテキスト')).toBe('- りんご\n\n普通のテキスト')
  })

  it('プレーンテキストはそのまま', () => {
    const plain = 'お疲れ様です。\n質問したいのですが'
    expect(normalizeMarkdownBodySource(plain)).toBe(plain)
  })
})
