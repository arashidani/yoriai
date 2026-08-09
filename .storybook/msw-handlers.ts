import { HttpResponse, http } from 'msw'
import {
  MOCK_AI_FLAGS,
  MOCK_ANONYMOUS_PROFILES,
  MOCK_ANSWERS,
  MOCK_BADGES,
  MOCK_BUSINESS_AREAS,
  MOCK_BUSINESS_SKILLS,
  MOCK_DEPARTMENTS,
  MOCK_INTERESTS,
  MOCK_INVITES,
  MOCK_MISSIONS,
  MOCK_PASSWORD_RESETS,
  MOCK_POSTS,
  MOCK_TAGS,
  MOCK_USERS,
} from '../lib/mocks/fixtures'

import { toQuestionResponse } from '../lib/questions/api-mappers'

const MOCK_QUESTIONS = MOCK_POSTS.map((post) =>
  toQuestionResponse({ ...post, likes: [], bookmarks: [] }, MOCK_USERS[0].id),
)

export const mswHandlers = {
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
    http.get('/api/questions', () =>
      HttpResponse.json({
        questions: MOCK_QUESTIONS,
        pagination: { page: 1, pageSize: 10, total: MOCK_QUESTIONS.length, totalPages: 1 },
      }),
    ),
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
        },
        { status: 201 },
      )
    }),
    http.delete('/api/questions/:id', () => HttpResponse.json({ success: true })),
    http.post('/api/questions/:id/likes', () => HttpResponse.json({ liked: true, likeCount: 1 })),
    http.delete('/api/questions/:id/likes', () =>
      HttpResponse.json({ liked: false, likeCount: 0 }),
    ),
    http.post('/api/questions/:id/bookmarks', () => HttpResponse.json({ saved: true })),
    http.delete('/api/questions/:id/bookmarks', () => HttpResponse.json({ saved: false })),
  ],
  answers: [
    http.post('/api/answers/:id/likes', () => HttpResponse.json({ liked: true, likeCount: 1 })),
    http.delete('/api/answers/:id/likes', () => HttpResponse.json({ liked: false, likeCount: 0 })),
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }),
    http.get('/api/admin/users', () => HttpResponse.json({ users: MOCK_USERS })),
    http.get('/api/admin/posts', () => HttpResponse.json({ posts: MOCK_POSTS })),
    http.patch('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
    http.delete('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/badges', () => HttpResponse.json({ badges: MOCK_BADGES })),
    http.post('/api/admin/badges', () =>
      HttpResponse.json({ badge: MOCK_BADGES[0] }, { status: 201 }),
    ),
    http.get('/api/admin/missions', () => HttpResponse.json({ missions: MOCK_MISSIONS })),
    http.post('/api/admin/missions', () =>
      HttpResponse.json({ mission: MOCK_MISSIONS[0] }, { status: 201 }),
    ),
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
      const body = (await request.json()) as { displayName: string; avatarUrl: string }
      return HttpResponse.json(
        {
          profile: {
            id: 'anon-new',
            displayName: body.displayName,
            avatarUrl: body.avatarUrl,
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
      const body = (await request.json()) as { isActive: boolean }
      return HttpResponse.json({ profile: { ...profile, isActive: body.isActive } })
    }),
    http.delete('/api/admin/anonymous-profiles/:id', () => HttpResponse.json({ success: true })),
    http.get('/api/admin/tags', () => HttpResponse.json({ tags: MOCK_TAGS })),
    http.post('/api/admin/tags', async ({ request }) => {
      const body = (await request.json()) as { name: string }
      return HttpResponse.json(
        { tag: { id: 'tag-new', name: body.name, createdAt: new Date().toISOString() } },
        { status: 201 },
      )
    }),
    http.delete('/api/admin/tags/:id', () => HttpResponse.json({ success: true })),
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
}
