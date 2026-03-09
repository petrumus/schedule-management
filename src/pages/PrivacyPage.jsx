import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: March 9, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>
              When you sign in with Google, we collect your name, email address, and profile picture
              as provided by your Google account. We also store your work schedule selections and
              shift preferences within the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Authenticate your identity and manage your account</li>
              <li>Display and manage your work schedule</li>
              <li>Process shift selections and cancellation requests</li>
              <li>Enable managers and admins to coordinate team schedules</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Data Storage</h2>
            <p>
              Your data is stored securely in Supabase (PostgreSQL) with row-level security policies.
              Access to your data is restricted based on your role. Only you, your managers, and
              administrators can view your schedule information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or share your personal information with third parties.
              Your data is only accessible to authorized users within your organization
              (managers and administrators) as required for schedule management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Google OAuth</h2>
            <p>
              We use Google OAuth for authentication. We only request basic profile information
              (name, email, profile picture). We do not access your Google Drive, Gmail, Calendar,
              or any other Google services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>
              Your account data is retained for as long as your account is active. If you wish to
              have your data removed, please contact your organization's administrator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contact</h2>
            <p>
              For questions about this privacy policy, please contact your organization's administrator.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
