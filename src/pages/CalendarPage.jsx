import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import CalendarGrid from '../components/Calendar/CalendarGrid'
import ShiftDropdown from '../components/Calendar/ShiftDropdown'
import toast from 'react-hot-toast'

export default function CalendarPage() {
  const { profile, isAdmin, isAdminOrManager } = useAuth()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedUserId, setSelectedUserId] = useState(profile?.id)
  const [users, setUsers] = useState([])
  const [shiftTypes, setShiftTypes] = useState({})
  const [scheduleMap, setScheduleMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [pendingCancellations, setPendingCancellations] = useState(new Set())
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const viewingUserId = selectedUserId || profile?.id
  const isViewingOther = viewingUserId !== profile?.id
  const isAdminOverride = isAdmin && isViewingOther

  useEffect(() => {
    setSelectedUserId(profile?.id)
  }, [profile?.id])

  useEffect(() => {
    fetchShiftTypes()
    if (isAdminOrManager) {
      fetchUsers()
      fetchPendingRequestCount()
    }
  }, [isAdminOrManager])

  useEffect(() => {
    if (viewingUserId) fetchSchedule()
  }, [selectedMonth, selectedYear, viewingUserId])

  async function fetchShiftTypes() {
    const { data } = await supabase.from('shift_types').select('*')
    if (data) {
      const map = {}
      data.forEach(st => { map[st.id] = st })
      setShiftTypes(map)
    }
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .neq('role', 'pending')
      .order('full_name')
    if (data) setUsers(data)
  }

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    const { data: defaults } = await supabase
      .from('default_schedules')
      .select('*')
      .eq('user_id', viewingUserId)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    const { data: selections } = await supabase
      .from('shift_selections')
      .select('*')
      .eq('user_id', viewingUserId)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    const map = {}
    if (defaults) {
      defaults.forEach(d => {
        map[d.day] = { shift_type_id: d.shift_type_id, source: 'default' }
      })
    }
    if (selections) {
      selections.forEach(s => {
        if (s.status !== 'cancelled') {
          map[s.day] = {
            shift_type_id: s.shift_type_id,
            source: 'selection',
            is_bonus: s.is_bonus,
            status: s.status,
            id: s.id
          }
        }
      })
    }
    setScheduleMap(map)

    const pendingDays = new Set()
    if (selections) {
      selections.forEach(s => {
        if (s.status === 'cancellation_requested') pendingDays.add(s.day)
      })
    }
    setPendingCancellations(pendingDays)
    setLoading(false)
  }, [viewingUserId, selectedYear, selectedMonth])

  async function fetchPendingRequestCount() {
    const { count } = await supabase
      .from('cancellation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingRequestCount(count || 0)
  }

  function handleDayClick(day) {
    if (pendingCancellations.has(day) && !isAdminOverride) {
      toast('Cancellation pending — awaiting manager approval.', { icon: '⏳' })
      return
    }
    setSelectedDay(selectedDay === day ? null : day)
  }

  async function handleCancelRequest() {
    const schedule = scheduleMap[selectedDay]
    if (!schedule?.id) return

    const { error: crError } = await supabase
      .from('cancellation_requests')
      .insert({
        shift_selection_id: schedule.id,
        requested_by: profile.id,
        status: 'pending'
      })

    if (crError) {
      toast.error('Failed to submit cancellation request.')
      console.error(crError)
      return
    }

    await supabase
      .from('shift_selections')
      .update({ status: 'cancellation_requested' })
      .eq('id', schedule.id)

    toast.success('Cancellation request submitted.')
    setShowCancelModal(false)
    setSelectedDay(null)
    fetchSchedule()
    fetchPendingRequestCount()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        users={users}
        selectedUserId={viewingUserId}
        onUserChange={setSelectedUserId}
        pendingRequestCount={pendingRequestCount}
      />

      {isAdminOverride && (
        <div className="bg-purple-100 border-b border-purple-200 py-2 px-4 text-sm text-purple-800 text-center">
          Viewing as <strong>{users.find(u => u.id === viewingUserId)?.full_name || 'User'}</strong> — Admin override mode
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative">
          <CalendarGrid
            year={selectedYear}
            month={selectedMonth}
            scheduleMap={scheduleMap}
            shiftTypes={shiftTypes}
            selectedDay={selectedDay}
            onDayClick={handleDayClick}
            isAdminOverride={isAdminOverride}
            pendingCancellations={pendingCancellations}
            loading={loading}
          />

          {selectedDay && !loading && (
            <div className="absolute z-30" style={{
              top: `${Math.floor(((new Date(selectedYear, selectedMonth - 1, 1).getDay() + 5) % 7 + selectedDay) / 7) * 90 + 40}px`,
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              <ShiftDropdown
                year={selectedYear}
                month={selectedMonth}
                day={selectedDay}
                currentSelection={scheduleMap[selectedDay]}
                userId={viewingUserId}
                shiftTypes={shiftTypes}
                isAdminOverride={isAdminOverride}
                onSelect={() => { setSelectedDay(null); fetchSchedule() }}
                onCancelRequest={() => setShowCancelModal(true)}
                onClose={() => setSelectedDay(null)}
              />
            </div>
          )}
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Bonus Shift?</h3>
            <p className="text-gray-600 mb-6">
              Switching away from a bonus shift requires manager approval. Submit a cancellation request?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                Keep Shift
              </button>
              <button
                onClick={handleCancelRequest}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
