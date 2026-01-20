import { API_URLS } from '../config/env'
import { createApiClient } from './http'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  username: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  user_id: number
}

const client = createApiClient(API_URLS.auth)

export const authClient = {
  login: (payload: LoginPayload) =>
    client.post<TokenResponse>('/login', payload, { skipAuth: true }),
  register: (payload: RegisterPayload) =>
    client.post<TokenResponse>('/register', payload, { skipAuth: true }),
  refresh: (refreshToken: string) =>
    client.post<TokenResponse>(
      '/refresh',
      { refresh_token: refreshToken },
      { skipAuth: true },
    ),
}
