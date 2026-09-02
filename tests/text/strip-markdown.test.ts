import { describe, expect, it } from 'vitest'
import { stripMarkdown } from '@/lib/text/strip-markdown'

describe('stripMarkdown', () => {
  it('プレーンテキストはそのまま返す', () => {
    expect(stripMarkdown('こんにちは')).toBe('こんにちは')
  })

  it('太字・斜体の記号を取り除く', () => {
    expect(stripMarkdown('**太字**と*斜体*です')).toBe('太字と斜体です')
  })

  it('リンクはラベルだけ残す', () => {
    expect(stripMarkdown('詳しくは [社内ポータル](https://example.com) を見てください')).toBe(
      '詳しくは 社内ポータル を見てください',
    )
  })

  it('リスト記号を取り除いて1行にまとめる', () => {
    expect(stripMarkdown('- りんご\n- みかん')).toBe('りんご みかん')
  })

  it('改行と連続空白を1つの空白にまとめる', () => {
    expect(stripMarkdown('お疲れ様です！！！\n質問したいのですが')).toBe(
      'お疲れ様です！！！ 質問したいのですが',
    )
  })
})
