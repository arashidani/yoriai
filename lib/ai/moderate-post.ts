import { requireEnv } from '@/lib/env'

const MODERATION_URL = 'https://api.openai.com/v1/moderations'
const MODEL = 'omni-moderation-latest'
const TIMEOUT_MS = 5000

const CATEGORY_LABELS: Record<string, string> = {
  harassment: 'ハラスメント',
  'harassment/threatening': '脅迫的ハラスメント',
  hate: 'ヘイト',
  'hate/threatening': '脅迫的ヘイト',
  illicit: '違法行為',
  'illicit/violent': '暴力を伴う違法行為',
  'self-harm': '自傷',
  'self-harm/intent': '自傷の意図',
  'self-harm/instructions': '自傷の方法',
  sexual: '性的な内容',
  'sexual/minors': '未成年の性的な内容',
  violence: '暴力',
  'violence/graphic': '生々しい暴力',
}

export type ModerationResult = {
  flagged: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}

/** 配列・null を除いたプレーンオブジェクトか。OpenAI 応答のトップレベルと results[0] の型を狭める。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `categories`（キー → 判定フラグ）の形か。値が boolean 以外なら写像せず null に倒す。 */
function isBooleanMap(value: unknown): value is Record<string, boolean> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'boolean')
}

/** `category_scores`（キー → 0..1）の形か。値が number 以外なら写像せず null に倒す。 */
function isNumberMap(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'number')
}

/** true になったカテゴリの最大スコアを AiFlag の severity へ写す。 */
function toSeverity(maxScore: number): ModerationResult['severity'] {
  if (maxScore >= 0.8) return 'HIGH'
  if (maxScore >= 0.5) return 'MEDIUM'
  return 'LOW'
}

/** OpenAI Moderation の `results[0]` を既存の判定形へ写す。不正ペイロードは null。 */
export function toModerationResult(payload: unknown): ModerationResult | null {
  if (!isRecord(payload) || !Array.isArray(payload.results) || payload.results.length === 0)
    return null

  const first = payload.results[0]
  if (!isRecord(first) || typeof first.flagged !== 'boolean') return null
  const categories = first.categories
  const scores = first.category_scores
  if (!isBooleanMap(categories) || !isNumberMap(scores)) return null

  const flaggedKeys = Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([key]) => key)
  const maxScore = flaggedKeys.reduce((highest, key) => {
    const score = scores[key]
    return typeof score === 'number' && score > highest ? score : highest
  }, 0)

  return {
    flagged: first.flagged,
    severity: toSeverity(maxScore),
    reason: flaggedKeys.map((key) => CATEGORY_LABELS[key] ?? key).join(', '),
  }
}

async function moderate(input: string): Promise<ModerationResult | null> {
  try {
    /** Next.js の fetch キャッシュが別投稿の判定を使い回さないようにする */
    const response = await fetch(MODERATION_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${requireEnv('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, input }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      console.error('OpenAI moderation failed', response.status, await response.text())
      return null
    }
    const result = toModerationResult(await response.json())
    if (!result) console.error('OpenAI moderation failed', 'invalid payload')
    return result
  } catch (error) {
    console.error('OpenAI moderation failed', error)
    return null
  }
}

/** OpenAI呼び出しに失敗した場合はnullを返す（投稿作成自体は失敗させない） */
export async function moderatePost(title: string, body: string): Promise<ModerationResult | null> {
  return moderate(`タイトル: ${title}\n本文: ${body}`)
}

/** OpenAI呼び出しに失敗した場合はnullを返す（回答作成自体は失敗させない） */
export async function moderateAnswer(body: string): Promise<ModerationResult | null> {
  return moderate(`本文: ${body}`)
}
