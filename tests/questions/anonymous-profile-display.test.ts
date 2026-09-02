import { describe, expect, it } from 'vitest'
import {
  anonymousProfileDisplayName,
  avatarUrlForAlias,
} from '@/lib/questions/anonymous-profile-display'
import { toQaAnswerResponse, toQuestionResponse } from '@/lib/questions/api-mappers'

describe('anonymous profile aliases', () => {
  it('uses an ordered avatar set for each alias round and cycles after the final image', () => {
    const avatars = ['first.webp', 'second.webp', 'third.webp']

    expect(anonymousProfileDisplayName('Alien A', 1)).toBe('Alien A')
    expect(anonymousProfileDisplayName('Alien A', 2)).toBe('Alien A#2')
    expect(avatarUrlForAlias(avatars, 1)).toBe('first.webp')
    expect(avatarUrlForAlias(avatars, 2)).toBe('second.webp')
    expect(avatarUrlForAlias(avatars, 3)).toBe('third.webp')
    expect(avatarUrlForAlias(avatars, 4)).toBe('first.webp')
  })

  it('has no avatar until the admin uploads one', () => {
    expect(avatarUrlForAlias([], 1)).toBeNull()
  })

  it('exposes the numbered alias and its matching image in Q&A responses', () => {
    const answer = toQaAnswerResponse(
      {
        id: 'answer-1',
        postId: 'post-1',
        body: 'answer',
        authorId: 'other-user',
        postAnonymousProfile: {
          aliasNumber: 2,
          anonymousProfile: { displayName: 'Alien A', avatarUrls: ['first.webp', 'second.webp'] },
        },
      },
      'viewer',
      null,
    )

    expect(answer.displayAuthor).toEqual({ displayName: 'Alien A#2', avatarUrl: 'second.webp' })
  })

  it('shows the anonymous profile to the author and marks it as their own', () => {
    const question = toQuestionResponse(
      {
        id: 'post-1',
        title: 'question',
        body: 'body',
        status: 'OPEN',
        authorId: 'viewer',
        author: { name: 'Real Name', email: 'real@example.com' },
        postAnonymousProfile: {
          aliasNumber: 2,
          anonymousProfile: { displayName: 'Alien A', avatarUrls: ['first.webp', 'second.webp'] },
        },
      },
      'viewer',
    )

    expect(question.displayAuthor).toEqual({
      displayName: 'Alien A#2（あなた）',
      avatarUrl: 'second.webp',
    })
  })

  it('does not expose the real name while an own post is waiting for profile assignment', () => {
    const answer = toQaAnswerResponse(
      {
        id: 'answer-1',
        postId: 'post-1',
        body: 'answer',
        authorId: 'viewer',
        author: { name: 'Real Name', email: 'real@example.com' },
      },
      'viewer',
      null,
    )

    expect(answer.displayAuthor).toEqual({ displayName: '匿名（あなた）', avatarUrl: null })
  })
})
