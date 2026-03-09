import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import InvitePage from './pages/InvitePage'
import PendingPage from './pages/PendingPage'
import CalendarPage from './pages/CalendarPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  if (profile?.role === 'pending') return <Navigate to="/pending" replace />

  return children
}

export default function App() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          session && profile?.role !== 'pending'
            ? <Navigate to="/calendar" replace />
            : <LoginPage />
        }
      />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
