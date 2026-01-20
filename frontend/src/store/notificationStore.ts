import { create } from 'zustand'

export type BannerKind = 'offline' | 'cors' | 'forbidden' | 'generic'

interface BannerState {
  banner: { kind: BannerKind; message: string } | null
  setBanner: (banner: { kind: BannerKind; message: string } | null) => void
  clearBanner: () => void
}

export const useNotificationStore = create<BannerState>((set) => ({
  banner: null,
  setBanner: (banner) => set({ banner }),
  clearBanner: () => set({ banner: null }),
}))
