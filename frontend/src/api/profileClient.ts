import { API_URLS } from '../config/env'
import { createApiClient } from './http'

const client = createApiClient(API_URLS.profile)

export interface ProfileResponse {
  user_id: number
  username: string | null
  bio?: string | null
}

export interface ProfileUpdatePayload {
  username?: string | null
  bio?: string | null
}

export const profileClient = {
  getProfile: () => client.get<ProfileResponse>('/profile/me'),
  updateProfile: (payload: ProfileUpdatePayload) => client.patch<ProfileResponse>('/profile/me', payload),
}
