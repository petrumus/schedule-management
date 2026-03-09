import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function CancellationRequests({ onUpdate }) {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    const { data, error } = await supabase
      .from('cancellation_requests')
      .select(`
        *,
        shift_selections (
          year, month, day, shift_type_id, user_id,
          shift_types:shift_type_id (name, color)
        ),
        profiles:requested_by (full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching requests:', error)
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  async function handleAction(request, action) {
    const { error: crError } = await supabase
      .from('cancellation_requests')
      .update({
        status: action,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request.id)

    if (crError) {
      toast.error(`Failed to ${action} request.`)
      return
    }

    const newStatus = action === 'approved' ? 'cancelled' : 'active'
    await supabase
      .from('shift_selections')
      .update({ status: newStatus })
      .eq('id', request.shift_selection_id)

    toast.success(`Request ${action}.`)
    fetchRequests()
    if (onUpdate) onUpdate()
  }

  if (loading) {
    return <div className="text-gray-500 text-sm py-4">Loading requests...</div>
  }

  if (requests.length === 0) {
    return <div className="text-gray-500 text-sm py-4">No pending cancellation requests.</div>
  }

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const sel = req.shift_selections
        const user = req.profiles
        const shift = sel?.shift_types

        return (
          <div key={req.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {user?.full_name || user?.email || 'Unknown'}
                </div>
                <div className="text-sm text-gray-600">
                  {sel?.year}-{String(sel?.month).padStart(2, '0')}-{String(sel?.day).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {shift && (
                    <>
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: shift.color }}
                      />
                      <span className="text-sm text-gray-700">{shift.name}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Requested: {new Date(req.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req, 'approved')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(req, 'rejected')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
