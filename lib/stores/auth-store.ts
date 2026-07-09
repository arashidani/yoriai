import { create } from 'zustand'
import type { MOCK_USERS } from '@/lib/mocks/fixtures'

type MockUser = (typeof MOCK_USERS)[number]

type AuthStore = {
  user: MockUser | null
  setUser: (user: MockUser | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
