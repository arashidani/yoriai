import { beforeAll, describe, expect, it, vi } from 'vitest'

let app: typeof import('@/lib/hono/app')['default']

describe('Q&A API contract (MOCK_MODE)', () => {
  beforeAll(async () => {
    vi.stubEnv('MOCK_MODE', 'true')
    vi.stubEnv('DATABASE_URL', 'postgresql://placeholder:placeholder@localhost:5432/placeholder')
    app = (await import('@/lib/hono/app')).default
  })

  it('一覧を既定10件でページングし、タグを単数で返す', async () => {
    const response = await app.request('/api/questions')
    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.pagination).toMatchObject({ page: 1, pageSize: 10, total: 4, totalPages: 1 })
    expect(body.questions).toHaveLength(4)
    expect(body.questions[0]).toHaveProperty('tag')
    expect(Array.isArray(body.questions[0].tag)).toBe(false)
    expect(body.questions[0]).not.toHaveProperty('tags')
  })

  it('keyword・status・tagIdで絞り込む', async () => {
    const response = await app.request(
      '/api/questions?keyword=TypeScript&status=unanswered&tagId=tag-2',
    )
    const body = await response.json()

    expect(body.questions.map((question: { id: string }) => question.id)).toEqual(['post-2'])
  })

  it('page/pageSizeを適用する', async () => {
    const response = await app.request('/api/questions?page=2&pageSize=2')
    const body = await response.json()

    expect(body.questions).toHaveLength(2)
    expect(body.pagination).toEqual({ page: 2, pageSize: 2, total: 4, totalPages: 2 })
  })

  it('解決済みかつ1票以上の最多回答だけisMostLiked=trueにする', async () => {
    const response = await app.request('/api/questions/post-3/answers')
    const body = await response.json()

    expect(body.answers).toHaveLength(1)
    expect(body.answers[0]).toMatchObject({ id: 'answer-2', isMostLiked: true })
  })

  it('未解決質問では最多回答でもメダルを付けない', async () => {
    const response = await app.request('/api/questions/post-1/answers')
    const body = await response.json()

    expect(body.answers[0]).toMatchObject({ id: 'answer-1', isMostLiked: false })
  })

  it('投稿した質問・保存した質問を専用APIで返す', async () => {
    const [mine, saved] = await Promise.all([
      app.request('/api/users/me/questions'),
      app.request('/api/users/me/saved-questions'),
    ])

    expect(mine.status).toBe(200)
    expect(saved.status).toBe(200)
    expect(
      (await mine.json()).questions.every(
        (question: { isOwnQuestion: boolean }) => question.isOwnQuestion,
      ),
    ).toBe(true)
    expect(
      (await saved.json()).questions.every((question: { saved: boolean }) => question.saved),
    ).toBe(true)
  })

  it('旧公開API /api/posts は廃止する', async () => {
    const response = await app.request('/api/posts')
    expect(response.status).toBe(404)
  })

  it('MOCK_MODEでも削除済み質問への回答は410を返す', async () => {
    const response = await app.request('/api/questions/post-deleted/answers', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({ body: '回答テスト' }),
    })

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      error: 'この投稿は削除されたため、回答できません',
    })
  })
  it('質問・回答の作成レスポンスに公開状態を返す', async () => {
    const headers = {
      'content-type': 'application/json',
      'idempotency-key': '550e8400-e29b-41d4-a716-446655440001',
    }
    const question = await app.request('/api/questions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: '質問テスト', body: '本文テスト' }),
    })
    const answer = await app.request('/api/questions/post-1/answers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: '回答テスト' }),
    })

    expect(question.status).toBe(201)
    expect(answer.status).toBe(201)
    expect((await question.json()).moderation).toEqual({ isHidden: false })
    expect((await answer.json()).moderation).toEqual({ isHidden: false })
  })
})
