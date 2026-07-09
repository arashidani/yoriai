import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { stringify as toYaml } from 'yaml'

// 仕様書生成はDBやSupabaseに接続しない。ただし @/lib/prisma/client が
// import 時に requireEnv('DATABASE_URL') を呼ぶため、未設定ならプレースホルダーを入れる。
// （app のモジュールグラフを読み込む前に設定したいので動的 import を使う）
process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

async function main() {
  const { default: app } = await import('@/lib/hono/app')
  const { openApiConfig } = await import('@/lib/hono/openapi/config')

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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
