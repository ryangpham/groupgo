import type { AuthResponse, AuthUser } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
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

export function getTrip(token: string, tripId: string) {
  return request<Record<string, unknown>>(`/trips/${tripId}`, { token })
}

export function createTrip(
  token: string,
  payload: {
    trip_name: string
    destination_text?: string
    destination_lat?: number | null
    destination_lng?: number | null
    start_date: string
    end_date: string
    owner_user_id: number
  },
) {
  return request<Record<string, unknown>>('/trips', { method: 'POST', token, body: payload })
}

export function getTripTasks(token: string, tripId: string) {
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/tasks`, { token })
}

export function getTripMembers(token: string, tripId: string)
{
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/members`, { token })
}


export async function inviteTripMember(token: string, trip_id: string, email: string)
{
  const response = await fetch(`${API_BASE_URL}/trips/${trip_id}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({email}),
    })

    const data = await response.json()

    if(!response.ok)
    {
      throw new ApiError(
      typeof data?.detail === 'string' ? data.detail : 'Unable to Add member',
      response.status,
      )
    }

    return data
}

export function getTripOverview(token: string, tripId: string) {
  return request<Record<string, unknown>>(`/trips/${tripId}/overview`, { token })
}

export function getTripExpenses(token: string, tripId: string) {
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/expenses`, { token })
}

export function getTripExpenseSummary(token: string, tripId: string) {
  return request<Record<string, unknown>>(`/trips/${tripId}/expenses/summary`, { token })
}

export function createExpense(
  token: string,
  payload: {
    trip_id: number
    description: string
    amount: number
    expense_date: string
    paid_by_user_id: number
    splits: Array<{
      user_id: number
      owed_amount: number
      paid_amount: number
    }>
  },
) {
  return request<Record<string, unknown>>('/expenses', { method: 'POST', token, body: payload })
}

export function updateExpense(
  token: string,
  expenseId: string,
  payload: {
    trip_id?: number
    description?: string
    amount?: number
    expense_date?: string
    paid_by_user_id?: number
    splits?: Array<{
      user_id: number
      owed_amount: number
      paid_amount: number
    }>
  },
) {
  return request<Record<string, unknown>>(`/expenses/${expenseId}`, { method: 'PUT', token, body: payload })
}

export function deleteExpense(token: string, expenseId: string) {
  return request<Record<string, unknown>>(`/expenses/${expenseId}`, { method: 'DELETE', token })
}

export function updateExpensePayment(
  token: string,
  expenseId: string,
  userId: string,
  payload: { paid_amount: number },
) {
  return request<Record<string, unknown>>(`/expenses/${expenseId}/splits/${userId}/payment`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function createTask(
  token: string,
  payload: { trip_id: number; title: string; due_date: string | null; completed?: boolean; assigned_user_id?: number | null },
) {
  return request<Record<string, unknown>>('/tasks', { method: 'POST', token, body: payload })
}

export function updateTask(
  token: string,
  taskId: string,
  payload: {
    trip_id?: number
    title?: string
    due_date?: string | null
    completed?: boolean
    assigned_user_id?: number | null
  },
) {
  return request<Record<string, unknown>>(`/tasks/${taskId}`, { method: 'PUT', token, body: payload })
}

export function deleteTask(token: string, taskId: string) {
  return request<Record<string, unknown>>(`/tasks/${taskId}`, { method: 'DELETE', token })
}

export function getTripReservations(token: string, tripId: string) {
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/reservations`, { token })
}

export function getTripPlaces(token: string, tripId: string) {
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/places`, { token })
}

export function searchTripPlaces(token: string, tripId: string, query: string) {
  const searchParams = new URLSearchParams({ q: query })
  return request<Array<Record<string, unknown>>>(`/trips/${tripId}/places/search?${searchParams.toString()}`, { token })
}

export function createPlace(
  token: string,
  payload: {
    trip_id: number
    place_name: string
    address?: string | null
    rating?: number | null
    place_type?: string | null
  },
) {
  return request<Record<string, unknown>>('/places', { method: 'POST', token, body: payload })
}

export function updatePlace(
  token: string,
  placeId: string,
  payload: {
    trip_id?: number
    place_name?: string | null
    address?: string | null
    rating?: number | null
    place_type?: string | null
  },
) {
  return request<Record<string, unknown>>(`/places/${placeId}`, { method: 'PUT', token, body: payload })
}

export function deletePlace(token: string, placeId: string) {
  return request<Record<string, unknown>>(`/places/${placeId}`, { method: 'DELETE', token })
}

export function createReservation(
  token: string,
  payload: {
    trip_id: number
    provider?: string | null
    place_name?: string | null
    reservation_type?: string | null
    reservation_date?: string | null
    confirmation_no?: string | null
    place_id?: number | null
  },
) {
  return request<Record<string, unknown>>('/reservations', { method: 'POST', token, body: payload })
}

export function updateReservation(
  token: string,
  reservationId: string,
  payload: {
    trip_id?: number
    provider?: string | null
    place_name?: string | null
    reservation_type?: string | null
    reservation_date?: string | null
    confirmation_no?: string | null
    place_id?: number | null
  },
) {
  return request<Record<string, unknown>>(`/reservations/${reservationId}`, { method: 'PUT', token, body: payload })
}

export function deleteReservation(token: string, reservationId: string) {
  return request<Record<string, unknown>>(`/reservations/${reservationId}`, { method: 'DELETE', token })
}
