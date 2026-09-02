import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, ProfileOptionSchema, SuccessSchema } from '@/lib/hono/openapi/schemas'
import {
  MOCK_BUSINESS_AREAS,
  MOCK_BUSINESS_SKILLS,
  MOCK_DEPARTMENTS,
  MOCK_INTERESTS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { updateUserProfile } from '@/lib/prisma/update-user-profile'
import { onboardingSchema } from '@/lib/schemas/onboarding'

const security = [{ supabaseSession: [] }]

const listOptionsRoute = createRoute({
  method: 'get',
  path: '/options',
  tags: ['onboarding'],
  summary: 'オンボーディングで選択できる項目を取得',
  security,
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      description: '有効なプロフィール選択肢',
      content: {
        'application/json': {
          schema: z.object({
            departments: z.array(ProfileOptionSchema),
            businessAreas: z.array(ProfileOptionSchema),
            businessSkills: z.array(ProfileOptionSchema),
            interests: z.array(ProfileOptionSchema),
          }),
        },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

const completeRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['onboarding'],
  summary: 'オンボーディングを完了',
  security,
  middleware: [authMiddleware] as const,
  request: {
    body: { required: true, content: { 'application/json': { schema: onboardingSchema } } },
  },
  responses: {
    200: {
      description: '登録完了',
      content: { 'application/json': { schema: SuccessSchema } },
    },
    400: errorResponse('選択肢が無効', '選択した項目が無効です'),
    401: errorResponse('未認証', 'Unauthorized'),
  },
})

export const onboardingRoute = new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
  .openapi(listOptionsRoute, async (c) => {
    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          departments: MOCK_DEPARTMENTS.filter((option) => option.isActive),
          businessAreas: MOCK_BUSINESS_AREAS.filter((option) => option.isActive),
          businessSkills: MOCK_BUSINESS_SKILLS.filter((option) => option.isActive),
          interests: MOCK_INTERESTS.filter((option) => option.isActive),
        },
        200,
      )
    }

    const user = c.get('user')
    const [departments, businessAreas, businessSkills, interests] = await Promise.all([
      prisma.department.findMany({
        where: { OR: [{ isActive: true }, { users: { some: { id: user.id } } }] },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.businessArea.findMany({
        where: { OR: [{ isActive: true }, { users: { some: { id: user.id } } }] },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.businessSkill.findMany({
        where: { OR: [{ isActive: true }, { users: { some: { userId: user.id } } }] },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.interest.findMany({
        where: { OR: [{ isActive: true }, { users: { some: { userId: user.id } } }] },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ])
    return c.json({ departments, businessAreas, businessSkills, interests }, 200)
  })
  .openapi(completeRoute, async (c) => {
    const user = c.get('user')
    const data = c.req.valid('json')

    if (process.env.MOCK_MODE === 'true') {
      return c.json({ success: true }, 200)
    }

    const saved = await updateUserProfile(user.id, data, true)

    if (!saved) return c.json({ error: '選択した項目が無効です' }, 400)

    return c.json({ success: true }, 200)
  })
