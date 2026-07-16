import { HttpResponse, http } from 'msw'
import {
  MOCK_AI_FLAGS,
  MOCK_BADGES,
  MOCK_INVITES,
  MOCK_MISSIONS,
  MOCK_PASSWORD_RESETS,
  MOCK_POSTS,
  MOCK_USERS,
} from '../lib/mocks/fixtures'

export const mswHandlers = {
  posts: [
    http.get('/api/posts', () => HttpResponse.json({ posts: MOCK_POSTS })),
    http.get('/api/posts/:id', ({ params }) => {
      const post = MOCK_POSTS.find((p) => p.id === params.id)
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      return HttpResponse.json({ post })
    }),
    http.post('/api/posts', async ({ request }) => {
      const body = (await request.json()) as { title: string; body: string }
      return HttpResponse.json(
        {
          post: {
            id: 'post-new',
            title: body.title,
            body: body.body,
            authorId: 'user-1',
            author: MOCK_USERS[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      )
    }),
    http.delete('/api/posts/:id', () => HttpResponse.json({ success: true })),
  ],
  admin: [
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
