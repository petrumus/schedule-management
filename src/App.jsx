import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { supabaseConfigured } from './supabaseClient'
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

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h1>
          <p className="text-gray-600 mb-4">
            Supabase environment variables are not configured. Set the following in your environment or GitHub repository secrets:
          </p>
          <ul className="text-left text-sm text-gray-700 bg-gray-100 rounded p-4 space-y-1">
            <li><code className="font-mono">VITE_SUPABASE_URL</code></li>
            <li><code className="font-mono">VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>
      </div>
    )
  }

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
