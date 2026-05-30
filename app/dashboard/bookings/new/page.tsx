'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewBookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<any>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    whatsapp_number: '',
    reservation_date: '',
    reservation_time: '',
    party_size: '',
    special_requests: ''
  })

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('boeking_token')
    : null

  const base = process.env.NEXT_PUBLIC_API_URL

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setAvailability(null)
    setError('')
  }

  const checkAvailability = async () => {
    if (!form.reservation_date || !form.reservation_time || !form.party_size) {
      setError('Please fill in date, time and party size first')
      return
    }

    setChecking(true)
    setAvailability(null)

    try {
      const res = await fetch(
        `${base}/dashboard/availability?date=${form.reservation_date}&time=${form.reservation_time}&party=${form.party_size}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setAvailability(data)
    } catch (err) {
      setError('Failed to check availability')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${base}/dashboard/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create booking')
        return
      }

      setSuccess(`Booking confirmed! ${form.customer_name} is booked for ${form.reservation_date} at ${form.reservation_time}.`)

      // Reset form
      setForm({
        customer_name: '',
        whatsapp_number: '',
        reservation_date: '',
        reservation_time: '',
        party_size: '',
        special_requests: ''
      })
      setAvailability(null)

    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate time slots
  const timeSlots = []
  for (let h = 11; h <= 21; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-white transition text-sm"
        >
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">New Booking</h1>
      <p className="text-gray-500 text-sm mb-10">
        Add a manual booking for a walk-in or phone reservation
      </p>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 text-green-400 mb-8">
          {success}
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setSuccess('')}
              className="text-sm bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-xl transition"
            >
              Add another booking
            </button>
            <Link
              href="/dashboard"
              className="text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Customer details */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Customer details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                required
                placeholder="e.g. Sarah Johnson"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                WhatsApp number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="whatsapp_number"
                value={form.whatsapp_number}
                onChange={handleChange}
                required
                placeholder="e.g. 27821234567"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
              <p className="text-gray-600 text-xs mt-1">
                Include country code without + e.g. 27821234567
              </p>
            </div>
          </div>
        </div>

        {/* Reservation details */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Reservation details</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="reservation_date"
                  value={form.reservation_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Time <span className="text-red-400">*</span>
                </label>
                <select
                  name="reservation_time"
                  value={form.reservation_time}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                >
                  <option value="">Select time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Party size <span className="text-red-400">*</span>
              </label>
              <select
                name="party_size"
                value={form.party_size}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              >
                <option value="">Select party size</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                ))}
              </select>
            </div>

            {/* Availability check */}
            <div>
              <button
                type="button"
                onClick={checkAvailability}
                disabled={checking || !form.reservation_date || !form.reservation_time || !form.party_size}
                className="w-full py-3 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {checking ? 'Checking availability...' : 'Check availability'}
              </button>

              {availability && (
                <div className={`mt-3 px-4 py-3 rounded-xl text-sm ${
                  availability.available
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {availability.available ? (
                    '✓ This slot is available'
                  ) : (
                    <>
                      <div>✗ {availability.reason}</div>
                      {availability.alternatives?.length > 0 && (
                        <div className="mt-1 text-red-300">
                          Available alternatives: {availability.alternatives.join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Special requests
              </label>
              <textarea
                name="special_requests"
                value={form.special_requests}
                onChange={handleChange}
                rows={3}
                placeholder="Allergies, special occasion, seating preference..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-2xl transition"
        >
          {loading ? 'Creating booking...' : 'Confirm booking'}
        </button>

      </form>
    </div>
  )
}