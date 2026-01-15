import { useAuthStore } from '../store/auth'
import { authClient } from './authClient'
import { notifyError } from '../lib/notifications'
import { useNotificationStore, type BannerKind } from '../store/notificationStore'

export class ApiError extends Error {
  status?: number
  kind: BannerKind

  constructor(message: string, options?: { status?: number; kind?: BannerKind }) {
    super(message)
    this.status = options?.status
    this.kind = options?.kind ?? 'generic'
  }
}

interface RequestOptions {
  skipAuth?: boolean
  headers?: Record<string, string>
}

const ALERT_KINDS: BannerKind[] = ['offline', 'cors', 'forbidden']

function classifyStatus(status?: number): BannerKind {
  if (!status || status === 0) {
    return 'cors'
  }
  if (status === 403 || status === 401) {
    return 'forbidden'
  }
  if (status === 503 || status === 504) {
    return 'offline'
  }
  return 'generic'
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(errorText || response.statusText, {
      status: response.status,
      kind: classifyStatus(response.status),
    })
  }
  if (response.status === 204) {
    return {} as T
  }
  return (await response.json()) as T
}

function buildHeaders(options?: RequestOptions) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  if (!options?.skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

async function refreshAccessToken() {
  const { refreshToken, setTokens } = useAuthStore.getState()
  if (!refreshToken) {
    return null
  }
  try {
    const response = await authClient.refresh(refreshToken)
    setTokens({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    })
    return response.access_token
  } catch {
    useAuthStore.getState().clear()
    notifyError('Session expired', 'Please sign in again.')
    return null
  }
}

export function createApiClient(baseUrl: string) {
  const request = async <T>(
    path: string,
    init?: RequestInit,
    options?: RequestOptions,
    retryOnUnauthorized = true,
  ): Promise<T> => {
    const notificationStore = useNotificationStore.getState()

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: buildHeaders(options),
      })

      if (response.status === 401 && !options?.skipAuth && retryOnUnauthorized) {
        const newToken = await refreshAccessToken()
        if (newToken) {
          return request<T>(path, init, options, false)
        }
        throw new ApiError('Unauthorized', { status: 401, kind: 'forbidden' })
      }

      return await parseResponse<T>(response)
    } catch (err) {
      let normalized: ApiError

      if (err instanceof ApiError) {
        normalized = err
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        normalized = new ApiError('Unable to reach the server', { kind: 'offline' })
      } else if (err instanceof Error) {
        normalized = new ApiError(err.message)
      } else {
        normalized = new ApiError('Request failed')
      }

      if (ALERT_KINDS.includes(normalized.kind)) {
        notificationStore.setBanner({ kind: normalized.kind, message: normalized.message })
      }

      throw normalized
    }
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { method: 'GET' }, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(
        path,
        {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        },
        options,
      ),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(
        path,
        {
          method: 'PUT',
          body: body ? JSON.stringify(body) : undefined,
        },
        options,
      ),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(
        path,
        {
          method: 'PATCH',
          body: body ? JSON.stringify(body) : undefined,
        },
        options,
      ),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { method: 'DELETE' }, options),
  }
}
