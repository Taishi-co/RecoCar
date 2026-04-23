import { create } from 'zustand'

interface AuthState {
  token: string | null
  adminInfo: {
    id: string
    username: string
    role: string
  } | null
  setToken: (token: string) => void
  setAdminInfo: (info: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  adminInfo: JSON.parse(localStorage.getItem('admin_info') || 'null'),
  setToken: (token) => {
    localStorage.setItem('admin_token', token)
    set({ token })
  },
  setAdminInfo: (info) => {
    localStorage.setItem('admin_info', JSON.stringify(info))
    set({ adminInfo: info })
  },
  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
    set({ token: null, adminInfo: null })
  },
}))
