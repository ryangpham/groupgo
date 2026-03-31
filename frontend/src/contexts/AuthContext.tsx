import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './auth-context'
import { getCurrentUser, login as loginRequest, signUp as signUpRequest } from '../lib/api'
import type { AuthResponse, AuthUser } from '../types/auth'
import type { AuthContextValue } from './auth-context'

const TOKEN_STORAGE_KEY = 'groupgo.auth.token'

function storeAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, auth.access_token)
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)))

  const applyAuth = useCallback((auth: AuthResponse) => {
    storeAuth(auth)
    setToken(auth.access_token)
    setUser(auth.user)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    getCurrentUser(token)
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout()
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [logout, token])

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const auth = await loginRequest(payload)
      applyAuth(auth)
    },
    [applyAuth],
  )

  const signUp = useCallback(
    async (payload: { email: string; display_name: string; password: string }) => {
      const auth = await signUpRequest(payload)
      applyAuth(auth)
    },
    [applyAuth],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      signUp,
      logout,
    }),
    [isLoading, login, logout, token, user, signUp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
