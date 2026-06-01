'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [originalReservation, setOriginalReservation] = useState<any>(null)

  const [form, setForm] = useState({
    reservation_date: '',
    reservation_time: '',
    party_size: '',
    special_requests: '',
    internal_notes: ''
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`${base}/dashboard/reservations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          setError('Reservation not found')
          return
        }

        const r = data.reservation
        setOriginalReservation(r)
        setForm({
          reservation_date: r.reservation_date.split('T')[0],
          reservation_time: r.reservation_time.slice(0, 5),
          party_size: r.party_size.toString(),
          special_requests: r.special_requests || '',
          internal_notes: r.internal_notes || ''
        })
      } catch (err) {
        setError('Failed to load reservation')
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [id])

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
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${base}/dashboard/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update booking')
        return
      }

      setSuccess('Booking updated successfully')
      setTimeout(() => router.push('/dashboard'), 1500)

    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const timeSlots: string[] = []
  for (let h = 11; h <= 21; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading booking...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link href="/dashboard" className="text-gray-500 hover:text-white transition text-sm">
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Edit Booking</h1>

      {originalReservation && (
        <p className="text-gray-500 text-sm mb-10">
          {originalReservation.customer_name || 'Unknown'} · +{originalReservation.whatsapp_number}
        </p>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm mb-6">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Reservation details */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Reservation details</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  name="reservation_date"
                  value={form.reservation_date}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Time</label>
                <select
                  name="reservation_time"
                  value={form.reservation_time}
                  onChange={handleChange}
                  required
                  style={{ backgroundColor: '#0B0F14', color: 'white' }}
                  className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition"
                >
                  <option value="" style={{ backgroundColor: '#0B0F14' }}>Select time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot} style={{ backgroundColor: '#0B0F14' }}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Party size</label>
              <select
                name="party_size"
                value={form.party_size}
                onChange={handleChange}
                required
                style={{ backgroundColor: '#0B0F14', color: 'white' }}
                className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition"
              >
                <option value="" style={{ backgroundColor: '#0B0F14' }}>Select party size</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n} style={{ backgroundColor: '#0B0F14' }}>
                    {n} {n === 1 ? 'guest' : 'guests'}
                  </option>
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
              <label className="block text-sm text-gray-400 mb-2">Special requests</label>
              <textarea
                name="special_requests"
                value={form.special_requests}
                onChange={handleChange}
                rows={2}
                placeholder="Allergies, special occasion, seating preference..."
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Internal notes
                <span className="ml-2 text-gray-600 font-normal">(not visible to customer)</span>
              </label>
              <textarea
                name="internal_notes"
                value={form.internal_notes}
                onChange={handleChange}
                rows={2}
                placeholder="Staff notes, VIP flag, dietary warnings..."
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-2xl transition"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-4 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}