import type { Preview } from '@storybook/nextjs-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../app/globals.css'
import { Providers } from '../app/providers'
import { Toaster } from '../components/ui/sonner'
import { mswHandlers } from './msw-handlers'

initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <Providers>
        <Story />
        <Toaster />
      </Providers>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.users,
        ...mswHandlers.onboarding,
        ...mswHandlers.posts,
        ...mswHandlers.answers,
        ...mswHandlers.hiroba,
        ...mswHandlers.admin,
        ...mswHandlers.invites,
        ...mswHandlers.passwordResets,
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
