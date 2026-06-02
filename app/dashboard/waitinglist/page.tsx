'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WaitingListEntry {
  id: string
  requested_date: string
  requested_time: string
  party_size: number
  status: string
  special_requests: string | null
  created_at: string
  offered_at: string | null
  expires_at: string | null
  customer_name: string | null
  whatsapp_number: string
}

export default function WaitingListPage() {
  const [entries, setEntries] = useState<WaitingListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const fetchWaitingList = async () => {
    try {
      const res = await fetch(`${base}/dashboard/waitinglist`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEntries(data.waitingList || [])
    } catch (err) {
      console.error('Failed to fetch waiting list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitingList()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this customer from the waiting list?')) return
    setActionLoading(id)
    try {
      await fetch(`${base}/dashboard/waitinglist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Removed from waiting list')
      fetchWaitingList()
    } catch {
      setError('Failed to remove entry')
    } finally {
      setActionLoading(null)
    }
  }

  const handleNotify = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${base}/dashboard/waitinglist/${id}/notify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Customer notified via WhatsApp')
      fetchWaitingList()
    } catch {
      setError('Failed to notify customer')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirm = async (id: string) => {
    if (!confirm('Convert this waiting list entry to a confirmed booking?')) return
    setActionLoading(id)
    try {
      await fetch(`${base}/dashboard/waitinglist/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Booking confirmed!')
      fetchWaitingList()
    } catch {
      setError('Failed to confirm booking')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string) => {
  const clean = date.toString().split('T')[0]
  return new Date(clean + 'T12:00:00').toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg'
  })
}

  const formatTime = (time: string) => time.slice(0, 5)

  const formatWaitingTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${mins}m ago`
    return `${mins}m ago`
  }

  const getExpiryStatus = (entry: WaitingListEntry) => {
    if (entry.status !== 'offered' || !entry.expires_at) return null
    const diff = new Date(entry.expires_at).getTime() - Date.now()
    if (diff < 0) return { label: 'Expired', color: 'text-red-400' }
    const mins = Math.floor(diff / (1000 * 60))
    if (mins < 15) return { label: `Expires in ${mins}m`, color: 'text-red-400' }
    if (mins < 30) return { label: `Expires in ${mins}m`, color: 'text-yellow-400' }
    return { label: `Expires in ${Math.floor(mins / 60)}h ${mins % 60}m`, color: 'text-gray-400' }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Waiting</span>
      case 'offered':
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Offer sent</span>
      default:
        return null
    }
  }

  // Group entries by date and time
  const grouped: Record<string, WaitingListEntry[]> = {}
  entries.forEach(entry => {
    const key = `${entry.requested_date}|${entry.requested_time}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(entry)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading waiting list...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Waiting List</h1>
          <p className="text-gray-500 text-sm">
            {entries.length === 0
              ? 'No one currently waiting'
              : `${entries.length} customer${entries.length > 1 ? 's' : ''} waiting`
            }
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">
          ← Dashboard
        </Link>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm mb-6">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <div className="text-gray-400 font-medium">No one on the waiting list</div>
          <div className="text-gray-600 text-sm mt-1">
            Customers will appear here when a requested slot is fully booked
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, slotEntries]) => {
            const [date, time] = key.split('|')
            const totalCovers = slotEntries.reduce((sum, e) => sum + e.party_size, 0)

            return (
              <div key={key} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                {/* Slot header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-green-400 font-mono font-medium">
                      {formatTime(time)}
                    </span>
                    <span className="text-white font-medium">
                      {formatDate(date)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {slotEntries.length} {slotEntries.length === 1 ? 'party' : 'parties'} · {totalCovers} covers waiting
                    </span>
                  </div>
                </div>

                {/* Entries for this slot */}
                <div className="divide-y divide-white/5">
                  {slotEntries.map(entry => {
                    const expiry = getExpiryStatus(entry)
                    const isLoading = actionLoading === entry.id

                    return (
                      <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="font-medium text-sm">
                              {entry.customer_name || 'Unknown'}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                              +{entry.whatsapp_number}
                            </div>
                          </div>

                          <div className="text-sm text-gray-400">
                            {entry.party_size} {entry.party_size === 1 ? 'guest' : 'guests'}
                          </div>

                          {entry.special_requests && (
                            <div className="text-sm text-gray-500 max-w-[200px] truncate">
                              {entry.special_requests}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {getStatusBadge(entry.status)}
                            {expiry && (
                              <span className={`text-xs ${expiry.color}`}>
                                {expiry.label}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-600">
                            Added {formatWaitingTime(entry.created_at)}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          {entry.status === 'waiting' && (
                            <button
                              onClick={() => handleNotify(entry.id)}
                              disabled={isLoading}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition disabled:opacity-50"
                            >
                              {isLoading ? '...' : 'Notify'}
                            </button>
                          )}
                          <button
                            onClick={() => handleConfirm(entry.id)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleRemove(entry.id)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}