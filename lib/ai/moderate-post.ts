import { GoogleGenAI } from '@google/genai'
import { requireEnv } from '@/lib/env'

const SYSTEM_INSTRUCTION =
  'あなたは職場向けQ&Aサービスのコンテンツモデレーターです。投稿のタイトルと本文を読み、脅迫・ハラスメント・差別的表現・暴力の示唆・個人攻撃など、職場で許容されない内容が含まれるかを判定してください。技術的な不満や単なるネガティブな感想は対象外です。'

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    flagged: { type: 'boolean' },
    severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    reason: { type: 'string' },
  },
  required: ['flagged', 'severity', 'reason'],
}

export type ModerationResult = {
  flagged: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}

async function moderate(contents: string): Promise<ModerationResult | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return null
    return JSON.parse(text) as ModerationResult
  } catch (error) {
    console.error('Gemini moderation failed', error)
    return null
  }
}

/** Gemini呼び出しに失敗した場合はnullを返す（投稿作成自体は失敗させない） */
export async function moderatePost(title: string, body: string): Promise<ModerationResult | null> {
  return moderate(`タイトル: ${title}\n本文: ${body}`)
}

/** Gemini呼び出しに失敗した場合はnullを返す（回答作成自体は失敗させない） */
export async function moderateAnswer(body: string): Promise<ModerationResult | null> {
  return moderate(`本文: ${body}`)
}
