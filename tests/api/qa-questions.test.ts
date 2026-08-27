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

    expect(body.pagination).toMatchObject({ page: 1, pageSize: 10, total: 5, totalPages: 1 })
    expect(body.questions).toHaveLength(5)
    expect(body.questions[0]).toHaveProperty('tag')
    expect(Array.isArray(body.questions[0].tag)).toBe(false)
    expect(body.questions[0]).not.toHaveProperty('tags')
  })

  it('質問投稿日と最新回答投稿日の新しい順で返し、更新日時にも同じ値を使う', async () => {
    const response = await app.request('/api/questions')
    const body = await response.json()

    expect(body.questions.map((question: { id: string }) => question.id)).toEqual([
      'post-5',
      'post-4',
      'post-3',
      'post-2',
      'post-1',
    ])
    const answeredQuestion = body.questions.find(
      (question: { id: string }) => question.id === 'post-3',
    )
    expect(answeredQuestion.activityAt).toBe('2024-01-12T02:00:00.000Z')
    expect(answeredQuestion.updatedAt).toBe('2024-01-15T00:00:00.000Z')
  })

  it('keyword・status・tagIdで絞り込む', async () => {
    const response = await app.request(
      '/api/questions?keyword=経費精算&status=unanswered&tagId=tag-2',
    )
    const body = await response.json()

    expect(body.questions.map((question: { id: string }) => question.id)).toEqual(['post-2'])
  })

  it('親カテゴリーIDと小ジャンルIDを複数指定してOR検索する', async () => {
    const response = await app.request(
      '/api/questions?categoryIds=tag-category-1&tagIds=tag-2,tag-3',
    )
    const body = await response.json()

    expect(body.questions.map((question: { id: string }) => question.id).sort()).toEqual([
      'post-1',
      'post-2',
      'post-3',
      'post-4',
    ])
  })

  it('質問タグ候補を親カテゴリー配下にまとめ、「その他」を含む全小ジャンルを返す', async () => {
    const response = await app.request('/api/question-tags')
    const body = await response.json()

    expect(body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'tag-category-6',
          name: 'その他',
          tags: [
            expect.objectContaining({
              id: 'tag-18',
              name: 'その他（雑談に近い質問）',
            }),
          ],
        }),
      ]),
    )
    expect(body.categories.flatMap((category: { tags: unknown[] }) => category.tags)).toHaveLength(
      18,
    )
  })

  it('回答できる質問をビジネススキル優先・その他補完で最大3件返す', async () => {
    const response = await app.request('/api/questions/answerable')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.questions).toHaveLength(3)
    expect(body.questions.map((question: { id: string }) => question.id).sort()).toEqual([
      'post-1',
      'post-4',
      'post-5',
    ])
    expect(
      body.questions.every(
        (question: Record<string, unknown>) =>
          Object.keys(question).sort().join(',') === 'displayAuthor,id,title',
      ),
    ).toBe(true)
    expect(
      body.questions.every((question: { displayAuthor: { avatarUrl: string | null } }) =>
        Boolean(question.displayAuthor.avatarUrl),
      ),
    ).toBe(true)
  })

  it('page/pageSizeを適用する', async () => {
    const response = await app.request('/api/questions?page=2&pageSize=2')
    const body = await response.json()

    expect(body.questions).toHaveLength(2)
    expect(body.pagination).toEqual({ page: 2, pageSize: 2, total: 5, totalPages: 3 })
  })

  it('解決済みかつ1票以上の最多回答だけisMostLiked=trueにする', async () => {
    const response = await app.request('/api/questions/post-3/answers')
    const body = await response.json()

    expect(body.answers).toHaveLength(1)
    expect(body.answers[0]).toMatchObject({
      id: 'answer-2',
      isMostLiked: true,
      joinedYear: 2020,
      joinedMonth: 4,
    })
  })

  it('未解決質問では最多回答でもメダルを付けない', async () => {
    const response = await app.request('/api/questions/post-1/answers')
    const body = await response.json()

    expect(body.answers[0]).toMatchObject({
      id: 'answer-1',
      isMostLiked: false,
      joinedYear: 2022,
      joinedMonth: 10,
    })
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
  it('存在しないtagIdを指定すると400を返す', async () => {
    const response = await app.request('/api/questions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440002',
      },
      body: JSON.stringify({ title: '質問テスト', body: '本文テスト', tagId: 'invalid-tag' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: '指定されたタグが見つかりません' })
  })

  it('有効なtagIdを指定するとタグ付きで作成する', async () => {
    const response = await app.request('/api/questions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440003',
      },
      body: JSON.stringify({ title: '質問テスト', body: '本文テスト', tagId: 'tag-1' }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.question.tag).toMatchObject({ id: 'tag-category-1', name: '社内ルール・手続き' })
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
    const answerBody = await answer.json()
    expect((await question.json()).moderation).toEqual({ isHidden: false })
    expect(answerBody.moderation).toEqual({ isHidden: false })
    expect(answerBody.answer).toMatchObject({ joinedYear: 2020, joinedMonth: 4 })
  })

  it('その他タグを手動選択して質問を投稿できる', async () => {
    const response = await app.request('/api/questions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440018',
      },
      body: JSON.stringify({
        title: '雑談の質問',
        body: 'その他カテゴリーで投稿します',
        tagId: 'tag-18',
      }),
    })

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.tagAssignment).toBe('assigned')
    expect(body.question.tag).toEqual({ id: 'tag-category-6', name: 'その他' })
  })
})
