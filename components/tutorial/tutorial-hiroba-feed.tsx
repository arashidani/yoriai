'use client'

import type { ComponentProps } from 'react'
import { HirobaFeed } from '@/components/hiroba/hiroba-feed'
import { TUTORIAL_HIROBA_POSTS, useFeatureTutorial } from './feature-tutorial'

type TutorialHirobaFeedProps = ComponentProps<typeof HirobaFeed>

export function TutorialHirobaFeed({ hiroba, posts, ...props }: TutorialHirobaFeedProps) {
  const { active } = useFeatureTutorial()
  const visiblePosts =
    active && hiroba.slug === 'feature-testing' ? [...TUTORIAL_HIROBA_POSTS, ...posts] : posts

  return <HirobaFeed hiroba={hiroba} posts={visiblePosts} {...props} />
}
