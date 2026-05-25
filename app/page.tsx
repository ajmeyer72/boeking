import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boeking — AI-Powered WhatsApp Reservations for Restaurants',
  description:
    'Boeking gives your restaurant a 24/7 AI booking assistant on WhatsApp. Customers reserve tables instantly, reminders go out automatically, and your calendar stays perfectly in sync.',
}

export default function BoekingLandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-green-500/10 blur-3xl rounded-full" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F14]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold text-xl">
              b
            </div>
            <span className="text-2xl font-semibold tracking-tight">boeking</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how" className="hover:text-white transition">How It Works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#demo" className="hover:text-white transition">Demo</a>
          </nav>

          <button className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-green-500/20">
            Book a Demo
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 mb-8">
            <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </span>
            AI-driven WhatsApp reservations
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            AI-powered restaurant bookings on{' '}
            <span className="text-green-500">WhatsApp</span>
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed max-w-xl mb-10">
            Let customers reserve tables instantly through WhatsApp while your AI assistant handles confirmations, reminders, and reservations automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button className="bg-green-500 hover:bg-green-400 text-black font-semibold px-7 py-4 rounded-2xl text-lg transition shadow-xl shadow-green-500/20">
              Start Free Trial
            </button>

            <button className="border border-white/10 hover:border-white/20 bg-white/5 px-7 py-4 rounded-2xl text-lg transition">
              Watch Demo
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <span>✓ No app downloads</span>
            <span>✓ Setup in minutes</span>
            <span>✓ 24/7 AI bookings</span>
          </div>
        </div>
<div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-xl">
  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
    <div className="text-green-400 text-sm mb-2">Email Us</div>

    <a
      href="mailto:info@boeking.co.za"
      className="text-lg font-semibold hover:text-green-400 transition"
    >
      info@boeking.co.za
    </a>
  </div>

  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
    <div className="text-green-400 text-sm mb-2">
      Chat on WhatsApp
    </div>

    <a
      href="https://wa.me/27836261944"
      target="_blank"
      className="text-lg font-semibold hover:text-green-400 transition"
    >
      +27 83 626 1944
    </a>
  </div>
