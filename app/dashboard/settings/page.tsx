'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Hour {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

interface Config {
  slot_duration_mins: number
  max_covers_per_slot: number
  max_party_size: number
  min_notice_mins: number
  booking_window_days: number
  greeting_message: string
  restaurant_display_name: string
  bot_tone: string
  reminder_1_hours: number
  reminder_2_hours: number
  reminder_2_enabled: boolean
  late_grace_mins: number
  late_hold_mins: number
  auto_noshow_mins: number
  late_notifications_enabled: boolean
  booking_notifications_enabled: boolean
  notification_number: string
}

interface BlockedDate {
  id: string
  blocked_date: string
  reason: string | null
}

interface SpecialEvent {
  id: string
  event_name: string
  event_date: string
  start_time: string
  end_time: string
  cover_charge: string | null
  description: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'hours' | 'config' | 'blocked' | 'bot' | 'reminders' | 'events'>('hours')

  const [hours, setHours] = useState<Hour[]>([])
  const [config, setConfig] = useState<Config>({
    slot_duration_mins: 90,
    max_covers_per_slot: 20,
    max_party_size: 12,
    min_notice_mins: 60,
    booking_window_days: 30,
    greeting_message: '',
    restaurant_display_name: '',
    bot_tone: 'friendly',
    reminder_1_hours: 24,
    reminder_2_hours: 2,
    reminder_2_enabled: true,
    late_grace_mins: 15,
    late_hold_mins: 30,
    auto_noshow_mins: 45,
    late_notifications_enabled: true,
    booking_notifications_enabled: false,
    notification_number: ''
  })
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedReason, setNewBlockedReason] = useState('')
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    event_date: '',
    start_time: '',
    end_time: '',
    cover_charge: '',
    description: ''
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${base}/dashboard/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      const hoursMap: Record<number, Hour> = {}
      data.hours.forEach((h: Hour) => {
        hoursMap[h.day_of_week] = {
          ...h,
          open_time: h.open_time.slice(0, 5),
          close_time: h.close_time.slice(0, 5)
        }
      })

      const fullHours = Array.from({ length: 7 }, (_, i) => (
        hoursMap[i] || { day_of_week: i, open_time: '11:00', close_time: '22:00', is_closed: false }
      ))

      setHours(fullHours)
      setBlockedDates(data.blocked || [])

      if (data.settings) {
        setConfig({
          slot_duration_mins: data.settings.slot_duration_mins || 90,
          max_covers_per_slot: data.settings.max_covers_per_slot || 20,
          max_party_size: data.settings.max_party_size || 12,
          min_notice_mins: data.settings.min_notice_mins != null ? data.settings.min_notice_mins : 60,
          booking_window_days: data.settings.booking_window_days || 30,
          greeting_message: data.settings.greeting_message || '',
          restaurant_display_name: data.settings.restaurant_display_name || '',
          bot_tone: data.settings.bot_tone || 'friendly',
          reminder_1_hours: data.settings.reminder_1_hours || 24,
          reminder_2_hours: data.settings.reminder_2_hours || 2,
          reminder_2_enabled: data.settings.reminder_2_enabled !== false,
          late_grace_mins: data.settings.late_grace_mins || 15,
          late_hold_mins: data.settings.late_hold_mins || 30,
          auto_noshow_mins: data.settings.auto_noshow_mins || 45,
          late_notifications_enabled: data.settings.late_notifications_enabled !== false,
          booking_notifications_enabled: data.settings.booking_notifications_enabled || false,
          notification_number: data.settings.notification_number || ''
        })
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${base}/dashboard/events`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSpecialEvents(data.events || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchEvents()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const saveHours = async () => {
    setSaving('hours')
    setError(null)
    try {
      const res = await fetch(`${base}/dashboard/settings/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hours })
      })
      if (!res.ok) throw new Error()
      showSuccess('Operating hours saved')
    } catch {
      setError('Failed to save operating hours')
    } finally {
      setSaving(null)
    }
  }

  const saveConfig = async () => {
    setSaving('config')
    setError(null)
    try {
      const res = await fetch(`${base}/dashboard/settings/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error()
      showSuccess('Settings saved')
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(null)
    }
  }

  const addBlockedDate = async () => {
    if (!newBlockedDate) return
    setSaving('blocked')
    setError(null)
    try {
      const res = await fetch(`${base}/dashboard/settings/blocked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: newBlockedDate, reason: newBlockedReason })
      })
      if (!res.ok) throw new Error()
      setNewBlockedDate('')
      setNewBlockedReason('')
      fetchSettings()
      showSuccess('Date blocked')
    } catch {
      setError('Failed to add blocked date')
    } finally {
      setSaving(null)
    }
  }

  const removeBlockedDate = async (date: string) => {
    try {
      await fetch(`${base}/dashboard/settings/blocked/${date}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSettings()
      showSuccess('Date unblocked')
    } catch {
      setError('Failed to remove blocked date')
    }
  }

  const addEvent = async () => {
    if (!newEvent.event_name || !newEvent.event_date || !newEvent.start_time || !newEvent.end_time) {
      setError('Event name, date, start time and end time are required')
      return
    }
    setSaving('events')
    setError(null)
    try {
      const res = await fetch(`${base}/dashboard/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEvent)
      })
      if (!res.ok) throw new Error()
      setNewEvent({ event_name: '', event_date: '', start_time: '', end_time: '', cover_charge: '', description: '' })
      setShowAddEvent(false)
      fetchEvents()
      showSuccess('Event added')
    } catch {
      setError('Failed to add event')
    } finally {
      setSaving(null)
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await fetch(`${base}/dashboard/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchEvents()
      showSuccess('Event deleted')
    } catch {
      setError('Failed to delete event')
    }
  }

  const updateHour = (dayIndex: number, field: keyof Hour, value: string | boolean) => {
    setHours((prev: Hour[]) => prev.map((h: Hour, i: number) => i === dayIndex ? { ...h, [field]: value } : h))
  }

  const formatEventDate = (date: string) => {
    const clean = date.toString().split('T')[0]
    return new Date(clean + 'T12:00:00').toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const timeOptions: string[] = []
  for (let h = 7; h <= 24; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 24) timeOptions.push(`${h.toString().padStart(2, '0')}:30`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/dashboard" className="text-gray-500 hover:text-white transition text-sm">
          Back to dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-10">Manage your restaurant booking configuration</p>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { key: 'hours', label: 'Opening hours' },
          { key: 'config', label: 'Booking config' },
          { key: 'blocked', label: 'Blocked dates' },
          { key: 'bot', label: 'Bot customisation' },
          { key: 'reminders', label: 'Reminders' },
          { key: 'events', label: 'Special events' },
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as 'hours' | 'config' | 'blocked' | 'bot' | 'reminders' | 'events')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeSection === section.key ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'hours' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Opening hours</h2>
          <div className="space-y-3">
            {hours.map((hour, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-white/5 last:border-0">
                <div className="col-span-3 text-sm font-medium text-gray-300">{DAYS[hour.day_of_week]}</div>
                <div className="col-span-2 flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!hour.is_closed} onChange={e => updateHour(i, 'is_closed', !e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
                  </label>
                  <span className="ml-2 text-xs text-gray-500">{hour.is_closed ? 'Closed' : 'Open'}</span>
                </div>
                {!hour.is_closed ? (
                  <>
                    <div className="col-span-3">
                      <select value={hour.open_time} onChange={e => updateHour(i, 'open_time', e.target.value)} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-500/50">
                        {timeOptions.map(t => <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 text-center text-gray-600 text-sm">to</div>
                    <div className="col-span-3">
                      <select value={hour.close_time} onChange={e => updateHour(i, 'close_time', e.target.value)} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-500/50">
                        {timeOptions.map(t => <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-span-7 text-sm text-gray-600 italic">Closed all day</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={saveHours} disabled={saving === 'hours'} className="mt-6 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            {saving === 'hours' ? 'Saving...' : 'Save hours'}
          </button>
        </div>
      )}

      {activeSection === 'config' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Booking configuration</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max covers per slot</label>
                <input type="number" value={config.max_covers_per_slot} onChange={e => setConfig({ ...config, max_covers_per_slot: parseInt(e.target.value) })} min={1} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                <p className="text-gray-600 text-xs mt-1">Total guests across all bookings per time slot</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max party size</label>
                <input type="number" value={config.max_party_size} onChange={e => setConfig({ ...config, max_party_size: parseInt(e.target.value) })} min={1} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                <p className="text-gray-600 text-xs mt-1">Largest single booking accepted via WhatsApp</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Minimum notice (minutes)</label>
                <input
                  type="number"
                  value={config.min_notice_mins}
                  onChange={e => setConfig({ ...config, min_notice_mins: parseInt(e.target.value) })}
                  min={0}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                />
                <p className="text-gray-600 text-xs mt-1">e.g. 15 for same-day bookings, 120 for 2 hours notice</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Booking window (days)</label>
                <input type="number" value={config.booking_window_days} onChange={e => setConfig({ ...config, booking_window_days: parseInt(e.target.value) })} min={1} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                <p className="text-gray-600 text-xs mt-1">How far ahead customers can book</p>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slot duration (minutes)</label>
              <select value={config.slot_duration_mins} onChange={e => setConfig({ ...config, slot_duration_mins: parseInt(e.target.value) })} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition">
                {[30, 60, 90, 120, 150, 180].map(n => <option key={n} value={n} style={{ backgroundColor: '#0B0F14' }}>{n} minutes</option>)}
              </select>
              <p className="text-gray-600 text-xs mt-1">Average time a table is occupied per booking</p>
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving === 'config'} className="mt-6 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            {saving === 'config' ? 'Saving...' : 'Save config'}
          </button>
        </div>
      )}

      {activeSection === 'blocked' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Blocked dates</h2>
          <p className="text-gray-500 text-sm mb-6">Dates when the restaurant is not accepting bookings</p>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Block a date</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 transition" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <input type="text" value={newBlockedReason} onChange={e => setNewBlockedReason(e.target.value)} placeholder="e.g. Private event" className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition" />
              </div>
            </div>
            <button onClick={addBlockedDate} disabled={!newBlockedDate || saving === 'blocked'} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition">
              {saving === 'blocked' ? 'Adding...' : 'Block date'}
            </button>
          </div>
          {blockedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No blocked dates</div>
          ) : (
            <div className="space-y-2">
              {blockedDates.map(bd => (
                <div key={bd.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(bd.blocked_date.toString().split('T')[0] + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {bd.reason && <div className="text-xs text-gray-500 mt-0.5">{bd.reason}</div>}
                  </div>
                  <button onClick={() => removeBlockedDate(bd.blocked_date.split('T')[0])} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'bot' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Bot customisation</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Restaurant display name</label>
              <input type="text" value={config.restaurant_display_name} onChange={e => setConfig({ ...config, restaurant_display_name: e.target.value })} placeholder="e.g. The Grill House" className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition" />
              <p className="text-gray-600 text-xs mt-1">How the bot refers to your restaurant in messages</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Bot tone</label>
              <select value={config.bot_tone} onChange={e => setConfig({ ...config, bot_tone: e.target.value })} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500/50 transition">
                <option value="friendly" style={{ backgroundColor: '#0B0F14' }}>Friendly - warm and approachable</option>
                <option value="formal" style={{ backgroundColor: '#0B0F14' }}>Formal - professional and polished</option>
                <option value="casual" style={{ backgroundColor: '#0B0F14' }}>Casual - relaxed and conversational</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Custom greeting message</label>
              <textarea value={config.greeting_message} onChange={e => setConfig({ ...config, greeting_message: e.target.value })} rows={4} placeholder="e.g. Welcome to The Grill House! How can we help you today?" className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none" />
              <p className="text-gray-600 text-xs mt-1">Leave blank to use the default greeting.</p>
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving === 'config'} className="mt-6 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            {saving === 'config' ? 'Saving...' : 'Save bot settings'}
          </button>
        </div>
      )}

      {activeSection === 'reminders' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Reminder settings</h2>
          <p className="text-gray-500 text-sm mb-6">Configure when reminders and notifications are sent</p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Booking reminders</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">First reminder (hours before)</label>
                  <input type="number" value={config.reminder_1_hours} onChange={e => setConfig({ ...config, reminder_1_hours: parseInt(e.target.value) })} min={1} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                  <p className="text-gray-600 text-xs mt-1">Default: 24 hours before</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-300">2-hour reminder</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send a second reminder 2 hours before the reservation</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.reminder_2_enabled} onChange={e => setConfig({ ...config, reminder_2_enabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
                </label>
              </div>

              {config.reminder_2_enabled && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Second reminder (hours before)</label>
                  <input type="number" value={config.reminder_2_hours} onChange={e => setConfig({ ...config, reminder_2_hours: parseInt(e.target.value) })} min={1} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                  <p className="text-gray-600 text-xs mt-1">Default: 2 hours before</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-300">Late arrival notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send WhatsApp message to customers who have not arrived by their reservation time</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.late_notifications_enabled} onChange={e => setConfig({ ...config, late_notifications_enabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
                </label>
              </div>

              {config.late_notifications_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Grace period (minutes)</label>
                    <input type="number" value={config.late_grace_mins} onChange={e => setConfig({ ...config, late_grace_mins: parseInt(e.target.value) })} min={5} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                    <p className="text-gray-600 text-xs mt-1">How long after reservation time before sending late notification</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Hold table for (minutes)</label>
                    <input type="number" value={config.late_hold_mins} onChange={e => setConfig({ ...config, late_hold_mins: parseInt(e.target.value) })} min={5} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                    <p className="text-gray-600 text-xs mt-1">How long to hold the table after sending late notification</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Auto no-show after (minutes)</label>
                    <input type="number" value={config.auto_noshow_mins} onChange={e => setConfig({ ...config, auto_noshow_mins: parseInt(e.target.value) })} min={15} className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition" />
                    <p className="text-gray-600 text-xs mt-1">Total minutes after reservation time before automatically marking as no-show</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-300">New booking notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send a WhatsApp notification when a new booking is made via the bot</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.booking_notifications_enabled} onChange={e => setConfig({ ...config, booking_notifications_enabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
                </label>
              </div>

              {config.booking_notifications_enabled && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Notification WhatsApp number</label>
                  <input
                    type="text"
                    value={config.notification_number}
                    onChange={e => {
                      let num = e.target.value.replace(/[\s\-\+]/g, '')
                      if (num.startsWith('0')) num = '27' + num.slice(1)
                      setConfig({ ...config, notification_number: num })
                    }}
                    placeholder="e.g. 27821234567"
                    className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                  />
                  <p className="text-gray-600 text-xs mt-1">The number that will receive a WhatsApp notification for every new booking</p>
                </div>
              )}
            </div>
          </div>

          <button onClick={saveConfig} disabled={saving === 'config'} className="mt-6 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            {saving === 'config' ? 'Saving...' : 'Save reminder settings'}
          </button>
        </div>
      )}

      {activeSection === 'events' && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Special events</h2>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="text-sm px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition"
            >
              + Add event
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Add special events like jazz nights or theme dinners. Customers will be informed of the event and cover charge when booking for that time.
          </p>

          {showAddEvent && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">New special event</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Event name <span className="text-red-400">*</span></label>
                  <input type="text" value={newEvent.event_name} onChange={e => setNewEvent({ ...newEvent, event_name: e.target.value })} placeholder="e.g. Jazz Evening with The Blue Notes" className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date <span className="text-red-400">*</span></label>
                    <input type="date" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 transition" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start time <span className="text-red-400">*</span></label>
                    <select value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500/50">
                      <option value="" style={{ backgroundColor: '#0B0F14' }}>Select</option>
                      {timeOptions.map(t => <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End time <span className="text-red-400">*</span></label>
                    <select value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} style={{ backgroundColor: '#0B0F14', color: 'white' }} className="w-full border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500/50">
                      <option value="" style={{ backgroundColor: '#0B0F14' }}>Select</option>
                      {timeOptions.map(t => <option key={t} value={t} style={{ backgroundColor: '#0B0F14' }}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cover charge (R) — leave blank if no charge</label>
                  <input type="number" value={newEvent.cover_charge} onChange={e => setNewEvent({ ...newEvent, cover_charge: e.target.value })} placeholder="e.g. 150" min={0} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                  <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} rows={2} placeholder="e.g. Live jazz from 19:00 to 22:00. Smart casual dress code." className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={addEvent} disabled={saving === 'events'} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition">
                    {saving === 'events' ? 'Adding...' : 'Add event'}
                  </button>
                  <button onClick={() => setShowAddEvent(false)} className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {specialEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">No special events scheduled</div>
          ) : (
            <div className="space-y-3">
              {specialEvents.map(event => (
                <div key={event.id} className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-medium">{event.event_name}</span>
                      {event.cover_charge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          R{parseFloat(event.cover_charge).toFixed(0)} cover charge
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{formatEventDate(event.event_date)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}</div>
                    {event.description && <div className="text-xs text-gray-600 mt-1">{event.description}</div>}
                  </div>
                  <button onClick={() => deleteEvent(event.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition flex-shrink-0 ml-4">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
