import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  updateProfile: (fields: { name: string; university: string; course: number | null }) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: '',
      name: '',
      email: '',
      role: 'student',
      avatar_url: null,
      university: null,
      course: null,
      isLoggedIn: false,
      token: null,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      updateProfile: async (fields) => {
        const state = useUserStore.getState()
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: state.id, ...fields }),
        })
        const data = await res.json()
        if (data.user) set((s) => ({ ...s, ...data.user }))
      },
      logout: () => {
        localStorage.removeItem('emolearn_token')
        set({ isLoggedIn: false, token: null, id: '', name: '', email: '', role: 'student' })
      },
    }),
    {
      name: 'emolearn-user-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        id: state.id, 
        name: state.name, 
        email: state.email, 
        role: state.role, 
        isLoggedIn: state.isLoggedIn, 
        token: state.token,
        avatar_url: state.avatar_url,
        university: state.university,
        course: state.course
      }),
    }
  )
)
