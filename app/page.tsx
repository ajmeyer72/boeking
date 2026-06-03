'use client'

import { useEffect, useRef, useState } from 'react'

const DEMO_MESSAGES = [
  { from: 'customer', text: "Hi, I'd like to book a table for Saturday evening" },
  { from: 'bot', text: "Hi there! 👋 Welcome to Boeking Demo Restaurant. I'd love to help you make a reservation!\n\nJust to confirm — this Saturday, 7 June 2026 — is that right?" },
  { from: 'customer', text: "Yes that's right" },
  { from: 'bot', text: 'Perfect! What time would you prefer?' },
  { from: 'customer', text: '7pm' },
  { from: 'bot', text: 'Great choice! How many people will be joining you?' },
  { from: 'customer', text: '4 people' },
  { from: 'bot', text: 'Lovely! May I have your name for the reservation?' },
  { from: 'customer', text: 'Sarah Johnson' },
  { from: 'bot', text: 'Any special requests, Sarah? Dietary requirements, a special occasion, or seating preference?' },
  { from: 'customer', text: "It's my birthday 🎂" },
  { from: 'bot', text: "How wonderful! 🎉\n\nHere's your booking summary:\n📅 Saturday, 7 June 2026\n🕖 19:00\n👥 4 guests\n👤 Sarah Johnson\n🎂 Birthday occasion noted\n\nShall I confirm this?" },
  { from: 'customer', text: 'Yes please!' },
  { from: 'bot', text: "Your reservation is confirmed! 🎉\n\n🔖 Ref: BOE-1042\n\nWe'll send you a reminder the day before. Happy birthday in advance Sarah — we can't wait to celebrate with you! 🥂" },
]

