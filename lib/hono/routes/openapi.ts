import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { buildOpenApiDocument } from '@/lib/openapi/spec'

export const openapiRoute = new Hono()
  .get('/openapi.json', (c) => c.json(buildOpenApiDocument()))
  .get('/docs', swaggerUI({ url: '/api/openapi.json' }))
