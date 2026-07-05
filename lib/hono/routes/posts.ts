import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '@/lib/hono/middleware/auth'
import { createPostSchema } from '@/lib/schemas/post'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@/app/generated/prisma/enums'

export const postsRoute = new Hono()
  .get('/', async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ posts: MOCK_POSTS })
    }
    const posts = await prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ posts })
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    if (process.env.MOCK_MODE === 'true') {
      const post = MOCK_POSTS.find((p) => p.id === id)
      if (!post) return c.json({ error: 'Not found' }, 404)
      return c.json({ post })
    }
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true },
    })
    if (!post) return c.json({ error: 'Not found' }, 404)
    return c.json({ post })
  })
  .post('/', authMiddleware, zValidator('json', createPostSchema), async (c) => {
    const user = c.get('user')
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({
        post: {
          id: `post-${Date.now()}`,
          ...data,
          authorId: user.id,
          author: user,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }, 201)
    }
    const post = await prisma.post.create({
      data: { ...data, authorId: user.id },
      include: { author: true },
    })
    return c.json({ post }, 201)
  })
  .delete('/:id', authMiddleware, async (c) => {
    const user = c.get('user')
    if (user.role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)

    const id = c.req.param('id')
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true })
    }
    await prisma.post.delete({ where: { id } })
    return c.json({ success: true })
  })