export default function BoekingLandingPage() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const startAnimation = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setVisibleMessages(0)

    DEMO_MESSAGES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleMessages(i + 1)
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
      }, i * 1200)
    })

    setTimeout(() => {
      setIsAnimating(false)
    }, DEMO_MESSAGES.length * 1200 + 1000)
  }

  useEffect(() => {
    const timer = setTimeout(startAnimation, 1000)
    return () => clearTimeout(timer)
  }, [])

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
            <a href="#demo" className="hover:text-white transition">Live Demo</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </nav>

          <a
            href="mailto:info@boeking.co.za"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-green-500/20"
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 mb-8">
            <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">NEW</span>
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
            <a
              href="mailto:info@boeking.co.za"
              className="bg-green-500 hover:bg-green-400 text-black font-semibold px-7 py-4 rounded-2xl text-lg transition shadow-xl shadow-green-500/20 text-center"
            >
              Start Free Trial
            </a>
            <a
              href="#demo"
              className="border border-white/10 hover:border-white/20 bg-white/5 px-7 py-4 rounded-2xl text-lg transition text-center"
            >
              Try Live Demo
            </a>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <span>&#10003; No app downloads</span>
            <span>&#10003; Setup in minutes</span>
            <span>&#10003; 24/7 AI bookings</span>
          </div>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-xl">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-green-400 text-sm mb-2">Email Us</div>
            <a href="mailto:info@boeking.co.za" className="text-lg font-semibold hover:text-green-400 transition">
              info@boeking.co.za
            </a>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-green-400 text-sm mb-2">Chat on WhatsApp</div>
            <a href="https://wa.me/27687427177" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold hover:text-green-400 transition">
              +27 68 742 7177
            </a>
          </div>
        </div>
      </section>

            {/* How it Works */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-xl">Simple for customers. Powerful for restaurants.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Customer sends WhatsApp', text: 'Customers message your restaurant directly on WhatsApp — no app download, no web form.' },
            { step: '2', title: 'AI checks availability', text: 'Your AI assistant checks availability, collects details and confirms the booking in seconds.' },
            { step: '3', title: 'Booking confirmed', text: 'Reservation saved, confirmation sent, reminders scheduled — completely automatically.' },
          ].map((item) => (
            <div key={item.step} className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:border-green-500/30 transition">
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
          <h2 className="text-5xl font-bold mb-4">Powerful features for modern restaurants</h2>
          <p className="text-gray-400 text-xl">Everything you need to automate reservations.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: '24/7 AI Assistant', description: "Never miss a booking again. Boeking's AI handles reservation requests at any hour — evenings, weekends, public holidays — so your restaurant is always open for bookings even when your staff aren't." },
            { title: 'WhatsApp Integration', description: 'No new app, no web form. Customers book through the WhatsApp they already use every day. Your restaurant gets a dedicated number that handles the entire conversation from first message to confirmed table.' },
            { title: 'Instant Confirmations', description: 'Every booking is confirmed in seconds with a reference number sent directly to the customer. No back-and-forth, no waiting on a callback — just a clean, professional confirmation they can refer back to.' },
            { title: 'Automated Reminders', description: 'Reduce no-shows with automatic WhatsApp reminders sent before each reservation. Customers can confirm, cancel or modify directly in the chat — all synced to your dashboard in real time.' },
            { title: 'Reservation Dashboard', description: 'A clean, real-time view of every booking across the day. Your front-of-house staff can see upcoming reservations, add walk-ins, flag special requests and manage cancellations — all from one simple screen.' },
            { title: 'Multi-Branch Support', description: 'Running more than one location? Boeking manages each venue independently under one account. Separate WhatsApp numbers, separate calendars, separate dashboards — with a single login to oversee them all.' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:border-green-500/30 hover:bg-white/[0.05] transition">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-2xl mb-6">
                &#10022;
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm text-green-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live demo — try it yourself
            </div>
            <h2 className="text-5xl font-bold mb-4">See it in action</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Watch a real booking conversation below, then try it yourself by messaging our demo restaurant on WhatsApp.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Animated chat mockup */}
            <div className="relative flex justify-center">
              <div className="absolute w-[400px] h-[400px] bg-green-500/10 blur-3xl rounded-full" />
              <div className="relative bg-[#111827] border border-white/10 rounded-[3rem] p-4 w-[340px] shadow-2xl shadow-black/50">
                <div className="bg-black rounded-[2.5rem] overflow-hidden">
                  <div className="bg-[#161b22] px-5 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-sm">
                      BR
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Boeking Demo Restaurant</div>
                      <div className="text-xs text-green-400">&#9679; Online</div>
                    </div>
                  </div>

                  <div ref={chatRef} className="p-4 space-y-3 bg-[#0B0F14] h-[480px] overflow-y-auto">
                    {DEMO_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                          msg.from === 'customer'
                            ? 'bg-white text-black rounded-tl-sm'
                            : 'bg-green-500 text-black rounded-tr-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isAnimating && visibleMessages < DEMO_MESSAGES.length && visibleMessages % 2 === 1 && (
                      <div className="flex justify-end">
                        <div className="bg-green-500/30 px-4 py-2.5 rounded-2xl rounded-tr-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAnimating && visibleMessages >= DEMO_MESSAGES.length && (
                    <div className="bg-[#0B0F14] px-4 pb-4 flex justify-center">
                      <button
                        onClick={startAnimation}
                        className="text-xs text-green-400 hover:text-green-300 transition border border-green-500/20 px-4 py-2 rounded-full"
                      >
                        Replay demo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA panel */}
            <div>
              <h3 className="text-3xl font-bold mb-6">Now try it yourself — for real</h3>
              <p className="text-gray-400 leading-relaxed mb-8">
                Our demo restaurant is live on WhatsApp right now. Send a message to the number below and experience exactly what your customers will see — a real AI booking assistant handling a real conversation.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Try booking a table for any date',
                  'Ask for a time that is fully booked',
                  'Request to join the waiting list',
                  'Try cancelling or modifying a booking',
                  'See how it handles special requests',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                    <span className="text-green-400 font-mono">&#8594;</span>
                    {tip}
                  </div>
                ))}
              </div>

              <a
                href="https://wa.me/27687427177?text=Hi%2C%20I%27d%20like%20to%20make%20a%20reservation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-8 py-4 rounded-2xl text-lg transition shadow-xl shadow-green-500/20 w-full justify-center"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Message our demo on WhatsApp
              </a>

              <p className="text-gray-600 text-sm mt-4 text-center">
                +27 68 742 7177 · Boeking Demo Restaurant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-xl">Start small and scale as you grow.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Starter',
              price: 'R599',
              featured: false,
              features: ['1 restaurant', 'Up to 200 bookings/month', 'WhatsApp AI booking bot', 'Google Calendar sync', '24hr reminders', 'Basic dashboard'],
              missing: ['Customer history and no-show tracking', 'Custom bot branding', 'Multi-branch support'],
            },
            {
              title: 'Growth',
              price: 'R1,299',
              featured: true,
              features: ['1 restaurant', 'Unlimited bookings', 'WhatsApp AI booking bot', 'Google Calendar sync', '24hr + 2hr reminders', 'Full staff dashboard', 'Customer history and no-show tracking', 'Custom greeting + branding'],
              missing: ['Multi-branch support'],
            },
            {
              title: 'Enterprise',
              price: 'Custom',
              featured: false,
              features: ['Up to 5 locations', 'Unlimited bookings', 'WhatsApp AI booking bot', 'Google Calendar sync', 'Custom reminder schedule', 'Multi-location dashboard', 'Customer history and no-show tracking', 'Custom branding', 'Dedicated account manager'],
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
                {plan.price !== 'Custom' && <span className="text-lg font-normal">/month</span>}
              </div>
              <ul className={`space-y-3 mb-10 ${plan.featured ? 'text-black/80' : 'text-gray-400'}`}>
                {plan.features.map((f) => <li key={f}>&#10003; {f}</li>)}
                {plan.missing.map((f) => <li key={f} className={plan.featured ? 'text-black/40' : 'text-gray-600'}>&#8211; {f}</li>)}
              </ul>
              <a
                href="mailto:info@boeking.co.za"
                className={`block w-full py-4 rounded-2xl font-semibold transition text-center ${
                  plan.featured ? 'bg-black text-white hover:bg-[#111827]' : 'bg-green-500 text-black hover:bg-green-400'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          All plans include a 14-day free trial · No credit card required · Cancel anytime
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.03] p-16 text-center">
          <div className="absolute inset-0 bg-green-500/5" />
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6">Ready to fill more tables?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@boeking.co.za"
                className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-5 rounded-2xl text-lg transition shadow-xl shadow-green-500/20"
              >
                Get started today
              </a>
              <a
                href="https://wa.me/27687427177?text=Hi%2C%20I%27d%20like%20to%20make%20a%20reservation"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/10 hover:border-white/20 bg-white/5 px-8 py-5 rounded-2xl text-lg transition"
              >
                Try the demo first
              </a>
            </div>
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
          <div className="text-gray-500 text-sm text-center">
            &#169; 2026 Boeking.co.za — AI-powered restaurant bookings on WhatsApp.
          </div>
          <div className="text-gray-500 text-sm">
            info@boeking.co.za · +27 68 742 7177
          </div>
        </div>
      </footer>
    </div>
  )
}
