import { GoogleGenAI } from '@google/genai'
import { requireEnv } from '@/lib/env'

const SYSTEM_INSTRUCTION =
  'あなたは職場向けQ&Aサービスの投稿分類アシスタントです。投稿のタイトルと本文を読み、渡された候補タグの中から最も適切なものを最大3件選んでください。候補に無いタグ名を作り出さないでください。適切なタグが無い場合は空配列を返してください。'

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

/** Gemini呼び出しに失敗した場合や候補タグが無い場合は空配列を返す（投稿作成自体は失敗させない） */
export async function assignTags(
  title: string,
  body: string,
  availableTagNames: string[],
): Promise<string[]> {
  if (availableTagNames.length === 0) return []

  try {
    const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `候補タグ: ${availableTagNames.join(', ')}\nタイトル: ${title}\n本文: ${body}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return []
    const result = JSON.parse(text) as AssignTagsResult
    const availableSet = new Set(availableTagNames)
    return result.tagNames.filter((name) => availableSet.has(name)).slice(0, 3)
  } catch (error) {
    console.error('Gemini tag assignment failed', error)
    return []
  }
}