</div>
        {/* Phone Mockup */}
        <div className="relative flex justify-center">
          <div className="absolute w-[450px] h-[450px] bg-green-500/20 blur-3xl rounded-full" />

          <div className="relative bg-[#111827] border border-white/10 rounded-[3rem] p-4 w-[340px] shadow-2xl shadow-black/50">
            <div className="bg-black rounded-[2.5rem] overflow-hidden">
              <div className="bg-[#161b22] px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500" />
                <div>
                  <div className="font-semibold">The Grill House</div>
                  <div className="text-xs text-green-400">Online</div>
                </div>
              </div>

              <div className="p-4 space-y-4 bg-[#0B0F14] min-h-[520px]">
                <div className="bg-white text-black rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm">
                  Hi, do you have a table for 4 tonight?
                </div>

                <div className="bg-green-500 text-black rounded-2xl rounded-tr-sm px-4 py-3 ml-auto max-w-[80%] text-sm">
                  Yes 👋 We have availability. What time would you like to book?
                </div>

                <div className="bg-white text-black rounded-2xl rounded-tl-sm px-4 py-3 max-w-[60%] text-sm">
                  7:30 PM please
                </div>

                <div className="bg-green-500 text-black rounded-2xl rounded-tr-sm px-4 py-3 ml-auto max-w-[80%] text-sm">
                  Perfect! Your table for 4 at 7:30 PM is confirmed 🎉
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Section */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center">
          <p className="text-gray-500 mb-8">
            Be among the first restaurants to transform your bookings with AI
          </p>

          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now onboarding restaurants — 14-day free trial included
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-xl">
            Simple for customers. Powerful for restaurants.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Customer sends WhatsApp',
              text: 'Customers message your restaurant directly on WhatsApp.',
            },
            {
              step: '2',
              title: 'AI checks availability',
              text: 'Your AI assistant checks tables and reservation times instantly.',
            },
            {
              step: '3',
              title: 'Booking confirmed',
              text: 'Reservations are confirmed automatically in seconds.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:border-green-500/30 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500 text-black flex items-center justify-center font-bold text-xl mb-6">
                {item.step}
              </div>

              <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-28">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Powerful features for modern restaurants
          </h2>
          <p className="text-gray-400 text-xl">
            Everything you need to automate reservations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: '24/7 AI Assistant',
              description: "Never miss a booking again. Boeking's AI handles reservation requests at any hour — evenings, weekends, public holidays — so your restaurant is always open for bookings even when your staff aren't.",
            },
            {
              title: 'WhatsApp Integration',
              description: 'No new app, no web form. Customers book through the WhatsApp they already use every day. Your restaurant gets a dedicated number that handles the entire conversation from first message to confirmed table.',
            },
            {
              title: 'Instant Confirmations',
              description: 'Every booking is confirmed in seconds with a reference number sent directly to the customer. No back-and-forth, no waiting on a callback — just a clean, professional confirmation they can refer back to.',
            },
            {
              title: 'Automated Reminders',
              description: 'Reduce no-shows with automatic WhatsApp reminders sent 24 hours and 2 hours before each reservation. Customers can confirm, cancel or modify directly in the chat — all synced to your dashboard in real time.',
            },
            {
              title: 'Reservation Dashboard',
              description: 'A clean, real-time view of every booking across the day. Your front-of-house staff can see upcoming reservations, add walk-ins, flag special requests and manage cancellations — all from one simple screen.',
            },
            {
              title: 'Multi-Branch Support',
              description: 'Running more than one location? Boeking manages each venue independently under one account. Separate WhatsApp numbers, separate calendars, separate dashboards — with a single login to oversee them all.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:border-green-500/30 hover:bg-white/[0.05] transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-2xl mb-6">
                ✦
              </div>

              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>

              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 pb-28">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-xl">
            Start small and scale as you grow.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Starter',
              price: 'R599',
              featured: false,
              features: [
                '1 restaurant',
                'Up to 200 bookings/month',
                'WhatsApp AI booking bot',
                'Google Calendar sync',
                '24hr reminders',
                'Basic dashboard',
              ],
              missing: [
                'Customer history & no-show tracking',
                'Custom bot branding',
                'Multi-branch support',
              ],
            },
            {
              title: 'Growth',
              price: 'R1,299',
              featured: true,
              features: [
                '1 restaurant',
                'Unlimited bookings',
                'WhatsApp AI booking bot',
                'Google Calendar sync',
                '24hr + 2hr reminders',
                'Full staff dashboard',
                'Customer history & no-show tracking',
                'Custom greeting + branding',
              ],
              missing: [
                'Multi-branch support',
              ],
            },
            {
              title: 'Enterprise',
              price: 'Custom',
              featured: false,
              features: [
                'Up to 5 locations',
                'Unlimited bookings',
                'WhatsApp AI booking bot',
                'Google Calendar sync',
                'Custom reminder schedule',
                'Multi-location dashboard',
                'Customer history & no-show tracking',
                'Custom branding',
                'Dedicated account manager',
              ],
              missing: [],
            },
          ].map((plan) => (
            <div
              key={plan.title}
              className={`rounded-3xl p-8 border transition relative ${
                plan.featured
                  ? 'bg-green-500 text-black border-green-400 scale-105 shadow-2xl shadow-green-500/20'
                  : 'bg-white/[0.03] border-white/5'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-sm font-bold px-4 py-2 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-3xl font-bold mb-4">{plan.title}</h3>
              <div className="text-5xl font-bold mb-8">
                {plan.price}
                {plan.price !== 'Custom' && (
                  <span className="text-lg font-normal">/month</span>
                )}
              </div>

              <ul className={`space-y-3 mb-10 ${plan.featured ? 'text-black/80' : 'text-gray-400'}`}>
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className={plan.featured ? 'text-black/40' : 'text-gray-600'}>– {f}</li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-2xl font-semibold transition ${
                  plan.featured
                    ? 'bg-black text-white hover:bg-[#111827]'
                    : 'bg-green-500 text-black hover:bg-green-400'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.03] p-16 text-center">
          <div className="absolute inset-0 bg-green-500/5" />

          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              Stop missing restaurant reservations.
            </h2>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Let AI handle your bookings on WhatsApp — 24/7.
            </p>

            <button className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-5 rounded-2xl text-lg transition shadow-xl shadow-green-500/20">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold text-xl">
              b
            </div>
            <span className="text-2xl font-semibold tracking-tight">boeking</span>
          </div>

          <div className="text-gray-500 text-sm text-center md:text-right">
            © 2026 Boeking.co.za — AI-powered restaurant bookings on WhatsApp.
          </div>
          <div className="mt-2">
            Email: info@boeking.co.za | WhatsApp: +27 83 626 1944
          </div>
        </div>
      </footer>
    </div>
  )
}
