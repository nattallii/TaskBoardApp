import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: number | null
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  setUserId: (id: number | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  setTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  setUserId: (userId) => set({ userId }),
  clear: () => set({ accessToken: null, refreshToken: null, userId: null }),
}))
