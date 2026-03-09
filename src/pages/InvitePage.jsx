import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function InvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { signInWithMagicLink, session, profile, refreshProfile } = useAuth()
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState('')
  const [activating, setActivating] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailError, setEmailError] = useState('')

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

  async function handleSubmit(e) {
    e.preventDefault()
    setEmailError('')
    setSending(true)
    try {
      await signInWithMagicLink(email)
      setSent(true)
    } catch (err) {
      setEmailError(err.message || 'Failed to send magic link.')
    } finally {
      setSending(false)
    }
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
        <p className="text-gray-600 mb-8">You've been invited to join Shift Scheduler. Enter your email to get started.</p>

        {sent ? (
          <div>
            <div className="text-green-600 text-5xl mb-4">&#9993;</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-4">
              We sent a sign-in link to <span className="font-medium">{email}</span>
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {emailError && (
              <p className="text-red-500 text-sm mb-4">{emailError}</p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
