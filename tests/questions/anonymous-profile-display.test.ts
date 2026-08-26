import { describe, expect, it } from 'vitest'
import { toQaAnswerResponse, toQuestionResponse } from '@/lib/questions/api-mappers'

const anonymousProfile = {
  displayName: 'ねこ',
  avatarUrl: '/anonymous-profiles/cat.svg',
}

function authorRecord(
  authorId: string,
  profile: typeof anonymousProfile | null = anonymousProfile,
) {
  return {
    id: 'record-1',
    authorId,
    author: { name: '本名', email: 'real@example.com' },
    postAnonymousProfile: profile ? { anonymousProfile: profile } : null,
    createdAt: new Date('2026-08-26T00:00:00.000Z'),
    updatedAt: new Date('2026-08-26T00:00:00.000Z'),
  }
}

describe('質問・回答の匿名プロフィール表示', () => {
  it('自分の質問は匿名名とアイコンを返し、（あなた）で識別する', () => {
    const question = toQuestionResponse(
      {
        ...authorRecord('viewer-1'),
        title: '質問',
        body: '本文',
        status: 'OPEN',
      },
      'viewer-1',
    )

    expect(question.displayAuthor).toEqual({
      displayName: 'ねこ（あなた）',
      avatarUrl: '/anonymous-profiles/cat.svg',
    })
  })

  it('自分の回答にも同じ表示規則を適用する', () => {
    const answer = toQaAnswerResponse(
      { ...authorRecord('viewer-1'), postId: 'post-1', body: '回答' },
      'viewer-1',
      null,
    )

    expect(answer.displayAuthor).toEqual({
      displayName: 'ねこ（あなた）',
      avatarUrl: '/anonymous-profiles/cat.svg',
    })
  })

  it('他人の投稿には（あなた）を付けない', () => {
    const answer = toQaAnswerResponse(
      { ...authorRecord('other-user'), postId: 'post-1', body: '回答' },
      'viewer-1',
      null,
    )

    expect(answer.displayAuthor.displayName).toBe('ねこ')
  })

  it('匿名プロフィール未割り当てでも本名を公開せず匿名表示にフォールバックする', () => {
    const answer = toQaAnswerResponse(
      { ...authorRecord('viewer-1', null), postId: 'post-1', body: '回答' },
      'viewer-1',
      null,
    )

    expect(answer.displayAuthor).toEqual({ displayName: '匿名（あなた）', avatarUrl: null })
  })
})
