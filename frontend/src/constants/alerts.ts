import type { BannerKind } from '../store/notificationStore'

interface AlertTone {
  title: string
  bg: string
  border: string
  color: string
}

export const ALERT_TONES: Record<BannerKind, AlertTone> = {
  offline: {
    title: 'Offline mode',
    bg: 'yellow.50',
    border: 'yellow.200',
    color: 'yellow.800',
  },
  cors: {
    title: 'CORS blocked',
    bg: 'purple.50',
    border: 'purple.200',
    color: 'purple.800',
  },
  forbidden: {
    title: 'Access denied',
    bg: 'orange.50',
    border: 'orange.200',
    color: 'orange.800',
  },
  generic: {
    title: 'Something went wrong',
    bg: 'red.50',
    border: 'red.200',
    color: 'red.800',
  },
}

export function getAlertTone(kind: BannerKind): AlertTone {
  return ALERT_TONES[kind] ?? ALERT_TONES.generic
}
