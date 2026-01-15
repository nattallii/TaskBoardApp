import { ApiError } from '../api/http'
import type { BannerKind } from '../store/notificationStore'

export interface ErrorState {
  message: string
  kind: BannerKind
}

interface ErrorStateOptions {
  fallbackMessage?: string
  treatInvalidCredentials?: boolean
  invalidCredentialsMessage?: string
}

const INVALID_STATUS_CODES = new Set([400, 401])

export function getApiErrorState(err: unknown, options?: ErrorStateOptions): ErrorState {
  const fallback = options?.fallbackMessage ?? 'Щось пішло не так'

  if (err instanceof ApiError) {
    if (options?.treatInvalidCredentials && INVALID_STATUS_CODES.has(err.status ?? 0)) {
      return {
        message: options.invalidCredentialsMessage ?? fallback,
        kind: err.kind,
      }
    }

    return {
      message: err.message || fallback,
      kind: err.kind,
    }
  }

  if (err instanceof Error) {
    return { message: err.message, kind: 'generic' }
  }

  return { message: fallback, kind: 'generic' }
}
