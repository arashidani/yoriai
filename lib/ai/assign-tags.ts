import { GoogleGenAI } from '@google/genai'
import { GEMINI_REQUEST_TIMEOUT_MS } from '@/lib/ai/errors'
import { requireEnv } from '@/lib/env'

const SYSTEM_INSTRUCTION =
  'あなたは職場向けコミュニティサービスの投稿分類アシスタントです。投稿のタイトルと本文を読み、渡された候補タグの中から最も適切なものを最大1件選んでください。descriptionは管理者が用意した選択基準です。候補に無いタグ名を作り出さないでください。適切な分類がない場合は、候補に含まれる「その他」で始まるタグを選んでください。'

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tagNames: { type: 'array', items: { type: 'string' }, maxItems: 1 },
  },
  required: ['tagNames'],
}

type AssignTagsResult = {
  tagNames: string[]
}

export type TagAssignmentResult =
  | { status: 'assigned'; tagNames: string[] }
  | { status: 'failed'; tagNames: [] }
  | { status: 'skipped'; tagNames: [] }

export type TagCandidate = {
  name: string
  category: string
  description: string | null
}

/** AIの出力を登録済みタグとの完全一致で検証し、最大1件へ絞る。 */
export function selectValidTagNames(requestedNames: unknown, candidates: TagCandidate[]): string[] {
  if (!Array.isArray(requestedNames)) return []

  const candidatesByName = new Map(candidates.map((tag) => [tag.name, tag]))
  for (const name of requestedNames) {
    if (typeof name !== 'string') continue
    const tag = candidatesByName.get(name)
    if (tag) return [tag.name]
  }
  return []
}

/** Geminiの呼び出し結果とタグ名を返す。自動再試行は行わない。 */
export async function assignTagsWithStatus(
  title: string,
  body: string,
  candidates: TagCandidate[],
): Promise<TagAssignmentResult> {
  if (candidates.length === 0) return { status: 'skipped', tagNames: [] }

  try {
    const ai = new GoogleGenAI({
      apiKey: requireEnv('GEMINI_API_KEY'),
      httpOptions: { timeout: GEMINI_REQUEST_TIMEOUT_MS },
    })
    const promptCandidates = candidates.map(({ name, category, description }) => ({
      name,
      category,
      description,
    }))
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `候補タグ: ${JSON.stringify(promptCandidates)}\nタイトル: ${title}\n本文: ${body}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return { status: 'failed', tagNames: [] }
    const result = JSON.parse(text) as AssignTagsResult
    const tagNames = selectValidTagNames(result.tagNames, candidates)
    return tagNames.length > 0
      ? { status: 'assigned', tagNames }
      : { status: 'failed', tagNames: [] }
  } catch (error) {
    console.error('Gemini tag assignment failed', error)
    return { status: 'failed', tagNames: [] }
  }
}

/** タグ付与失敗を空配列へ倒す既存呼び出し向けの互換API。 */
export async function assignTags(
  title: string,
  body: string,
  candidates: TagCandidate[],
): Promise<string[]> {
  return (await assignTagsWithStatus(title, body, candidates)).tagNames
}
