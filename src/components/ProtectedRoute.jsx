import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Admin pages are never rendered (and their code is never even downloaded)
// unless the SERVER has confirmed this visitor is the admin.
// Real protection is in the database (RLS); this just keeps strangers out of the screens.
export default function ProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return null

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}