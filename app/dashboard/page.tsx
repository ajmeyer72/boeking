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
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today')
  const [loading, setLoading] = useState(true)

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const base = process.env.NEXT_PUBLIC_API_URL

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

  useEffect(() => {
    fetchData()
  }, [])

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/reservations/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })

    fetchData()
  }

  const handleNoShow = async (id: string) => {
    if (!confirm('Mark this reservation as a no-show?')) return

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/reservations/${id}/noshow`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })

    fetchData()
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Johannesburg'
  })

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
      </div>

      {/* Bookings table */}
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
    </div>
  )
}