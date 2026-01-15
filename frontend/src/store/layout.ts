import { create } from 'zustand'

interface LayoutState {
  boardTitle: string | null
  setBoardTitle: (title: string | null) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  boardTitle: null,
  setBoardTitle: (boardTitle) => set({ boardTitle }),
}))
