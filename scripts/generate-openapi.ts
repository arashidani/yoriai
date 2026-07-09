import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify as toYaml } from 'yaml'
import app from '@/lib/hono/app'
import { openApiConfig } from '@/lib/hono/openapi/config'

const outDir = join(process.cwd(), 'openapi')
mkdirSync(outDir, { recursive: true })

// ルート定義（createRoute）からOpenAPI 3.1ドキュメントを生成する
const doc = app.getOpenAPI31Document(openApiConfig)

const jsonPath = join(outDir, 'openapi.json')
writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`)

const yamlPath = join(outDir, 'openapi.yaml')
writeFileSync(yamlPath, toYaml(doc))

console.log(`OpenAPI仕様書を書き出しました:
  - ${jsonPath}
  - ${yamlPath}`)
