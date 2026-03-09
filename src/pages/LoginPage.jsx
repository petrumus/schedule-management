import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { selectRole } = useAuth()
  const navigate = useNavigate()

  function handleSelect(role) {
    selectRole(role)
    navigate('/calendar')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shift Scheduler</h1>
        <p className="text-gray-600 mb-8">Select a role to continue</p>

        <div className="space-y-3">
          <button
            onClick={() => handleSelect('admin')}
            className="w-full bg-purple-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Enter as Admin
          </button>
          <button
            onClick={() => handleSelect('user')}
            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Enter as User
          </button>
        </div>
      </div>
    </div>
  )
}
