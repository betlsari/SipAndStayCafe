import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
    /** Kullanıcının sahip olması gereken rollerden en az biri */
    roles?: string[]
    children: ReactNode
}

/**
 * ProtectedRoute
 *
 * Kullanım:
 * <ProtectedRoute roles={['Owner', 'Cashier']}>
 *   <CashierDashboard />
 * </ProtectedRoute>
 *
 * - Token yoksa → /login'e yönlendir
 * - Token var ama yanlış rol → /login'e yönlendir (403 olarak da gösterilebilir)
 * - Her şey uygunsa → children render et
 */
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
    const location = useLocation()
    const { token, user } = useAuthStore()

    // Oturum açılmamış
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Rol kontrolü
    if (roles && roles.length > 0) {
        const userRoles = user.roles ?? []
        const hasRole = roles.some((r) => userRoles.includes(r))
        if (!hasRole) {
            return <Navigate to="/login" state={{ from: location }} replace />
        }
    }

    return <>{children}</>
}