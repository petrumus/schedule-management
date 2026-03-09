import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CancellationRequests from './Manager/CancellationRequests'
import InviteGenerator from './Invite/InviteGenerator'
import InviteTable from './Invite/InviteTable'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function Header({
  selectedMonth, selectedYear, onMonthChange, onYearChange,
  users, selectedUserId, onUserChange, pendingRequestCount
}) {
  const { profile, signOut, isAdmin, isAdminOrManager } = useAuth()
  const navigate = useNavigate()
  const [showRequests, setShowRequests] = useState(false)
  const [showInvites, setShowInvites] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl font-bold text-gray-900">Shift Scheduler</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {isAdminOrManager && users && users.length > 0 && (
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => onUserChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAdminOrManager && (
                <button
                  onClick={() => setShowRequests(true)}
                  className="relative bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-yellow-100 transition-colors cursor-pointer"
                >
                  Requests
                  {pendingRequestCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingRequestCount}
                    </span>
                  )}
                </button>
              )}

              {isAdminOrManager && (
                <button
                  onClick={() => setShowInvites(true)}
                  className="bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-green-100 transition-colors cursor-pointer"
                >
                  Invite Users
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-purple-50 text-purple-700 border border-purple-200 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  Admin
                </button>
              )}

              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-gray-600 bg-gray-100 rounded-md px-2 py-1 font-medium capitalize">{profile?.role}</span>
                <button
                  onClick={signOut}
                  className="bg-gray-100 text-gray-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Switch Role
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showRequests && (
        <Modal title="Cancellation Requests" onClose={() => setShowRequests(false)}>
          <CancellationRequests onUpdate={() => setShowRequests(false)} />
        </Modal>
      )}

      {showInvites && (
        <Modal title="Invite Management" onClose={() => setShowInvites(false)}>
          <InviteGenerator />
          <hr className="my-4" />
          <InviteTable />
        </Modal>
      )}
    </>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
