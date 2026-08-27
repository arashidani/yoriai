import { describe, expect, it } from 'vitest'
import { toModerationResult } from '@/lib/ai/moderate-post'

function payload(overrides: {
  flagged: boolean
  categories: Record<string, boolean>
  scores: Record<string, number>
}) {
  return {
    results: [
      {
        flagged: overrides.flagged,
        categories: overrides.categories,
        category_scores: overrides.scores,
      },
    ],
  }
}

describe('toModerationResult', () => {
  it('violence が flagged なら非公開判定にする', () => {
    expect(
      toModerationResult(
        payload({
          flagged: true,
          categories: { violence: true, sexual: false },
          scores: { violence: 0.897, sexual: 0.01 },
        }),
      ),
    ).toEqual({ flagged: true, severity: 'HIGH', reason: '暴力' })
  })

  it('OpenAI が flagged: false ならスコアが高くても公開のままにする', () => {
    expect(
      toModerationResult(
        payload({
          flagged: false,
          categories: { violence: false, sexual: false },
          scores: { violence: 0.45, sexual: 0.29 },
        }),
      ),
    ).toEqual({ flagged: false, severity: 'LOW', reason: '' })
  })
})
