import { GoogleGenAI } from '@google/genai'
import {
  GEMINI_REQUEST_TIMEOUT_MS,
  GeminiServiceUnavailableError,
  isGeminiServiceUnavailable,
} from '@/lib/ai/errors'
import { requireEnv } from '@/lib/env'

const SYSTEM_INSTRUCTION =
  'あなたは職場向けコミュニティサービスのコンテンツモデレーターです。投稿のタイトルと本文を読み、脅迫・ハラスメント・差別的表現・暴力の示唆・個人攻撃に加え、露骨な下ネタ、排泄物を使った下品な表現（例：「うんち」）、不謹慎な冗談など、職場で許容されない内容が含まれるかを判定してください。ただし、業務上・医療上必要な文脈や、技術的な不満、単なるネガティブな感想は対象外です。'

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

async function moderate(
  contents: string,
  options: { failOnServiceUnavailable?: boolean } = {},
): Promise<ModerationResult | null> {
  try {
    const ai = new GoogleGenAI({
      apiKey: requireEnv('GEMINI_API_KEY'),
      httpOptions: { timeout: GEMINI_REQUEST_TIMEOUT_MS },
    })
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
    if (options.failOnServiceUnavailable && isGeminiServiceUnavailable(error)) {
      throw new GeminiServiceUnavailableError()
    }
    return null
  }
}

/** 503・タイムアウトは送出し、それ以外のGemini失敗は判定なしへ倒す。 */
export async function moderatePost(title: string, body: string): Promise<ModerationResult | null> {
  return moderate(`タイトル: ${title}\n本文: ${body}`, { failOnServiceUnavailable: true })
}

/** 既定は判定なしへ倒す。Q&A回答では503・タイムアウトを呼び出し側へ送出できる。 */
export async function moderateAnswer(
  body: string,
  options: { failOnServiceUnavailable?: boolean } = {},
): Promise<ModerationResult | null> {
  return moderate(`本文: ${body}`, options)
}
