import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function BonusLimitEditor() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [bonusShiftTypes, setBonusShiftTypes] = useState([])
  const [limits, setLimits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchBonusTypes()
  }, [])

  useEffect(() => {
    if (bonusShiftTypes.length > 0) fetchLimits()
  }, [selectedMonth, selectedYear, bonusShiftTypes])

  async function fetchBonusTypes() {
    const { data } = await supabase
      .from('shift_types')
      .select('*')
      .eq('is_bonus', true)
      .order('name')
    setBonusShiftTypes(data || [])
    setLoading(false)
  }

  async function fetchLimits() {
    setLoading(true)
    const { data } = await supabase
      .from('bonus_limits')
      .select('*')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    const map = {}
    if (data) {
      data.forEach(bl => {
        const key = `${bl.day}-${bl.shift_type_id}`
        map[key] = bl.max_slots
      })
    }
    setLimits(map)
    setLoading(false)
  }

  function handleChange(day, shiftTypeId, value) {
    const key = `${day}-${shiftTypeId}`
    setLimits(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
  }

  async function handleSave() {
    setSaving(true)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const rows = []

    for (let day = 1; day <= daysInMonth; day++) {
      for (const st of bonusShiftTypes) {
        const key = `${day}-${st.id}`
        const maxSlots = limits[key] || 0
        rows.push({
          shift_type_id: st.id,
          year: selectedYear,
          month: selectedMonth,
          day,
          max_slots: maxSlots
        })
      }
    }

    // Delete existing then insert fresh
    await supabase
      .from('bonus_limits')
      .delete()
      .eq('year', selectedYear)
      .eq('month', selectedMonth)

    if (rows.length > 0) {
      const { error } = await supabase.from('bonus_limits').insert(rows)
      if (error) {
        toast.error('Failed to save bonus limits.')
        console.error(error)
      } else {
        toast.success('Bonus limits saved!')
      }
    }
    setSaving(false)
  }

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  if (bonusShiftTypes.length === 0 && !loading) {
    return (
      <div className="text-gray-500 text-sm">
        No bonus shift types defined. Create a shift type with the "Bonus" flag enabled first.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-4">
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

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-16">Day</th>
                {bonusShiftTypes.map(st => (
                  <th key={st.id} className="text-left py-2 px-3 font-medium text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: st.color }} />
                      {st.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <tr key={day} className="border-b border-gray-100">
                  <td className="py-1.5 px-3 text-gray-700 font-medium">{day}</td>
                  {bonusShiftTypes.map(st => {
                    const key = `${day}-${st.id}`
                    return (
                      <td key={st.id} className="py-1.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={limits[key] || 0}
                          onChange={(e) => handleChange(day, st.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                        />
                      </td>
                    )
                  })}
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
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
