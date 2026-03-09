import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: March 9, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Shift Scheduler, you agree to be bound by these Terms of Service.
              This application is invite-only and intended for authorized members of your organization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Account Access</h2>
            <p>
              Access to Shift Scheduler requires a valid invite link from an administrator or manager.
              You must sign in using your Google account. You are responsible for maintaining the
              security of your account and must not share your access with unauthorized individuals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Acceptable Use</h2>
            <p>You agree to use Shift Scheduler only for its intended purpose of managing work schedules. You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Attempt to access data belonging to other users without authorization</li>
              <li>Interfere with or disrupt the application's functionality</li>
              <li>Use the application for any unlawful purpose</li>
              <li>Attempt to bypass any security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Schedule Management</h2>
            <p>
              Shift selections and cancellation requests are subject to approval by managers and
              administrators. Bonus shift availability is limited and allocated on a first-come,
              first-served basis. The organization reserves the right to modify schedules as needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Service Availability</h2>
            <p>
              We strive to keep Shift Scheduler available at all times but do not guarantee
              uninterrupted access. The application may be temporarily unavailable for maintenance
              or updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Limitation of Liability</h2>
            <p>
              Shift Scheduler is provided "as is" without warranties of any kind. We are not
              liable for any damages arising from the use or inability to use the application,
              including but not limited to scheduling errors or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the application after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>
              For questions about these terms, please contact your organization's administrator.
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
