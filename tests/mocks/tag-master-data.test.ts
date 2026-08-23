import { describe, expect, it } from 'vitest'
import { MOCK_BUSINESS_SKILLS, MOCK_TAG_CATEGORIES, MOCK_TAGS } from '@/lib/mocks/fixtures'

describe('AIタグ用マスターデータ', () => {
  it('ビジネススキルと大ジャンルを文字列一致させる', () => {
    expect(MOCK_BUSINESS_SKILLS.map(({ name }) => name)).toEqual([
      '社内ルール・手続き',
      'IT・ツール操作',
      '業務スキル',
      '顧客対応・コミュニケーション',
      'IBJマインド・キャリア',
    ])
    expect(MOCK_TAG_CATEGORIES.map(({ name }) => name)).toEqual([
      '社内ルール・手続き',
      'IT・ツール操作',
      '業務スキル',
      '顧客対応・コミュニケーション',
      'IBJマインド・キャリア',
      'その他',
    ])
  })

  it('質問用の小ジャンル18件を定義する', () => {
    expect(MOCK_TAGS.map(({ name, category }) => ({ name, category }))).toEqual([
      { name: '勤怠・有給関連', category: '社内ルール・手続き' },
      { name: '経費精算', category: '社内ルール・手続き' },
      { name: '福利厚生', category: '社内ルール・手続き' },
      { name: '社内設備', category: '社内ルール・手続き' },
      { name: '社内ツール', category: 'IT・ツール操作' },
      { name: 'Office（Excel等）', category: 'IT・ツール操作' },
      { name: 'デザイナー向け', category: 'IT・ツール操作' },
      { name: 'エンジニア向け', category: 'IT・ツール操作' },
      { name: '一般IT知識', category: 'IT・ツール操作' },
      { name: '営業・商談', category: '業務スキル' },
      { name: '資料作成', category: '業務スキル' },
      { name: '企画アイディア', category: '業務スキル' },
      { name: 'タスク管理', category: '業務スキル' },
      { name: 'データ分析', category: '業務スキル' },
      { name: '仲間とのコミュニケーション', category: '顧客対応・コミュニケーション' },
      { name: 'お客様とのコミュニケーション', category: '顧客対応・コミュニケーション' },
      { name: 'キャリア相談', category: 'IBJマインド・キャリア' },
      { name: 'その他（雑談に近い質問）', category: 'その他' },
    ])
    expect(MOCK_TAGS.every(({ isWorkTag }) => isWorkTag)).toBe(true)
  })
})
