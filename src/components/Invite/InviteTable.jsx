import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function InviteTable() {
  const { profile, isAdmin } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks()
  }, [])

  async function fetchLinks() {
    let query = supabase
      .from('invite_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('created_by', profile.id)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching invite links:', error)
    } else {
      setLinks(data || [])
    }
    setLoading(false)
  }

  async function handleRevoke(linkId) {
    const { error } = await supabase
      .from('invite_links')
      .update({ is_active: false })
      .eq('id', linkId)

    if (error) {
      toast.error('Failed to revoke link.')
    } else {
      toast.success('Link revoked.')
      fetchLinks()
    }
  }

  function getStatus(link) {
    if (!link.is_active) return { text: 'Revoked', color: 'text-red-600 bg-red-50' }
    if (new Date(link.expires_at) < new Date()) return { text: 'Expired', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'Active', color: 'text-green-600 bg-green-50' }
  }

  if (loading) return <div className="text-gray-500 text-sm py-2">Loading links...</div>

  if (links.length === 0) return <div className="text-gray-500 text-sm py-2">No invite links created yet.</div>

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Existing Invite Links</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Label</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Created</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Expires</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Uses</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Status</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {links.map(link => {
              const status = getStatus(link)
              return (
                <tr key={link.id} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-900">{link.label || '—'}</td>
                  <td className="py-2 px-2 text-gray-600">{new Date(link.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2 text-gray-600">{new Date(link.expires_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2 text-gray-600">{link.use_count}</td>
                  <td className="py-2 px-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {link.is_active && new Date(link.expires_at) >= new Date() && (
                      <button
                        onClick={() => handleRevoke(link.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
