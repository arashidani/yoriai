import { describe, expect, it } from 'vitest'
import { chatErrorText, toChatErrorMessage } from '@/lib/chat/error-message'

describe('toChatErrorMessage', () => {
  it('APIのerrorフィールドを返す', () => {
    expect(toChatErrorMessage({ error: 'AIとの通信に失敗しました' })).toBe(
      'AIとの通信に失敗しました',
    )
  })

  it('想定外のペイロードはフォールバックする', () => {
    expect(toChatErrorMessage(null)).toBe('AIとの通信に失敗しました')
    expect(toChatErrorMessage({})).toBe('AIとの通信に失敗しました')
  })
})

describe('chatErrorText', () => {
  it('AI SDKが入れたJSON本文を人間向け文言に戻す', () => {
    expect(chatErrorText(new Error('{"error":"AIとの通信に失敗しました"}'))).toBe(
      'AIとの通信に失敗しました',
    )
  })

  it('通常のErrorメッセージはそのまま出す', () => {
    expect(chatErrorText(new Error('ネットワークエラー'))).toBe('ネットワークエラー')
  })
})
