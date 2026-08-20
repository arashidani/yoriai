import { describe, expect, it } from 'vitest'
import { selectAnswerableQuestions } from '@/lib/questions/select-answerable-questions'

const question = (id: string) => ({ id })

describe('selectAnswerableQuestions', () => {
  it('スキル関連の質問を最大3件ランダムに選ぶ', () => {
    const candidates = [
      question('skill-1'),
      question('skill-2'),
      question('skill-3'),
      question('skill-4'),
    ]
    const selected = selectAnswerableQuestions(candidates, [question('other-1')], 3, () => 0)
    const differentlyShuffled = selectAnswerableQuestions(candidates, [], 3, () => 0.999)

    expect(selected).toHaveLength(3)
    expect(selected.every(({ id }) => id.startsWith('skill-'))).toBe(true)
    expect(selected.map(({ id }) => id)).not.toEqual(differentlyShuffled.map(({ id }) => id))
  })

  it('不足分をその他の質問で重複なく補う', () => {
    const selected = selectAnswerableQuestions(
      [question('skill-1')],
      [question('skill-1'), question('other-1'), question('other-2'), question('other-3')],
      3,
      () => 0,
    )

    expect(selected).toHaveLength(3)
    expect(new Set(selected.map(({ id }) => id)).size).toBe(3)
    expect(selected[0]).toEqual(question('skill-1'))
  })

  it('ビジネススキルがない場合はその他の質問だけを返す', () => {
    const selected = selectAnswerableQuestions(
      [],
      [question('other-1'), question('other-2'), question('other-3'), question('other-4')],
      3,
      () => 0,
    )

    expect(selected).toHaveLength(3)
    expect(selected.every(({ id }) => id.startsWith('other-'))).toBe(true)
  })

  it('その他を含めても3件に満たない場合は存在する質問だけを返す', () => {
    const selected = selectAnswerableQuestions([], [question('other-1'), question('other-2')])

    expect(selected).toHaveLength(2)
  })
})
