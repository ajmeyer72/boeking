'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Reservation {
  id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  special_requests: string | null
  customer_name: string
  whatsapp_number: string
}

interface Stats {
  today_count: string
  today_covers: string
  week_count: string
  cancellations_30d: string
  no_shows_30d: string
}

export default function DashboardPage() {
  const [todayBookings, setTodayBookings] = useState<Reservation[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Reservation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'calendar'>('today')
  const [loading, setLoading] = useState(true)

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [calendarBookings, setCalendarBookings] = useState<Record<string, Reservation[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [todayRes, upcomingRes, statsRes] = await Promise.all([
        fetch(`${base}/dashboard/today`, { headers }),
        fetch(`${base}/dashboard/upcoming`, { headers }),
        fetch(`${base}/dashboard/stats`, { headers })
      ])

      const today = await todayRes.json()
      const upcoming = await upcomingRes.json()
      const statsData = await statsRes.json()

      setTodayBookings(today.reservations || [])
      setUpcomingBookings(upcoming.reservations || [])
      setStats(statsData.stats || null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendar = async (date: Date) => {
    setCalendarLoading(true)
    try {
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      const res = await fetch(`${base}/dashboard/calendar?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCalendarBookings(data.bookings || {})
    } catch (err) {
      console.error('Failed to fetch calendar:', err)
    } finally {
      setCalendarLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendar(calendarMonth)
    }
  }, [activeTab, calendarMonth])

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return
    await fetch(`${base}/dashboard/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchData()
    if (activeTab === 'calendar') fetchCalendar(calendarMonth)
  }

  const handleNoShow = async (id: string) => {
    if (!confirm('Mark this reservation as a no-show?')) return
    await fetch(`${base}/dashboard/reservations/${id}/noshow`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchData()
    if (activeTab === 'calendar') fetchCalendar(calendarMonth)
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Johannesburg'
  })

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getDateString = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  const isPast = (dateStr: string) => {
    return dateStr < new Date().toISOString().split('T')[0]
  }

  const selectedBookings = selectedDate ? (calendarBookings[selectedDate] || []) : []

  // Group bookings by time slot
  const groupByTime = (bookings: Reservation[]) => {
    const grouped: Record<string, Reservation[]> = {}
    bookings.forEach(b => {
      const time = formatTime(b.reservation_time)
      if (!grouped[time]) grouped[time] = []
      grouped[time].push(b)
    })
    return grouped
  }

  const bookings = activeTab === 'today' ? todayBookings : upcomingBookings

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-3 rounded-xl transition text-sm"
        >
          + New booking
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold text-green-400">{stats.today_count}</div>
            <div className="text-gray-500 text-sm mt-1">Bookings today</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold text-green-400">{stats.today_covers}</div>
            <div className="text-gray-500 text-sm mt-1">Covers today</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold text-green-400">{stats.week_count}</div>
            <div className="text-gray-500 text-sm mt-1">Bookings this week</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <div className="text-3xl font-bold text-red-400">{stats.no_shows_30d}</div>
            <div className="text-gray-500 text-sm mt-1">No-shows (30 days)</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'today'
              ? 'bg-green-500 text-black'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Today ({todayBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'upcoming'
              ? 'bg-green-500 text-black'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Next 7 days ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'calendar'
              ? 'bg-green-500 text-black'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Calendar
        </button>
      </div>

      {/* CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Calendar */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const prev = new Date(calendarMonth)
                  prev.setMonth(prev.getMonth() - 1)
                  setCalendarMonth(prev)
                  setSelectedDate(null)
                }}
                className="text-gray-400 hover:text-white transition px-3 py-1 rounded-lg hover:bg-white/5"
              >
                ←
              </button>
              <h2 className="font-semibold">
                {calendarMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => {
                  const next = new Date(calendarMonth)
                  next.setMonth(next.getMonth() + 1)
                  setCalendarMonth(next)
                  setSelectedDate(null)
                }}
                className="text-gray-400 hover:text-white transition px-3 py-1 rounded-lg hover:bg-white/5"
              >
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {calendarLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day offset */}
                {Array.from({ length: getDaysInMonth(calendarMonth).firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: getDaysInMonth(calendarMonth).daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = getDateString(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    day
                  )
                  const hasBookings = calendarBookings[dateStr]?.length > 0
                  const bookingCount = calendarBookings[dateStr]?.length || 0
                  const isSelected = selectedDate === dateStr
                  const todayDate = isToday(dateStr)
                  const past = isPast(dateStr)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition
                        ${isSelected ? 'bg-green-500 text-black' : ''}
                        ${!isSelected && todayDate ? 'border border-green-500/50 text-green-400' : ''}
                        ${!isSelected && !todayDate && hasBookings ? 'bg-white/5 hover:bg-white/10 text-white' : ''}
                        ${!isSelected && !todayDate && !hasBookings && !past ? 'hover:bg-white/5 text-gray-400' : ''}
                        ${past && !isSelected ? 'text-gray-700' : ''}
                      `}
                    >
                      <span className="font-medium">{day}</span>
                      {hasBookings && !isSelected && (
                        <span className="text-xs text-green-400 font-mono leading-none">
                          {bookingCount}
                        </span>
                      )}
                      {hasBookings && isSelected && (
                        <span className="text-xs text-black font-mono leading-none">
                          {bookingCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded bg-white/5" />
                Has bookings
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded bg-green-500" />
                Selected
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded border border-green-500/50" />
                Today
              </div>
            </div>
          </div>

          {/* Day detail */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="text-4xl mb-4">📅</div>
                <div className="text-gray-400 font-medium">Select a date</div>
                <div className="text-gray-600 text-sm mt-1">
                  Click any date on the calendar to see bookings
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-ZA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {selectedBookings.length === 0
                    ? 'No bookings'
                    : `${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''} · ${selectedBookings.reduce((sum, b) => sum + b.party_size, 0)} covers`
                  }
                </p>

                {selectedBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 text-sm">
                    No bookings for this date
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupByTime(selectedBookings))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([time, timeBookings]) => (
                        <div key={time}>
                          {/* Time slot header */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-green-400 font-mono font-medium text-sm">
                              {time}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-xs text-gray-600">
                              {timeBookings.reduce((sum, b) => sum + b.party_size, 0)} covers
                            </span>
                          </div>

                          {/* Bookings at this time */}
                          <div className="space-y-2 ml-2">
                            {timeBookings.map(booking => (
                              <div
                                key={booking.id}
                                className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {booking.customer_name || 'Unknown'}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                                    <span>{booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}</span>
                                    {booking.special_requests && (
                                      <>
                                        <span>·</span>
                                        <span className="truncate max-w-[140px]">{booking.special_requests}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                  <button
                                    onClick={() => handleNoShow(booking.id)}
                                    className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition"
                                  >
                                    No show
                                  </button>
                                  <button
                                    onClick={() => handleCancel(booking.id)}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TODAY / UPCOMING TABLE VIEW */}
      {activeTab !== 'calendar' && (
        <>
          {bookings.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">🍽️</div>
              <div className="text-gray-400 font-medium">No reservations</div>
              <div className="text-gray-600 text-sm mt-1">
                {activeTab === 'today' ? 'No bookings for today' : 'No bookings in the next 7 days'}
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Time</th>
                    {activeTab === 'upcoming' && (
                      <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Date</th>
                    )}
                    <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Guest</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Party</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Requests</th>
                    <th className="text-left px-6 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, i) => (
                    <tr
                      key={booking.id}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition ${
                        i % 2 === 0 ? '' : 'bg-white/[0.01]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-green-400 font-mono font-medium">
                          {formatTime(booking.reservation_time)}
                        </span>
                      </td>
                      {activeTab === 'upcoming' && (
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(booking.reservation_date)}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="font-medium">{booking.customer_name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs mt-0.5">+{booking.whatsapp_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-sm">
                          {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm max-w-[200px] truncate">
                        {booking.special_requests || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNoShow(booking.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition"
                          >
                            No show
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}