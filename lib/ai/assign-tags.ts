import { GoogleGenAI } from '@google/genai'
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
  | { status: 'failed'; tagNames: []; httpStatus: number | null }
  | { status: 'skipped'; tagNames: [] }

export type TagAssignmentErrorStatus = 422 | 429 | 502 | 503 | 504

export type TagCandidate = {
  name: string
  category: string
  description: string | null
}

function httpStatusFromError(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status
  }
  return null
}

/** Gemini失敗の原因を、クライアントへ返すHTTPステータスへ写す。 */
export function toTagAssignmentErrorStatus(
  result: Exclude<TagAssignmentResult, { status: 'assigned' }>,
): TagAssignmentErrorStatus {
  if (result.status === 'skipped') return 422
  const status = result.httpStatus
  if (status === 429) return 429
  if (status === 503) return 503
  if (status === 504) return 504
  if (status == null) return 422
  return 502
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
    const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
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
    if (!text) return { status: 'failed', tagNames: [], httpStatus: null }
    let parsed: AssignTagsResult
    try {
      parsed = JSON.parse(text) as AssignTagsResult
    } catch {
      return { status: 'failed', tagNames: [], httpStatus: null }
    }
    const tagNames = selectValidTagNames(parsed.tagNames, candidates)
    return tagNames.length > 0
      ? { status: 'assigned', tagNames }
      : { status: 'failed', tagNames: [], httpStatus: null }
  } catch (error) {
    console.error('Gemini tag assignment failed', error)
    return { status: 'failed', tagNames: [], httpStatus: httpStatusFromError(error) ?? 502 }
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
