import { describe, expect, it } from 'vitest'
import { parseUserText } from '@/lib/text/parse-user-text'

describe('parseUserText', () => {
  it('プレーンテキストはそのまま返す', () => {
    expect(parseUserText('こんにちは')).toEqual([{ type: 'text', value: 'こんにちは', start: 0 }])
  })

  it('http と https の URL をリンク化する', () => {
    expect(parseUserText('見て https://example.com ね')).toEqual([
      { type: 'text', value: '見て ', start: 0 },
      { type: 'url', value: 'https://example.com', href: 'https://example.com/', start: 3 },
      { type: 'text', value: ' ね', start: 22 },
    ])
    expect(parseUserText('http://localhost:3000/foo')).toEqual([
      {
        type: 'url',
        value: 'http://localhost:3000/foo',
        href: 'http://localhost:3000/foo',
        start: 0,
      },
    ])
  })

  it('日本語に続く URL を途中で切る', () => {
    expect(parseUserText('https://example.comをご覧ください')).toEqual([
      { type: 'url', value: 'https://example.com', href: 'https://example.com/', start: 0 },
      { type: 'text', value: 'をご覧ください', start: 19 },
    ])
  })

  it('文末の句読点や括弧は URL に含めない', () => {
    expect(parseUserText('Check https://example.com.')).toEqual([
      { type: 'text', value: 'Check ', start: 0 },
      { type: 'url', value: 'https://example.com', href: 'https://example.com/', start: 6 },
      { type: 'text', value: '.', start: 25 },
    ])
    expect(parseUserText('（https://example.com）')).toEqual([
      { type: 'text', value: '（', start: 0 },
      { type: 'url', value: 'https://example.com', href: 'https://example.com/', start: 1 },
      { type: 'text', value: '）', start: 20 },
    ])
    expect(parseUserText('see (https://example.com)')).toEqual([
      { type: 'text', value: 'see (', start: 0 },
      { type: 'url', value: 'https://example.com', href: 'https://example.com/', start: 5 },
      { type: 'text', value: ')', start: 24 },
    ])
  })

  it('パスに含まれる括弧は URL の一部として残す', () => {
    expect(parseUserText('https://github.com/foo_(bar)')).toEqual([
      {
        type: 'url',
        value: 'https://github.com/foo_(bar)',
        href: 'https://github.com/foo_(bar)',
        start: 0,
      },
    ])
  })

  it('javascript: やプロトコルなしの文字列はリンク化しない', () => {
    expect(parseUserText('javascript:alert(1)')).toEqual([
      { type: 'text', value: 'javascript:alert(1)', start: 0 },
    ])
    expect(parseUserText('example.com')).toEqual([{ type: 'text', value: 'example.com', start: 0 }])
  })

  it('メンションをハイライト対象として切り出す', () => {
    expect(parseUserText('@ねこ さん')).toEqual([
      { type: 'mention', value: '@ねこ', start: 0 },
      { type: 'text', value: ' さん', start: 3 },
    ])
  })

  it('URL 内の @ はメンションにしない', () => {
    expect(parseUserText('https://example.com/@user と @ねこ')).toEqual([
      {
        type: 'url',
        value: 'https://example.com/@user',
        href: 'https://example.com/@user',
        start: 0,
      },
      { type: 'text', value: ' と ', start: 25 },
      { type: 'mention', value: '@ねこ', start: 28 },
    ])
  })
})
