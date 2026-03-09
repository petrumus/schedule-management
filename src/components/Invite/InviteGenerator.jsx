import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function InviteGenerator() {
  const { profile } = useAuth()
  const [label, setLabel] = useState('')
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [generatedLink, setGeneratedLink] = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (!expiresAt) {
      toast.error('Please set an expiry date.')
      return
    }
    setGenerating(true)

    const { data, error } = await supabase
      .from('invite_links')
      .insert({
        created_by: profile.id,
        label: label || null,
        expires_at: new Date(expiresAt).toISOString(),
        is_active: true,
        use_count: 0
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to generate invite link.')
      console.error(error)
    } else {
      const url = `${window.location.origin}/schedule-management/invite?token=${data.id}`
      setGeneratedLink(url)
      toast.success('Invite link generated!')
    }
    setGenerating(false)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedLink)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Generate Invite Link</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., March onboarding batch"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Expires at</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {generating ? 'Generating...' : 'Generate Link'}
        </button>

        {generatedLink && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-green-800 break-all mb-2">{generatedLink}</div>
            <button
              onClick={copyToClipboard}
              className="text-sm bg-green-600 text-white rounded px-3 py-1 hover:bg-green-700 cursor-pointer"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
