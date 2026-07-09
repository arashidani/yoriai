import { HttpResponse, http } from 'msw';
import { MOCK_POSTS, MOCK_USERS } from '../lib/mocks/fixtures';

export const mswHandlers = {
  posts: [
    http.get('/api/posts', () => HttpResponse.json({ posts: MOCK_POSTS })),
    http.get('/api/posts/:id', ({ params }) => {
      const post = MOCK_POSTS.find((p) => p.id === params.id);
      if (!post) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      return HttpResponse.json({ post });
    }),
    http.post('/api/posts', async ({ request }) => {
      const body = (await request.json()) as { title: string; body: string };
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
      );
    }),
  ],
  admin: [
    http.get('/api/admin/users', () => HttpResponse.json({ users: MOCK_USERS })),
    http.get('/api/admin/posts', () => HttpResponse.json({ posts: MOCK_POSTS })),
    http.patch('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
    http.delete('/api/admin/users/:id', () => HttpResponse.json({ success: true })),
  ],
};
