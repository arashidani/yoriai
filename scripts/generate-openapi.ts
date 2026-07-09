import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify as toYaml } from 'yaml'
import { buildOpenApiDocument } from '@/lib/openapi/spec'

const outDir = join(process.cwd(), 'openapi')
mkdirSync(outDir, { recursive: true })

const doc = buildOpenApiDocument()

const jsonPath = join(outDir, 'openapi.json')
writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`)

const yamlPath = join(outDir, 'openapi.yaml')
writeFileSync(yamlPath, toYaml(doc))

console.log(`OpenAPI仕様書を書き出しました:
  - ${jsonPath}
  - ${yamlPath}`)
