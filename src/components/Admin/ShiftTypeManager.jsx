import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ShiftTypeManager() {
  const { profile } = useAuth()
  const [shiftTypes, setShiftTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#3B82F6', is_bonus: false })

  useEffect(() => {
    fetchShiftTypes()
  }, [])

  async function fetchShiftTypes() {
    const { data } = await supabase.from('shift_types').select('*').order('name')
    setShiftTypes(data || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', color: '#3B82F6', is_bonus: false })
    setEditing(null)
  }

  function startEdit(st) {
    setEditing(st.id)
    setForm({ name: st.name, color: st.color, is_bonus: st.is_bonus })
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Shift name is required.')
      return
    }

    if (editing) {
      const { error } = await supabase
        .from('shift_types')
        .update({ name: form.name, color: form.color, is_bonus: form.is_bonus })
        .eq('id', editing)
      if (error) toast.error('Failed to update shift type.')
      else toast.success('Shift type updated.')
    } else {
      const { error } = await supabase
        .from('shift_types')
        .insert({ name: form.name, color: form.color, is_bonus: form.is_bonus, created_by: profile.id })
      if (error) toast.error('Failed to create shift type.')
      else toast.success('Shift type created.')
    }
    resetForm()
    fetchShiftTypes()
  }

  async function handleDelete(id) {
    const checks = await Promise.all([
      supabase.from('default_schedules').select('id', { count: 'exact', head: true }).eq('shift_type_id', id),
      supabase.from('shift_selections').select('id', { count: 'exact', head: true }).eq('shift_type_id', id),
      supabase.from('bonus_limits').select('id', { count: 'exact', head: true }).eq('shift_type_id', id),
    ])

    const totalRefs = checks.reduce((sum, { count }) => sum + (count || 0), 0)
    if (totalRefs > 0) {
      toast.error('Cannot delete — this shift type is in use.')
      return
    }

    const { error } = await supabase.from('shift_types').delete().eq('id', id)
    if (error) toast.error('Failed to delete shift type.')
    else {
      toast.success('Shift type deleted.')
      fetchShiftTypes()
    }
  }

  if (loading) return <div className="text-gray-500">Loading shift types...</div>

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {editing ? 'Edit Shift Type' : 'Add Shift Type'}
        </h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-48"
              placeholder="e.g., Morning"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-16 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_bonus}
              onChange={(e) => setForm({ ...form, is_bonus: e.target.checked })}
              className="rounded"
            />
            Bonus shift
          </label>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
          >
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && (
            <button
              onClick={resetForm}
              className="text-gray-500 text-sm hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-4 font-medium text-gray-600">Color</th>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Name</th>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Bonus</th>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shiftTypes.map(st => (
              <tr key={st.id} className="border-b border-gray-100">
                <td className="py-2 px-4">
                  <span className="w-6 h-6 rounded-full inline-block" style={{ backgroundColor: st.color }} />
                </td>
                <td className="py-2 px-4 text-gray-900">{st.name}</td>
                <td className="py-2 px-4 text-gray-600">{st.is_bonus ? 'Yes' : 'No'}</td>
                <td className="py-2 px-4 flex gap-2">
                  <button
                    onClick={() => startEdit(st)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(st.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {shiftTypes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-center text-gray-500">No shift types defined yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
