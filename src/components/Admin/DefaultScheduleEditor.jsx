import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function DefaultScheduleEditor() {
  const now = new Date()
  const [users, setUsers] = useState([])
  const [shiftTypes, setShiftTypes] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [schedules, setSchedules] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bulkShift, setBulkShift] = useState('')

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchUsers()
    fetchShiftTypes()
  }, [])

  useEffect(() => {
    if (selectedUserId) fetchSchedules()
  }, [selectedUserId, selectedMonth, selectedYear])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .neq('role', 'pending')
      .order('full_name')
    if (data) {
      setUsers(data)
      if (data.length > 0 && !selectedUserId) setSelectedUserId(data[0].id)
    }
  }

  async function fetchShiftTypes() {
    const { data } = await supabase.from('shift_types').select('*').order('name')
    setShiftTypes(data || [])
  }

  async function fetchSchedules() {
    setLoading(true)
    const { data } = await supabase
      .from('default_schedules')
      .select('*')
      .eq('user_id', selectedUserId)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    const map = {}
    if (data) {
      data.forEach(d => { map[d.day] = d.shift_type_id })
    }
    setSchedules(map)
    setLoading(false)
  }

  function handleDayChange(day, shiftTypeId) {
    setSchedules(prev => ({
      ...prev,
      [day]: shiftTypeId || undefined
    }))
  }

  function applyToAllDays() {
    if (!bulkShift) return
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const newSchedules = {}
    for (let d = 1; d <= daysInMonth; d++) {
      newSchedules[d] = bulkShift
    }
    setSchedules(newSchedules)
  }

  async function handleSave() {
    setSaving(true)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const rows = []
    for (let d = 1; d <= daysInMonth; d++) {
      if (schedules[d]) {
        rows.push({
          user_id: selectedUserId,
          year: selectedYear,
          month: selectedMonth,
          day: d,
          shift_type_id: schedules[d]
        })
      }
    }

    // Delete existing then insert fresh
    await supabase
      .from('default_schedules')
      .delete()
      .eq('user_id', selectedUserId)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    if (rows.length > 0) {
      const { error } = await supabase.from('default_schedules').insert(rows)
      if (error) {
        toast.error('Failed to save schedules.')
        console.error(error)
      } else {
        toast.success('Default schedules saved!')
      }
    } else {
      toast.success('Schedules cleared for this month.')
    }
    setSaving(false)
  }

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div>
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Apply to all days</label>
          <select
            value={bulkShift}
            onChange={(e) => setBulkShift(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Select shift...</option>
            {shiftTypes.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={applyToAllDays}
          className="bg-gray-200 text-gray-700 rounded-md px-3 py-2 text-sm hover:bg-gray-300 cursor-pointer"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-16">Day</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Shift Type</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <tr key={day} className="border-b border-gray-100">
                  <td className="py-1.5 px-3 text-gray-700 font-medium">{day}</td>
                  <td className="py-1.5 px-3">
                    <select
                      value={schedules[day] || ''}
                      onChange={(e) => handleDayChange(day, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white w-full max-w-xs"
                    >
                      <option value="">Not set</option>
                      {shiftTypes.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
  )
}
