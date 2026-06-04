import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Boeking',
  description: 'How Boeking collects, uses and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <header className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold">b</div>
            <span className="font-semibold">boeking</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition">Back to home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: June 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Who we are</h2>
            <p>
              Boeking is a WhatsApp-powered restaurant reservation platform operated by Daytona PTY LTD, based in Cape Town, South Africa. We provide restaurants with an AI-powered booking assistant that allows their customers to make, modify and cancel table reservations via WhatsApp.
            </p>
            <p className="mt-3">
              For any privacy-related queries, contact us at: <a href="mailto:info@boeking.co.za" className="text-green-400 hover:text-green-300">info@boeking.co.za</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information we collect</h2>
            <p>We collect the following information when customers interact with the Boeking booking assistant:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>WhatsApp phone number</li>
              <li>Name (provided during the booking process)</li>
              <li>Reservation details — date, time, party size, special requests</li>
              <li>Conversation history with the AI assistant</li>
              <li>Booking history and attendance records (no-shows, cancellations)</li>
            </ul>
            <p className="mt-3">
              We collect information from restaurant operators including business name, contact details, operating hours and configuration preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How we use your information</h2>
            <p>Customer data is used exclusively to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Process and confirm table reservations</li>
              <li>Send booking confirmations and reminders via WhatsApp</li>
              <li>Handle modifications and cancellations</li>
              <li>Notify customers of waitlist availability</li>
              <li>Provide restaurants with their customer booking history</li>
            </ul>
            <p className="mt-3">We do not use customer data for marketing purposes without explicit consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data sharing</h2>
            <p>Customer data is shared only with:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-white">The restaurant</strong> — the restaurant you are booking with has access to your name, phone number and reservation details</li>
              <li><strong className="text-white">Anthropic</strong> — we use the Claude AI API to power our booking assistant. Messages are processed in accordance with Anthropic's privacy policy</li>
              <li><strong className="text-white">Meta (WhatsApp)</strong> — messages are transmitted via the WhatsApp Business API in accordance with Meta's data policy</li>
            </ul>
            <p className="mt-3">We do not sell customer data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data storage and security</h2>
            <p>
              All data is stored on secured servers hosted by Railway (Google Cloud infrastructure). We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords and access controls.
            </p>
            <p className="mt-3">
              Each restaurant can only access data belonging to their own customers. No cross-restaurant data sharing occurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data retention</h2>
            <p>
              Customer booking data is retained for as long as the restaurant remains a Boeking subscriber. Conversation history is retained for 12 months. When a restaurant cancels their subscription, their customer data is deleted within 30 days upon written request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Your rights</h2>
            <p>Under the Protection of Personal Information Act (POPIA), you have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Request access to the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to the processing of your personal information</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <a href="mailto:info@boeking.co.za" className="text-green-400 hover:text-green-300">info@boeking.co.za</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. WhatsApp messaging</h2>
            <p>
              By messaging a restaurant through the Boeking booking assistant, you consent to receiving automated WhatsApp messages related to your reservation including confirmations, reminders and notifications. You can opt out at any time by replying STOP to any message.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Changes to this policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated date. Continued use of the Boeking service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              For any privacy concerns or requests, please contact us at:
            </p>
            <div className="mt-3 bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <p>Boeking — Daytona PTY LTD</p>
              <p>Cape Town, South Africa</p>
              <p><a href="mailto:info@boeking.co.za" className="text-green-400 hover:text-green-300">info@boeking.co.za</a></p>
              <p>+27 68 742 7177</p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-gray-600">
          <span>© 2026 Boeking · Daytona PTY LTD</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
