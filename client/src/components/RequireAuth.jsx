import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Status'

export default function RequireAuth({ admin = false, children }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
