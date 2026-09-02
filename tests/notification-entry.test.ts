import { describe, expect, it } from 'vitest'
import { toNotificationEntry } from '@/lib/notifications/notification-entry'

const NOW = new Date('2024-01-14T02:00:00Z').getTime()

const base = {
  id: 'notification-1',
  isRead: false,
  createdAt: new Date('2024-01-14T00:00:00Z'),
}

describe('toNotificationEntry', () => {
  it('質問への回答は、質問タイトル入りの文言と質問ページへのリンクになる', () => {
    expect(
      toNotificationEntry(
        { ...base, type: 'POST_ANSWERED', post: { id: 'post-2', title: '経費精算の申請期限' } },
        NOW,
      ),
    ).toEqual({
      id: 'notification-1',
      type: 'qa',
      message: 'あなたの質問「経費精算の申請期限」に新しい回答がつきました',
      timestamp: '2時間前',
      isRead: false,
      href: '/posts/post-2',
    })
  })

  it('回答が関連する通知は、回答の postId から質問ページへリンクする', () => {
    const entry = toNotificationEntry(
      { ...base, type: 'ANSWER_HIDDEN', answer: { postId: 'post-3' } },
      NOW,
    )

    expect(entry.message).toBe('あなたの回答は運営により非表示になりました')
    expect(entry.href).toBe('/posts/post-3')
  })

  it('ひろば投稿のいいねは like アイコンになり、slug 付きのURLになる', () => {
    const entry = toNotificationEntry(
      {
        ...base,
        type: 'HIROBA_POST_LIKED',
        hirobaPost: { id: 'hiroba-post-1', hirobaId: 'hiroba-alcohol' },
      },
      NOW,
    )

    expect(entry.type).toBe('like')
    expect(entry.message).toBe('あなたの投稿にいいねがつきました')
    expect(entry.href).toBe('/hiroba/alcohol/posts/hiroba-post-1')
  })

  it('ひろばコメントへのいいねは、コメントが属する投稿ページへリンクする', () => {
    const entry = toNotificationEntry(
      {
        ...base,
        type: 'HIROBA_ANSWER_LIKED',
        hirobaAnswer: {
          hirobaPostId: 'hiroba-post-1',
          hirobaPost: { hirobaId: 'hiroba-alcohol' },
        },
      },
      NOW,
    )

    expect(entry.type).toBe('like')
    expect(entry.message).toBe('あなたのコメントにいいねがつきました')
    expect(entry.href).toBe('/hiroba/alcohol/posts/hiroba-post-1')
  })

  it('メンションはひろばか質問かで文言を出し分ける', () => {
    expect(
      toNotificationEntry({ ...base, type: 'MENTIONED', answer: { postId: 'post-1' } }, NOW)
        .message,
    ).toBe('質問の回答であなたがメンションされました')

    expect(
      toNotificationEntry(
        { ...base, type: 'MENTIONED', hirobaPost: { id: 'p', hirobaId: 'hiroba-alcohol' } },
        NOW,
      ).message,
    ).toBe('ひろばの投稿であなたがメンションされました')
  })

  it('関連リソースが取れないときは鉤括弧を出さず、リンクも張らない', () => {
    const entry = toNotificationEntry({ ...base, type: 'POST_LIKED' }, NOW)

    expect(entry.type).toBe('like')
    expect(entry.message).toBe('あなたの質問にいいねがつきました')
    expect(entry.href).toBeUndefined()
  })

  it('質問へのいいねは like アイコンになる', () => {
    const entry = toNotificationEntry(
      { ...base, type: 'POST_LIKED', post: { id: 'post-1', title: '経費精算の申請期限' } },
      NOW,
    )

    expect(entry.type).toBe('like')
    expect(entry.message).toBe('あなたの質問「経費精算の申請期限」にいいねがつきました')
  })

  it('ひろばのコメント通知は square アイコンになる', () => {
    const entry = toNotificationEntry(
      {
        ...base,
        type: 'HIROBA_POST_ANSWERED',
        hirobaPost: { id: 'hiroba-post-1', hirobaId: 'hiroba-alcohol' },
      },
      NOW,
    )

    expect(entry.type).toBe('square')
    expect(entry.message).toBe('あなたの投稿に新しいコメントがつきました')
  })
})
