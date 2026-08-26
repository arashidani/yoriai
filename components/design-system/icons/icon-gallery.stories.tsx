import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { IconAi } from './icon-ai'
import { IconBack } from './icon-back'
import { IconBell } from './icon-bell'
import { IconBookmark } from './icon-bookmark'
import { IconBubble } from './icon-bubble'
import { IconCheck } from './icon-check'
import { IconCircle } from './icon-circle'
import { IconClose } from './icon-close'
import { IconFire } from './icon-fire'
import { IconGear } from './icon-gear'
import { IconHuman } from './icon-human'
import { IconImg } from './icon-img'
import { IconLunch } from './icon-lunch'
import { IconPaw } from './icon-paw'
import { IconPencil } from './icon-pencil'
import { IconPlus } from './icon-plus'
import { IconPoint } from './icon-point'
import { IconRefresh } from './icon-refresh'
import { IconSend } from './icon-send'
import { IconSupport } from './icon-support'
import { IconSword } from './icon-sword'
import { IconTitle } from './icon-title'

const icons = [
  { name: 'bubble', Icon: IconBubble },
  { name: 'bookmark', Icon: IconBookmark },
  { name: 'paw', Icon: IconPaw },
  { name: 'bell', Icon: IconBell },
  { name: 'ai', Icon: IconAi },
  { name: 'send', Icon: IconSend },
  { name: 'back', Icon: IconBack },
  { name: 'close', Icon: IconClose },
  { name: 'check', Icon: IconCheck },
  { name: 'circle', Icon: IconCircle },
  { name: 'pencil', Icon: IconPencil },
  { name: 'sword', Icon: IconSword },
  { name: 'human', Icon: IconHuman },
  { name: 'gear', Icon: IconGear },
  { name: 'lunch', Icon: IconLunch },
  { name: 'img', Icon: IconImg },
  { name: 'fire', Icon: IconFire },
  { name: 'plus', Icon: IconPlus },
  { name: 'support', Icon: IconSupport },
  { name: 'title', Icon: IconTitle },
  { name: 'point', Icon: IconPoint },
  { name: 'refresh', Icon: IconRefresh },
]

function IconGallery() {
  return (
    <div className="grid grid-cols-5 gap-6 p-6 text-foreground">
      {icons.map(({ name, Icon }) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <Icon className="size-6 text-primary" />
          <p className="text-paragraph-mini text-secondary-foreground">{name}</p>
        </div>
      ))}
    </div>
  )
}

const meta = {
  component: IconGallery,
} satisfies Meta<typeof IconGallery>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('bubble')).toBeVisible()
    await expect(canvas.getByText('point')).toBeVisible()
  },
}
