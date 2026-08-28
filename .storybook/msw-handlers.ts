import { HttpResponse, http } from 'msw'
import {
  MOCK_AI_FLAGS,
  MOCK_ANONYMOUS_PROFILES,
  MOCK_ANSWERS,
  MOCK_AVATAR_URL,
  MOCK_BUSINESS_AREAS,
  MOCK_BUSINESS_SKILLS,
  MOCK_DEPARTMENTS,
  MOCK_HIROBA_ANSWERS,
  MOCK_HIROBA_POSTS,
  MOCK_HIROBAS,
  MOCK_INTERESTS,
  MOCK_INVITES,
  MOCK_NOTIFICATIONS,
  MOCK_PASSWORD_RESETS,
  MOCK_POSTS,
  MOCK_TAG_CATEGORIES,
  MOCK_TAGS,
  MOCK_USER_PROFILE,
  MOCK_USERS,
  mockPostHasTagId,
} from '../lib/mocks/fixtures'

import { toQuestionResponse } from '../lib/questions/api-mappers'

const MOCK_QUESTIONS = MOCK_POSTS.map((post) =>
  toQuestionResponse({ ...post, likes: [], bookmarks: [] }, MOCK_USERS[0].id),
)

/** 本番同様、ログイン中のユーザー宛ての通知だけを返す。 */
const MY_NOTIFICATIONS = MOCK_NOTIFICATIONS.filter(
  (notification) => notification.userId === MOCK_USERS[0].id,
)

/** 既読にした通知。既読化が未読件数に反映されないと、サイドバーのドットが消えない。 */
const readNotificationIds = new Set<string>()

const isNotificationRead = (notification: { id: string; isRead: boolean }) =>
  notification.isRead || readNotificationIds.has(notification.id)

/** ストーリー間で既読状態を持ち越さないためのリセット。 */
export function resetMockNotificationReadState() {
  readNotificationIds.clear()
}

/** `a,b,c` 形式のクエリを id 配列にする。lib/hono/routes/qa-questions.ts と同じ扱い。 */
function commaSeparatedIds(value: string | null) {
  return (value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/** AI SDK の UI Message Stream 形式(SSE)のレスポンスを組み立てる。 */
export function uiMessageStreamResponse(chunks: object[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // ストリームのチャンクを順番に追加していく
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'x-vercel-ai-ui-message-stream': 'v1',
    },
  })
}

