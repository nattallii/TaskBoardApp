import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMemo, type ReactNode } from 'react'
import { useAuthStore } from '../store/auth'

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const location = useLocation()

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function AuthRedirect({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) {
    return <Navigate to="/boards" replace />
  }

  return <>{children}</>
}
