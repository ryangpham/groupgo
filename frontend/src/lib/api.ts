import type { AuthResponse, AuthUser } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  token?: string | null
  body?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'Something went wrong'

    throw new ApiError(message, response.status)
  }

  return data as T
}

export function login(payload: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: payload })
}

export function signUp(payload: { email: string; display_name: string; password: string }) {
  return request<AuthResponse>('/auth/signup', { method: 'POST', body: payload })
}

export function getCurrentUser(token: string) {
  return request<AuthUser>('/auth/me', { token })
}

export function getUserTrips(token: string, userId: number) {
  return request<Array<Record<string, unknown>>>(`/users/${userId}/trips`, { token })
}

export function createTrip(
  token: string,
  payload: { trip_name: string; destination?: string; start_date: string; end_date: string; owner_user_id: number },
) {
  return request<Record<string, unknown>>('/trips', { method: 'POST', token, body: payload })
}