export const mswHandlers = {
  users: [
    http.get('/api/users/me', () => HttpResponse.json({ user: MOCK_USER_PROFILE })),
    http.patch('/api/users/me', () => HttpResponse.json({ success: true })),
    http.put('/api/users/me/avatar', () =>
      HttpResponse.json({ user: { ...MOCK_USERS[0], avatarUrl: MOCK_AVATAR_URL } }),
    ),
    http.delete('/api/users/me/avatar', () =>
      HttpResponse.json({ user: { ...MOCK_USERS[0], avatarUrl: null } }),
    ),
  ],
  onboarding: [
    http.get('/api/onboarding/options', () =>
      HttpResponse.json({
        departments: MOCK_DEPARTMENTS,
        businessAreas: MOCK_BUSINESS_AREAS,
        businessSkills: MOCK_BUSINESS_SKILLS,
        interests: MOCK_INTERESTS,
      }),
    ),
    http.post('/api/onboarding', () => HttpResponse.json({ success: true })),
  ],
  posts: [
    http.get('/api/questions', ({ request }) => {
      const url = new URL(request.url)
      const keyword = url.searchParams.get('keyword') ?? ''
      const status = url.searchParams.get('status') ?? 'all'
      const tagId = url.searchParams.get('tagId')
      const categoryIds = commaSeparatedIds(url.searchParams.get('categoryIds'))
      const tagIds = commaSeparatedIds(url.searchParams.get('tagIds'))
      const page = Number(url.searchParams.get('page') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '10')

      let questions = MOCK_QUESTIONS.filter((question) => {
        const post = MOCK_POSTS.find((item) => item.id === question.id)
        return post && !post.deletedAt
      })
      if (keyword) {
        questions = questions.filter(
          (question) => question.title.includes(keyword) || question.body.includes(keyword),
        )
      }
      if (status === 'unanswered') {
        questions = questions.filter((question) => question.status === 'OPEN')
      }
      if (status === 'resolved') {
        questions = questions.filter((question) => question.status === 'RESOLVED')
      }
      if (tagId) {
        questions = questions.filter((question) => mockPostHasTagId(question.id, tagId))
      }
      // 親カテゴリー / 小ジャンルの複数選択。本番 API と同じく tags: { some } 判定。
      if (categoryIds.length > 0 || tagIds.length > 0) {
        const selectedCategoryNames = MOCK_TAG_CATEGORIES.filter((category) =>
          categoryIds.includes(category.id),
        ).map((category) => category.name)
        const matchingPostIds = MOCK_POSTS.filter((post) =>
          post.tags.some(
            (tag) => tagIds.includes(tag.id) || selectedCategoryNames.includes(tag.category),
          ),
        ).map((post) => post.id)
        questions = questions.filter((question) => matchingPostIds.includes(question.id))
      }

      const total = questions.length
      const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
      return HttpResponse.json({
        questions: questions.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, total, totalPages },
      })
    }),
    http.get('/api/questions/:id', ({ params }) => {
      const post = MOCK_QUESTIONS.find((p) => p.id === params.id)
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ question: post })
    }),
    http.post('/api/questions', async ({ request }) => {
      const body = (await request.json()) as { title: string; body: string }
      return HttpResponse.json(
        {
          question: { ...MOCK_QUESTIONS[0], id: 'post-new', title: body.title, body: body.body },
          moderation: { isHidden: false },
          tagAssignment: 'assigned',
        },
        { status: 201 },
      )
    }),
    http.get('/api/question-tags', () =>
      HttpResponse.json({
        categories: MOCK_TAG_CATEGORIES.map(({ id, name }) => ({
          id,
          name,
          tags: MOCK_TAGS.filter((tag) => tag.category === name && tag.isWorkTag)
            .map(({ id: tagId, name: tagName }) => ({ id: tagId, name: tagName }))
            .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
        })).filter((category) => category.tags.length > 0),
      }),
    ),
    http.post('/api/questions/:id/tag-assignment', () =>
      HttpResponse.json({ tag: { id: MOCK_TAGS[0].id, name: MOCK_TAGS[0].name } }),
    ),
    http.delete('/api/admin/posts/:id', () => HttpResponse.json({ success: true })),
    http.post('/api/questions/:id/likes', () => HttpResponse.json({ liked: true, likeCount: 1 })),
    http.delete('/api/questions/:id/likes', () =>
      HttpResponse.json({ liked: false, likeCount: 0 }),
    ),
    http.post('/api/questions/:id/bookmarks', () =>
      HttpResponse.json({ saved: true, bookmarkCount: 1 }),
    ),
    http.delete('/api/questions/:id/bookmarks', () =>
      HttpResponse.json({ saved: false, bookmarkCount: 0 }),
    ),
    http.post('/api/questions/:id/resolve', ({ params }) => {
      const post = MOCK_QUESTIONS.find((p) => p.id === params.id)
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ question: { ...post, status: 'RESOLVED' } })
    }),
  ],
  answers: [
    http.post('/api/answers/:id/likes', () => HttpResponse.json({ liked: true, likeCount: 1 })),
    http.delete('/api/answers/:id/likes', () => HttpResponse.json({ liked: false, likeCount: 0 })),
  ],
  notifications: [
    http.get('/api/notifications', ({ request }) => {
      const url = new URL(request.url)
      const cursor = url.searchParams.get('cursor')
      const limit = Number(url.searchParams.get('limit') ?? 20)
      const notifications = MY_NOTIFICATIONS.map((notification) => ({
        ...notification,
        isRead: isNotificationRead(notification),
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const start = cursor ? notifications.findIndex((item) => item.id === cursor) + 1 : 0
      const page = notifications.slice(start, start + limit + 1)
      const hasNextPage = page.length > limit
      const items = page.slice(0, limit)
      return HttpResponse.json({
        notifications: items,
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
      })
    }),
    http.get('/api/notifications/unread-count', () =>
      HttpResponse.json({
        count: MY_NOTIFICATIONS.filter((notification) => !isNotificationRead(notification)).length,
      }),
    ),
    http.patch('/api/notifications/read-all', () => {
      const unread = MY_NOTIFICATIONS.filter((notification) => !isNotificationRead(notification))
      for (const notification of unread) {
        readNotificationIds.add(notification.id)
      }
      return HttpResponse.json({ count: unread.length })
    }),
    http.patch('/api/notifications/:id', ({ params }) => {
      const notification = MOCK_NOTIFICATIONS.find((item) => item.id === params.id)
      if (!notification) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      readNotificationIds.add(String(params.id))
      return HttpResponse.json({ notification: { ...notification, isRead: true } })
    }),
  ],
  hiroba: [
    http.get('/api/hiroba', () => HttpResponse.json({ hirobas: MOCK_HIROBAS })),
    http.get('/api/hiroba/:slug', ({ params }) => {
      const hiroba = MOCK_HIROBAS.find((h) => h.slug === params.slug)
      if (!hiroba) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      const posts = MOCK_HIROBA_POSTS.filter((p) => p.hirobaId === hiroba.id)
      return HttpResponse.json({ hiroba, posts })
    }),
    http.post('/api/hiroba/:slug/membership', () => HttpResponse.json({ joined: true })),
    http.delete('/api/hiroba/:slug/membership', () => HttpResponse.json({ joined: false })),
    http.post('/api/hiroba/:slug/posts', async ({ request }) => {
      const requestBody = (await request.json()) as { title: string; body: string }
      return HttpResponse.json(
        {
          post: {
            id: 'hiroba-post-new',
            hirobaId: 'hiroba-1',
            title: requestBody.title,
            body: requestBody.body,
            imageUrl: null,
            authorId: 'user-1',
            author: MOCK_USERS[0],
            answerCount: 0,
            likeCount: 0,
            deletedAt: null,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.get('/api/hiroba-posts/:id', ({ params }) => {
      const post = MOCK_HIROBA_POSTS.find((p) => p.id === params.id)
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ post })
    }),
    http.get('/api/hiroba-posts/:id/answers', ({ params }) =>
      HttpResponse.json({
        answers: MOCK_HIROBA_ANSWERS.filter((a) => a.hirobaPostId === params.id),
      }),
    ),
    http.put('/api/hiroba-posts/:id/image', ({ params }) =>
      HttpResponse.json({
        post: { ...MOCK_HIROBA_POSTS[0], id: params.id, imageUrl: MOCK_AVATAR_URL },
      }),
    ),
    http.delete('/api/hiroba-posts/:id', () => HttpResponse.json({ success: true })),
    http.post('/api/hiroba-posts/:id/likes', () =>
      HttpResponse.json({ liked: true, likeCount: 1 }),
    ),
    http.delete('/api/hiroba-posts/:id/likes', () =>
      HttpResponse.json({ liked: false, likeCount: 0 }),
    ),
    http.post('/api/hiroba-posts/:id/bookmarks', () => HttpResponse.json({ saved: true })),
    http.delete('/api/hiroba-posts/:id/bookmarks', () => HttpResponse.json({ saved: false })),
    http.post('/api/hiroba-answers/:id/likes', () =>
      HttpResponse.json({ liked: true, likeCount: 1 }),
    ),
    http.delete('/api/hiroba-answers/:id/likes', () =>
      HttpResponse.json({ liked: false, likeCount: 0 }),
    ),
  ],
  admin: [
    http.get('/api/admin/profile-options/:category', ({ params }) => {
      const options = {
        departments: MOCK_DEPARTMENTS,
        'business-areas': MOCK_BUSINESS_AREAS,
        'business-skills': MOCK_BUSINESS_SKILLS,
        interests: MOCK_INTERESTS,
      }[String(params.category)]
      return HttpResponse.json({ options: options ?? [] })
    }),
    http.post('/api/admin/profile-options/:category', async ({ params, request }) => {
      const body = (await request.json()) as { name: string }
      return HttpResponse.json(
        {
          option: {
            id: `${params.category}-new`,
            name: body.name,
            isActive: true,
            sortOrder: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.patch('/api/admin/profile-options/:category/:id', async ({ request }) => {
      const body = (await request.json()) as { name?: string; isActive?: boolean }
      return HttpResponse.json({
        option: {
          id: 'option-1',
          name: body.name ?? '項目',
          isActive: body.isActive ?? true,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }),
    http.put('/api/admin/profile-options/:category/order', () =>
      HttpResponse.json({ success: true }),
    ),
    http.get('/api/admin/users', () => HttpResponse.json({ users: MOCK_USERS })),
    http.get('/api/admin/posts', () => HttpResponse.json({ posts: MOCK_POSTS })),
    http.patch('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
    http.delete('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/ai-flags', () => HttpResponse.json({ flags: MOCK_AI_FLAGS })),
    http.patch('/api/admin/ai-flags/:id', ({ params }) => {
      const flag = MOCK_AI_FLAGS.find((f) => f.id === params.id)
      if (!flag) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ flag: { ...flag, status: 'CONFIRMED' } })
    }),
    http.patch('/api/admin/posts/:id/restore', ({ params }) => {
      const post = MOCK_POSTS.find((p) => p.id === params.id)
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ post: { ...post, deletedAt: null } })
    }),
    http.patch('/api/admin/answers/:id/restore', ({ params }) => {
      const answer = MOCK_ANSWERS.find((a) => a.id === params.id)
      if (!answer) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ answer: { ...answer, isHidden: false } })
    }),
    http.post('/api/admin/invites', () =>
      HttpResponse.json(
        { invite: { ...MOCK_INVITES[0], expiresAt: MOCK_INVITES[0].expiresAt.toISOString() } },
        { status: 201 },
      ),
    ),
    http.get('/api/admin/invites', () =>
      HttpResponse.json({
        invites: MOCK_INVITES.map((i) => ({
          ...i,
          expiresAt: i.expiresAt.toISOString(),
          status: 'PENDING',
        })),
      }),
    ),
    http.get('/api/admin/anonymous-profiles', () =>
      HttpResponse.json({ profiles: MOCK_ANONYMOUS_PROFILES }),
    ),
    http.post('/api/admin/anonymous-profiles', async ({ request }) => {
      const body = (await request.json()) as { displayName: string }
      return HttpResponse.json(
        {
          profile: {
            id: 'anon-new',
            displayName: body.displayName,
            avatarUrls: [],
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.patch('/api/admin/anonymous-profiles/:id', async ({ params, request }) => {
      const profile = MOCK_ANONYMOUS_PROFILES.find((p) => p.id === params.id)
      if (!profile) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      const body = (await request.json()) as { isActive?: boolean; avatarUrls?: string[] }
      return HttpResponse.json({ profile: { ...profile, ...body } })
    }),
    http.post('/api/admin/anonymous-profiles/:id/avatars', ({ params }) => {
      const profile = MOCK_ANONYMOUS_PROFILES.find((p) => p.id === params.id)
      if (!profile) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({
        profile: { ...profile, avatarUrls: [...profile.avatarUrls, MOCK_AVATAR_URL] },
      })
    }),
    http.delete('/api/admin/anonymous-profiles/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/tag-categories', () =>
      HttpResponse.json({ categories: MOCK_TAG_CATEGORIES }),
    ),
    http.post('/api/admin/tag-categories', async ({ request }) => {
      const body = (await request.json()) as { name: string }
      return HttpResponse.json(
        {
          category: {
            id: 'tag-category-new',
            name: body.name,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.delete('/api/admin/tag-categories/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/tags', () => HttpResponse.json({ tags: MOCK_TAGS })),
    http.post('/api/admin/tags', async ({ request }) => {
      const body = (await request.json()) as {
        name: string
        category: string
        description?: string
        isWorkTag: boolean
      }
      return HttpResponse.json(
        {
          tag: {
            id: 'tag-new',
            ...body,
            description: body.description || null,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.patch('/api/admin/tags/:id', async ({ params, request }) => {
      const tag = MOCK_TAGS.find((item) => item.id === params.id)
      if (!tag) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      const body = (await request.json()) as {
        name: string
        category: string
        description?: string
        isWorkTag: boolean
      }
      return HttpResponse.json({ tag: { ...tag, ...body, description: body.description || null } })
    }),
    http.delete('/api/admin/tags/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/hiroba', () => HttpResponse.json({ hirobas: MOCK_HIROBAS })),
    http.post('/api/admin/hiroba', async ({ request }) => {
      const body = (await request.json()) as { name: string; description: string }
      return HttpResponse.json(
        {
          hiroba: {
            id: 'hiroba-new',
            slug: 'hiroba-new',
            name: body.name,
            description: body.description,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.delete('/api/admin/hiroba/:id', () => HttpResponse.json({ success: true })),
    http.post('/api/admin/users/:id/password-resets', () =>
      HttpResponse.json(
        {
          passwordReset: {
            token: MOCK_PASSWORD_RESETS[0].token,
            expiresAt: MOCK_PASSWORD_RESETS[0].expiresAt.toISOString(),
          },
        },
        { status: 201 },
      ),
    ),
  ],
  invites: [
    http.get('/api/invites/:token', ({ params }) => {
      const invite = MOCK_INVITES.find((i) => i.token === params.token)
      if (!invite) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ invite: { name: invite.name, role: invite.role } })
    }),
  ],
  passwordResets: [
    http.get('/api/password-resets/:token', ({ params }) => {
      const reset = MOCK_PASSWORD_RESETS.find((r) => r.token === params.token)
      if (!reset) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ valid: true })
    }),
    http.post('/api/password-resets/:token', ({ params }) => {
      const reset = MOCK_PASSWORD_RESETS.find((r) => r.token === params.token)
      if (!reset) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ success: true })
    }),
  ],
  chat: [
    http.post('/api/chat', () =>
      uiMessageStreamResponse([
        { type: 'start' },
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', delta: 'Storybookの' },
        { type: 'text-delta', id: 'text-1', delta: 'モック回答です。' },
        { type: 'text-end', id: 'text-1' },
        {
          type: 'data-conversation',
          data: { conversationId: 'mock-conversation' },
          transient: true,
        },
        { type: 'finish' },
      ]),
    ),
  ],
}
