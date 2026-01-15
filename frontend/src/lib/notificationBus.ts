export type NotificationStatus = 'success' | 'error' | 'info' | 'warning'

export interface NotificationPayload {
  status: NotificationStatus
  title: string
  description?: string
  meta?: Record<string, string>
}

type Listener = (notification: NotificationPayload) => void

const listeners = new Set<Listener>()

export function subscribeToNotifications(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitNotification(notification: NotificationPayload) {
  listeners.forEach((listener) => listener(notification))
}

export function notifySuccess(title: string, description?: string) {
  emitNotification({ status: 'success', title, description })
}

export function notifyError(title: string, description?: string) {
  emitNotification({ status: 'error', title, description })
}

export function notifyInfo(title: string, description?: string) {
  emitNotification({ status: 'info', title, description })
}

export function notifyOffline(description?: string) {
  emitNotification({ status: 'warning', title: 'Offline', description })
}
