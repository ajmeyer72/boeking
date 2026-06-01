'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string | null
  whatsapp_number: string
  email: string | null
  total_bookings: number
  no_shows: number
  created_at: string
  last_visit: string | null
  next_booking: string | null
  upcoming_bookings: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerHistory, setCustomerHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const fetchCustomers = async (searchTerm = '') => {
    setSearching(true)
    try {
      const url = searchTerm
        ? `${base}/dashboard/customers?search=${encodeURIComponent(searchTerm)}`
        : `${base}/dashboard/customers`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const fetchCustomerHistory = async (id: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${base}/dashboard/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSelectedCustomer(data.customer)
      setCustomerHistory(data.reservations || [])
    } catch (err) {
      console.error('Failed to fetch customer history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg'
    })
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Confirmed</span>
      case 'cancelled':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>
      case 'no_show':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">No show</span>
      case 'completed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">Completed</span>
      default:
        return null
    }
  }

  const getNoShowRisk = (customer: Customer) => {
    if (customer.total_bookings === 0) return null
    const rate = customer.no_shows / customer.total_bookings
    if (rate >= 0.5) return { label: 'High risk', color: 'text-red-400' }
    if (rate >= 0.25) return { label: 'Medium risk', color: 'text-yellow-400' }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading customers...</div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">

      {/* Customer list */}
      <div className={`${selectedCustomer ? 'w-1/2' : 'w-full'} transition-all`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Customers</h1>
            <p className="text-gray-500 text-sm">{customers.length} total</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">
            ← Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone number..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition pr-10"
          />
          {searching && (
            <div className="absolute right-4 top-3.5 text-gray-600 text-sm">...</div>
          )}
        </div>

        {/* Customer table */}
        {customers.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">👥</div>
            <div className="text-gray-400 font-medium">No customers yet</div>
            <div className="text-gray-600 text-sm mt-1">
              Customers will appear here once they make a booking
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Bookings</th>
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Last visit</th>
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Next booking</th>
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => {
                  const risk = getNoShowRisk(customer)
                  const isSelected = selectedCustomer?.id === customer.id

                  return (
                    <tr
                      key={customer.id}
                      className={`border-b border-white/5 last:border-0 transition cursor-pointer ${
                        isSelected
                          ? 'bg-green-500/5 border-l-2 border-l-green-500'
                          : 'hover:bg-white/[0.02]'
                      } ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCustomer(null)
                        } else {
                          fetchCustomerHistory(customer.id)
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-sm">
                          {customer.name || 'Unknown'}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          +{customer.whatsapp_number}
                        </div>
                        {risk && (
                          <div className={`text-xs mt-0.5 ${risk.color}`}>
                            {risk.label}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-green-400">
                          {customer.total_bookings}
                        </div>
                        {customer.no_shows > 0 && (
                          <div className="text-xs text-yellow-400 mt-0.5">
                            {customer.no_shows} no-show{customer.no_shows > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatDate(customer.last_visit)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {customer.next_booking ? (
                          <span className="text-green-400">
                            {formatDate(customer.next_booking)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-600 hover:text-gray-400 transition">
                          View →
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer detail panel */}
      {selectedCustomer && (
        <div className="w-1/2 bg-white/[0.03] border border-white/5 rounded-2xl p-6 self-start sticky top-24">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                {selectedCustomer.name || 'Unknown'}
              </h2>
              <div className="text-gray-500 text-sm mt-1">
                +{selectedCustomer.whatsapp_number}
              </div>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-gray-600 hover:text-white transition text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {selectedCustomer.total_bookings}
              </div>
              <div className="text-xs text-gray-500 mt-1">Bookings</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {selectedCustomer.no_shows}
              </div>
              <div className="text-xs text-gray-500 mt-1">No-shows</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {selectedCustomer.total_bookings > 0
                  ? Math.round((1 - selectedCustomer.no_shows / selectedCustomer.total_bookings) * 100)
                  : 100}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Show rate</div>
            </div>
          </div>

          {/* Booking history */}
          <h3 className="text-sm font-medium text-gray-400 mb-3">Booking history</h3>

          {historyLoading ? (
            <div className="text-center py-8 text-gray-600 text-sm">Loading...</div>
          ) : customerHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No bookings found</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {customerHistory.map(reservation => (
  <div
    key={reservation.id}
    className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between"
  >
    <div>
      <div className="text-sm font-medium">
        {formatDate(reservation.reservation_date)} · {formatTime(reservation.reservation_time)}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
        {reservation.special_requests && ` · ${reservation.special_requests}`}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {getStatusBadge(reservation.status)}
      {reservation.status === 'confirmed' && (
        <Link
          href={`/dashboard/bookings/${reservation.id}/edit`}
          className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition"
        >
          Edit
        </Link>
      )}
    </div>
  </div>
))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}