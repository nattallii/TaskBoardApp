const getEnvVar = (key: string, fallback?: string) => {
  const value = import.meta.env[key]
  if (!value && !fallback) {
    console.warn(`Missing env variable: ${key}`)
  }
  return value ?? fallback ?? ''
}

export const API_URLS = {
  auth: getEnvVar('VITE_API_AUTH_URL', '/auth/api/v1/auth'),
  board: getEnvVar('VITE_API_BOARD_URL', '/board/api/v1'),
  profile: getEnvVar('VITE_API_PROFILE_URL', '/profile/api/v1'),
} as const
