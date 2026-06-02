'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function NewRestaurantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    slug: '',
    whatsapp_number: '',
    meta_phone_number_id: '',
    restaurant_display_name: '',
    greeting_message: '',
    bot_tone: 'friendly',
    slot_duration_mins: '90',
    max_covers_per_slot: '20',
    max_party_size: '12',
    min_notice_hours: '2',
    booking_window_days: '30',
    owner_name: '',
    owner_email: '',
    owner_password: ''
  })

  const [hours, setHours] = useState(
    DAYS.map((_, i) => ({
      day_of_week: i,
      open_time: '11:00',
      close_time: '22:00',
      is_closed: i === 1 // Monday closed by default
    }))
  )

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Auto-generate slug from name
    if (name === 'name') {
      setForm(prev => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        restaurant_display_name: value
      }))
    }
  }

  const updateHour = (index: number, field: string, value: any) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${base}/admin/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, hours })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create restaurant')
        return
      }

      router.push('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const timeOptions: string[] = []
  for (let h = 7; h <= 24; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 24) timeOptions.push(`${h.toString().padStart(2, '0')}:30`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/admin" className="text-gray-500 hover:text-white transition text-sm">
          ← Back to restaurants
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Add Restaurant</h1>
      <p className="text-gray-500 text-sm mb-10">Onboard a new restaurant onto Boeking</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Restaurant details */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Restaurant details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Restaurant name <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. The Grill House"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Slug <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  placeholder="the-grill-house"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
                <p className="text-gray-600 text-xs mt-1">Auto-generated from name</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">WhatsApp number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="whatsapp_number"
                  value={form.whatsapp_number}
                  onChange={handleChange}
                  required
                  placeholder="27831234567"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Meta Phone Number ID <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="meta_phone_number_id"
                value={form.meta_phone_number_id}
                onChange={handleChange}
                required
                placeholder="e.g. 1148428885018977"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
              <p className="text-gray-600 text-xs mt-1">Found in Meta Developer Dashboard → WhatsApp → API Setup</p>
            </div>
          </div>
        </div>

        {/* Bot settings */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Bot customisation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Display name</label>
              <input
                type="text"
                name="restaurant_display_name"
                value={form.restaurant_display_name}
                onChange={handleChange}
                placeholder="How the bot refers to the restaurant"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bot tone</label>
              <select
                name="bot_tone"
                value={form.bot_tone}
                onChange={handleChange}
                style={{ backgroundColor: '#0B0F14', color: 'white' }}
                className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition"
              >
                <option value="friendly" style={{ backgroundColor: '#0B0F14' }}>Friendly — warm and approachable</option>
                <option value="formal" style={{ backgroundColor: '#0B0F14' }}>Formal — professional and polished</option>
                <option value="casual" style={{ backgroundColor: '#0B0F14' }}>Casual — relaxed and conversational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Custom greeting</label>
              <textarea
                name="greeting_message"
                value={form.greeting_message}
                onChange={handleChange}
                rows={3}
                placeholder="Leave blank to use default greeting"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Booking config */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Booking configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max covers per slot</label>
              <input
                type="number"
                name="max_covers_per_slot"
                value={form.max_covers_per_slot}
                onChange={handleChange}
                min="1"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max party size</label>
              <input
                type="number"
                name="max_party_size"
                value={form.max_party_size}
                onChange={handleChange}
                min="1"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slot duration (mins)</label>
              <select
                name="slot_duration_mins"
                value={form.slot_duration_mins}
                onChange={handleChange}
                style={{ backgroundColor: '#0B0F14', color: 'white' }}
                className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition"
              >
                {[30, 60, 90, 120, 150, 180].map(n => (
                  <option key={n} value={n} style={{ backgroundColor: '#0B0F14' }}>{n} minutes</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min notice (hours)</label>
              <input
                type="number"
                name="min_notice_hours"
                value={form.min_notice_hours}
                onChange={handleChange}
                min="0"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Booking window (days)</label>
              <input
                type="number"
                name="booking_window_days"
                value={form.booking_window_days}
                onChange={handleChange}
                min="1"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
          </div>
        </div>

        {/* Operating hours */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Operating hours</h2>
          <div className="space-y-3">
            {hours.map((hour, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-white/5 last:border-0">
                <div className="col-span-3 text-sm font-medium text-gray-300">{DAYS[i]}</div>
                <div className="col-span-2 flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hour.is_closed}
                      onChange={e => updateHour(i, 'is_closed', !e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
                  </label>
                  <span className="ml-2 text-xs text-gray-500">{hour.is_closed ? 'Closed' : 'Open'}</span>
                </div>
                {!hour.is_closed ? (
                  <>
                    <div className="col-span-3">
                      <select
                        value={hour.open_time}
                        onChange={e => updateHour(i, 'open_time', e.target.value)}
                        style={{ backgroundColor: '#0B0F14', color: 'white' }}
                        className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                      >
                        {timeOptions.map(t => (
                          <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 text-center text-gray-600 text-sm">to</div>
                    <div className="col-span-3">
                      <select
                        value={hour.close_time}
                        onChange={e => updateHour(i, 'close_time', e.target.value)}
                        style={{ backgroundColor: '#0B0F14', color: 'white' }}
                        className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                      >
                        {timeOptions.map(t => (
                          <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-span-7 text-sm text-gray-600 italic">Closed all day</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Owner login */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Owner login</h2>
          <p className="text-gray-500 text-sm mb-5">Create the restaurant owner's dashboard access</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Owner name</label>
              <input
                type="text"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="e.g. Sarah Johnson"
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="owner_email"
                  value={form.owner_email}
                  onChange={handleChange}
                  placeholder="owner@restaurant.com"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  name="owner_password"
                  value={form.owner_password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-4 rounded-2xl transition"
        >
          {loading ? 'Creating restaurant...' : 'Create restaurant'}
        </button>

      </form>
    </div>
  )
}