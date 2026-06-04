import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Boeking',
  description: 'Terms and conditions for using the Boeking restaurant reservation platform.',
}

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: June 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Agreement to terms</h2>
            <p>
              By subscribing to or using the Boeking platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service. These terms apply to restaurant operators (subscribers) and their customers who interact with the Boeking booking assistant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. The service</h2>
            <p>
              Boeking provides restaurants with an AI-powered WhatsApp booking assistant that allows customers to make, modify and cancel table reservations. The service includes a staff dashboard for managing reservations, customer records and restaurant settings.
            </p>
            <p className="mt-3">
              We reserve the right to modify, suspend or discontinue any part of the service at any time with reasonable notice to subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Subscriptions and billing</h2>
            <p>Boeking is offered on a monthly subscription basis. The following terms apply:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Subscriptions are billed monthly in advance</li>
              <li>A 14-day free trial is included for new subscribers — no credit card required during the trial</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>Prices are listed in South African Rand (ZAR) and exclude VAT where applicable</li>
              <li>We reserve the right to change pricing with 30 days written notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Cancellation and refunds</h2>
            <p>
              Subscribers may cancel their subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial months. To cancel, contact us at <a href="mailto:info@boeking.co.za" className="text-green-400 hover:text-green-300">info@boeking.co.za</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscriber responsibilities</h2>
            <p>As a restaurant subscriber, you agree to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Provide accurate restaurant information including operating hours and contact details</li>
              <li>Ensure your dedicated WhatsApp number is properly registered and maintained</li>
              <li>Keep your login credentials secure and not share them with unauthorised parties</li>
              <li>Use the service in compliance with all applicable laws including POPIA</li>
              <li>Not use the service to send spam or unsolicited messages to customers</li>
              <li>Honour reservations made through the Boeking platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. WhatsApp and Meta compliance</h2>
            <p>
              The Boeking service uses the WhatsApp Business API provided by Meta. Subscribers acknowledge that use of the WhatsApp messaging features is subject to Meta's Business Messaging Policy and WhatsApp Business Terms of Service. Boeking is not responsible for any suspension or restriction of WhatsApp services by Meta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. AI-generated content</h2>
            <p>
              The Boeking booking assistant uses artificial intelligence to generate responses to customer messages. While we design the system to be accurate and professional, we do not guarantee that all AI-generated responses will be error-free. Restaurants remain responsible for the accuracy of booking information displayed to customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of liability</h2>
            <p>
              Boeking is provided on an "as is" basis. To the maximum extent permitted by law, Daytona PTY LTD shall not be liable for any indirect, incidental or consequential damages arising from use of the service, including but not limited to lost revenue resulting from missed bookings, system downtime or AI errors.
            </p>
            <p className="mt-3">
              Our total liability to any subscriber shall not exceed the amount paid by that subscriber in the three months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Intellectual property</h2>
            <p>
              All intellectual property rights in the Boeking platform, including software, design and content, remain the property of Daytona PTY LTD. Subscribers are granted a limited, non-exclusive licence to use the service for their restaurant operations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate any subscription immediately if a subscriber violates these terms, engages in fraudulent activity, or uses the service in a manner that could harm Boeking or its other subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Governing law</h2>
            <p>
              These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact</h2>
            <p>For any questions regarding these terms, contact us at:</p>
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
