import { createContext } from 'react'
import type { AuthUser } from '../types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  signUp: (payload: { email: string; display_name: string; password: string }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
