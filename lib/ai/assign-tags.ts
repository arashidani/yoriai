import { GoogleGenAI } from '@google/genai'
import { requireEnv } from '@/lib/env'

const SYSTEM_INSTRUCTION =
  'あなたは職場向けコミュニティサービスの投稿分類アシスタントです。投稿のタイトルと本文を読み、渡された候補タグの中から最も適切なものを最大3件選んでください。同じカテゴリーからは最大1件だけ選んでください。descriptionは管理者が用意した選択基準です。候補に無いタグ名を作り出さないでください。適切なタグが無い場合は空配列を返してください。'

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tagNames: { type: 'array', items: { type: 'string' } },
  },
  required: ['tagNames'],
}

type AssignTagsResult = {
  tagNames: string[]
}

export type TagCandidate = {
  name: string
  category: string
  description: string | null
}

/** AIの出力を登録済みタグとの完全一致で検証し、カテゴリーごとに最大1件へ絞る。 */
export function selectValidTagNames(requestedNames: unknown, candidates: TagCandidate[]): string[] {
  if (!Array.isArray(requestedNames)) return []

  const candidatesByName = new Map(candidates.map((tag) => [tag.name, tag]))
  const selectedCategories = new Set<string>()
  const selectedNames: string[] = []

  for (const name of requestedNames) {
    if (typeof name !== 'string') continue
    const tag = candidatesByName.get(name)
    if (!tag || selectedCategories.has(tag.category)) continue

    selectedNames.push(tag.name)
    selectedCategories.add(tag.category)
    if (selectedNames.length === 3) break
  }

  return selectedNames
}

/** Gemini呼び出しに失敗した場合や候補タグが無い場合は空配列を返す（投稿作成自体は失敗させない） */
export async function assignTags(
  title: string,
  body: string,
  candidates: TagCandidate[],
): Promise<string[]> {
  if (candidates.length === 0) return []

  try {
    const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `候補タグ: ${JSON.stringify(candidates)}\nタイトル: ${title}\n本文: ${body}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return []
    const result = JSON.parse(text) as AssignTagsResult
    return selectValidTagNames(result.tagNames, candidates)
  } catch (error) {
    console.error('Gemini tag assignment failed', error)
    return []
  }
}
