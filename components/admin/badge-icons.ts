import { Award, Crown, Medal, Sparkles, Star, Trophy } from 'lucide-react'

export const BADGE_ICONS = { Medal, Award, Crown, Sparkles, Star, Trophy } as const

export type BadgeIconName = keyof typeof BADGE_ICONS

export const RARITY_STYLES: Record<string, string> = {
  BRONZE: 'bg-amber-700/10 text-amber-700',
  SILVER: 'bg-slate-400/10 text-slate-500',
  GOLD: 'bg-yellow-500/10 text-yellow-600',
  PLATINUM: 'bg-violet-500/10 text-violet-600',
}

export const RARITY_LABELS: Record<string, string> = {
  BRONZE: 'ブロンズ',
  SILVER: 'シルバー',
  GOLD: 'ゴールド',
  PLATINUM: 'プラチナ',
}
