import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function PendingPage() {
  const { signOut } = useAuth()

  useEffect(() => {
    signOut()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-yellow-500 text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Not Activated</h2>
        <p className="text-gray-600 mb-6">
          Your account is not yet activated. Please use a valid invite link to gain access.
        </p>
        <a
          href="/schedule-management/"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Try again
        </a>
      </div>
    </div>
  )
}
