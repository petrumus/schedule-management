import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ShiftTypeManager from '../components/Admin/ShiftTypeManager'
import DefaultScheduleEditor from '../components/Admin/DefaultScheduleEditor'
import BonusLimitEditor from '../components/Admin/BonusLimitEditor'

const TABS = [
  { id: 'shifts', label: 'Shift Types' },
  { id: 'schedules', label: 'Default Schedules' },
  { id: 'limits', label: 'Bonus Limits' },
]

export default function AdminPage() {
  const { isAdmin, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('shifts')

  if (!isAdmin) {
    navigate('/calendar')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => navigate('/calendar')}
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              &larr; Back to Calendar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{profile?.full_name || profile?.email}</span>
            <button
              onClick={signOut}
              className="bg-gray-100 text-gray-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-200 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'shifts' && <ShiftTypeManager />}
        {activeTab === 'schedules' && <DefaultScheduleEditor />}
        {activeTab === 'limits' && <BonusLimitEditor />}
      </div>
    </div>
  )
}
