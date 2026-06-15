'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Reservation {
  id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  special_requests: string | null
  internal_notes: string | null
  customer_name: string
  whatsapp_number: string
  arrived_at: string | null
}

interface WaitingEntry {
  id: string
  requested_time: string
  party_size: number
  status: string
  customer_name: string | null
  whatsapp_number: string
  special_requests: string | null
}

export default function DaySheetPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitingList, setWaitingList] = useState<WaitingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const userData = localStorage.getItem('boeking_user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setRestaurantName(parsed.restaurantName || '')
    }

    fetchDaySheet()
  }, [date])

  const fetchDaySheet = async () => {
    try {
      const res = await fetch(`${base}/dashboard/dayview?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setReservations(data.reservations || [])
      setWaitingList(data.waitingList || [])
    } catch (err) {
      console.error('Failed to fetch day sheet:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg'
    })
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const totalCovers = reservations.reduce((sum, r) => sum + r.party_size, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-gray-500">Loading day sheet...</div>
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page {
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
          body { background: white !important; }
          .print-table th { background: #f3f4f6 !important; color: black !important; }
          .print-table td { color: black !important; border-color: #e5e7eb !important; }
          .print-header { color: black !important; }
          .print-badge { border: 1px solid #ccc !important; color: #333 !important; background: #f9f9f9 !important; }
          .print-waiting { background: #fffbeb !important; color: black !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#0B0F14] text-white print-page">

        {/* Nav — hidden when printing */}
        <div className="no-print border-b border-white/5 bg-[#0B0F14]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-white transition text-sm">
                &larr; Dashboard
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold text-sm">b</div>
                <span className="font-semibold text-sm">boeking</span>
              </Link>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-xl transition text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print day sheet
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 print-header">
            <div>
              <div className="text-green-400 text-sm font-medium mb-1 no-print">{restaurantName}</div>
              <h1 className="text-3xl font-bold mb-1">{formatDate(date)}</h1>
              <p className="text-gray-400 text-sm">Reservation day sheet</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-400">{reservations.length}</div>
              <div className="text-gray-400 text-sm">bookings</div>
              <div className="text-2xl font-bold mt-2">{totalCovers}</div>
              <div className="text-gray-400 text-sm">covers</div>
            </div>
          </div>

          {/* Reservations table */}
          {reservations.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-16 text-center no-print">
              <div className="text-4xl mb-4">&#127869;</div>
              <div className="text-gray-400 font-medium">No bookings for this date</div>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Confirmed bookings</h2>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden print-table">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Guest</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Party</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Special requests</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider no-print">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrived</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations
                      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
                      .map((booking, i) => (
                        <tr
                          key={booking.id}
                          className={`border-b border-white/5 last:border-0 ${
                            i % 2 === 0 ? '' : 'bg-white/[0.01]'
                          } ${booking.arrived_at ? 'bg-green-500/5' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <span className="text-green-400 font-mono font-bold text-lg">
                              {formatTime(booking.reservation_time)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold">{booking.customer_name || 'Unknown'}</div>
                            <div className="text-gray-500 text-xs mt-0.5 no-print">+{booking.whatsapp_number}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-lg">{booking.party_size}</span>
                            <span className="text-gray-400 text-sm ml-1">{booking.party_size === 1 ? 'guest' : 'guests'}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-300 max-w-[200px]">
                            {booking.special_requests || <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-5 py-4 text-sm text-yellow-400/80 max-w-[160px]">
                            {booking.internal_notes || <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-5 py-4 no-print">
                            {booking.arrived_at ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                &#10003; Arrived
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {/* Checkbox for print */}
                            <div className="w-5 h-5 border-2 border-gray-400 rounded flex items-center justify-center">
                              {booking.arrived_at && <span className="text-green-500 text-xs">&#10003;</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/[0.02]">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-400" colSpan={2}>
                        Total
                      </td>
                      <td className="px-5 py-3 font-bold">
                        {totalCovers} <span className="text-gray-400 font-normal text-sm">covers</span>
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Waiting list section */}
          {waitingList.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Waiting list</h2>
              <div className="bg-yellow-500/[0.03] border border-yellow-500/20 rounded-2xl overflow-hidden print-waiting">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-500/10 bg-yellow-500/5">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Time requested</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Guest</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Party</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-yellow-400/70 uppercase tracking-wider">Special requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingList.map((entry, i) => (
                      <tr key={entry.id} className={`border-b border-yellow-500/10 last:border-0 ${i % 2 === 0 ? '' : 'bg-yellow-500/[0.02]'}`}>
                        <td className="px-5 py-3">
                          <span className="text-yellow-400 font-mono font-bold">{formatTime(entry.requested_time)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-sm">{entry.customer_name || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs mt-0.5 no-print">+{entry.whatsapp_number}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold">{entry.party_size}</span>
                          <span className="text-gray-400 text-sm ml-1">{entry.party_size === 1 ? 'guest' : 'guests'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 print-badge">
                            {entry.status === 'offered' ? 'Offer sent' : 'Waiting'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-400">
                          {entry.special_requests || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Print footer */}
          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-600">
            <span>{restaurantName} · Day sheet printed from Boeking</span>
            <span>{formatDate(date)}</span>
          </div>

        </div>
      </div>
    </>
  )
}
