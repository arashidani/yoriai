import { create } from 'zustand'

type NotificationPanelState = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * 受信トレイの開閉状態。
 * サイドバーの通知ボタンとレイアウト側のパネル列が別ツリーにあるため、ストアで共有する。
 */
export const useNotificationPanelStore = create<NotificationPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
