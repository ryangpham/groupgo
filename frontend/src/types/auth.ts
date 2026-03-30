export interface AuthUser {
  user_id: number
  email: string
  display_name: string
  is_active: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}
