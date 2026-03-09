import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await signInWithMagicLink(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send magic link.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shift Scheduler</h1>
        <p className="text-gray-600 mb-8">Sign in to view and manage your work schedule</p>

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
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
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

        <p className="mt-6 text-sm text-gray-500">
          <Link to="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
          {' · '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
