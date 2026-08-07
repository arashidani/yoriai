import { $, createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { Prisma } from '@/app/generated/prisma/client'
import { Role } from '@/app/generated/prisma/enums'
import { type AuthVariables, authMiddleware } from '@/lib/hono/middleware/auth'
import { defaultHook } from '@/lib/hono/openapi/hook'
import { errorResponse, ProfileOptionSchema } from '@/lib/hono/openapi/schemas'
import {
  MOCK_BUSINESS_AREAS,
  MOCK_BUSINESS_SKILLS,
  MOCK_DEPARTMENTS,
  MOCK_INTERESTS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import {
  createProfileOptionSchema,
  type ProfileOptionCategory,
  profileOptionCategorySchema,
  updateProfileOptionSchema,
} from '@/lib/schemas/onboarding'

const security = [{ supabaseSession: [] }]

const categoryParams = z.object({ category: profileOptionCategorySchema })
const optionParams = categoryParams.extend({ id: z.string().min(1) })

const adminGuard = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (c.get('user').role !== Role.ADMIN) return c.json({ error: 'Forbidden' }, 403)
  return next()
})

const mockOptions = {
  departments: MOCK_DEPARTMENTS,
  'business-areas': MOCK_BUSINESS_AREAS,
  'business-skills': MOCK_BUSINESS_SKILLS,
  interests: MOCK_INTERESTS,
} satisfies Record<ProfileOptionCategory, typeof MOCK_DEPARTMENTS>

function listOptions(category: ProfileOptionCategory) {
  const args = { orderBy: { name: 'asc' as const } }
  switch (category) {
    case 'departments':
      return prisma.department.findMany(args)
    case 'business-areas':
      return prisma.businessArea.findMany(args)
    case 'business-skills':
      return prisma.businessSkill.findMany(args)
    case 'interests':
      return prisma.interest.findMany(args)
  }
}

function createOption(category: ProfileOptionCategory, name: string) {
  switch (category) {
    case 'departments':
      return prisma.department.create({ data: { name } })
    case 'business-areas':
      return prisma.businessArea.create({ data: { name } })
    case 'business-skills':
      return prisma.businessSkill.create({ data: { name } })
    case 'interests':
      return prisma.interest.create({ data: { name } })
  }
}

function updateOption(
  category: ProfileOptionCategory,
  id: string,
  data: { name?: string; isActive?: boolean },
) {
  switch (category) {
    case 'departments':
      return prisma.department.update({ where: { id }, data })
    case 'business-areas':
      return prisma.businessArea.update({ where: { id }, data })
    case 'business-skills':
      return prisma.businessSkill.update({ where: { id }, data })
    case 'interests':
      return prisma.interest.update({ where: { id }, data })
  }
}

const listRoute = createRoute({
  method: 'get',
  path: '/{category}',
  tags: ['admin'],
  summary: 'プロフィール選択肢一覧を取得（管理者専用）',
  security,
  request: { params: categoryParams },
  responses: {
    200: {
      description: '選択肢一覧',
      content: {
        'application/json': { schema: z.object({ options: z.array(ProfileOptionSchema) }) },
      },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
  },
})

const createRoute_ = createRoute({
  method: 'post',
  path: '/{category}',
  tags: ['admin'],
  summary: 'プロフィール選択肢を作成（管理者専用）',
  security,
  request: {
    params: categoryParams,
    body: {
      required: true,
      content: { 'application/json': { schema: createProfileOptionSchema } },
    },
  },
  responses: {
    201: {
      description: '作成された選択肢',
      content: { 'application/json': { schema: z.object({ option: ProfileOptionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    409: errorResponse('同名の選択肢が存在する', '同じ名前の項目がすでに存在します'),
  },
})

const updateRoute = createRoute({
  method: 'patch',
  path: '/{category}/{id}',
  tags: ['admin'],
  summary: 'プロフィール選択肢を更新（管理者専用）',
  security,
  request: {
    params: optionParams,
    body: {
      required: true,
      content: { 'application/json': { schema: updateProfileOptionSchema } },
    },
  },
  responses: {
    200: {
      description: '更新された選択肢',
      content: { 'application/json': { schema: z.object({ option: ProfileOptionSchema }) } },
    },
    401: errorResponse('未認証', 'Unauthorized'),
    403: errorResponse('権限不足（管理者専用）', 'Forbidden'),
    404: errorResponse('選択肢が見つからない', 'Not found'),
    409: errorResponse('同名の選択肢が存在する', '同じ名前の項目がすでに存在します'),
  },
})

export const adminProfileOptionsRoute = $(
  new OpenAPIHono<{ Variables: AuthVariables }>({ defaultHook })
    .use(authMiddleware)
    .use(adminGuard),
)
  .openapi(listRoute, async (c) => {
    const { category } = c.req.valid('param')
    if (process.env.MOCK_MODE === 'true') {
      return c.json({ options: mockOptions[category] }, 200)
    }
    return c.json({ options: await listOptions(category) }, 200)
  })
  .openapi(createRoute_, async (c) => {
    const { category } = c.req.valid('param')
    const { name } = c.req.valid('json')
    if (process.env.MOCK_MODE === 'true') {
      return c.json(
        {
          option: {
            id: `${category}-new`,
            name,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        201,
      )
    }
    try {
      return c.json({ option: await createOption(category, name) }, 201)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ error: '同じ名前の項目がすでに存在します' }, 409)
      }
      throw error
    }
  })
  .openapi(updateRoute, async (c) => {
    const { category, id } = c.req.valid('param')
    const data = c.req.valid('json')
    if (process.env.MOCK_MODE === 'true') {
      const option = mockOptions[category].find((item) => item.id === id)
      if (!option) return c.json({ error: 'Not found' }, 404)
      return c.json({ option: { ...option, ...data, updatedAt: new Date() } }, 200)
    }
    try {
      return c.json({ option: await updateOption(category, id, data) }, 200)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return c.json({ error: 'Not found' }, 404)
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return c.json({ error: '同じ名前の項目がすでに存在します' }, 409)
      }
      throw error
    }
  })
