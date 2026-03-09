import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function InvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { signInWithGoogle, session, profile, refreshProfile } = useAuth()
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState('')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('invite_token', token)
      validateToken(token)
    } else {
      const stored = sessionStorage.getItem('invite_token')
      if (stored) validateToken(stored)
      else {
        setValidating(false)
        setError('No invite token provided.')
      }
    }
  }, [token])

  useEffect(() => {
    if (session && profile && valid) {
      activateInvite()
    }
  }, [session, profile, valid])

  async function validateToken(t) {
    const { data, error: fetchError } = await supabase
      .from('invite_links')
      .select('*')
      .eq('id', t)
      .single()

    if (fetchError || !data) {
      setError('This invite link is invalid or has expired.')
      setValid(false)
    } else if (!data.is_active) {
      setError('This invite link has been revoked.')
      setValid(false)
    } else if (new Date(data.expires_at) < new Date()) {
      setError('This invite link has expired.')
      setValid(false)
    } else {
      setValid(true)
    }
    setValidating(false)
  }

  async function activateInvite() {
    if (activating) return
    setActivating(true)
    const storedToken = sessionStorage.getItem('invite_token')
    if (!storedToken || !profile) return

    const { data: invite } = await supabase
      .from('invite_links')
      .select('*')
      .eq('id', storedToken)
      .single()

    if (!invite || !invite.is_active || new Date(invite.expires_at) < new Date()) {
      setError('This invite link is no longer valid.')
      setActivating(false)
      return
    }

    if (profile.role === 'pending') {
      await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', profile.id)
    }

    await supabase
      .from('invite_links')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', storedToken)

    sessionStorage.removeItem('invite_token')
    await refreshProfile()
    window.location.href = '/schedule-management/calendar'
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Validating invite link...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (activating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Activating your account...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-8">You've been invited to join Shift Scheduler. Sign in with Google to get started.</p>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
