import { create } from 'zustand'

interface UserState {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
  university: string | null
  course: number | null
  isLoggedIn: boolean
  token: string | null
  setUser: (user: Partial<UserState>) => void
  logout: () => void
}

const savedToken = localStorage.getItem('emolearn_token')

export const useUserStore = create<UserState>((set) => ({
  id: '',
  name: '',
  email: '',
  role: 'student',
  avatar_url: null,
  university: null,
  course: null,
  // Start logged out if no token, otherwise we should verify token but we'll trust it initially for UX
  isLoggedIn: !!savedToken,
  token: savedToken,
  setUser: (user) => set((state) => ({ ...state, ...user })),
  logout: () => {
    localStorage.removeItem('emolearn_token')
    set({ isLoggedIn: false, token: null, id: '', name: '', email: '', role: 'student' })
  },
}))
