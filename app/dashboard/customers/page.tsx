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

interface Conversation {
  id: string
  state: string
  created_at: string
  last_message_at: string
  message_count: number
}

interface Message {
  id: string
  direction: string
  content: string
  sent_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [showNoshowsOnly, setShowNoshowsOnly] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerHistory, setCustomerHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'bookings' | 'conversations'>('bookings')

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

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

  const fetchConversations = async (customerId: string) => {
    setConversationsLoading(true)
    setSelectedConversation(null)
    setMessages([])
    try {
      const res = await fetch(`${base}/dashboard/customers/${customerId}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setConversationsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`${base}/dashboard/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('noshows') === 'true') {
    setShowNoshowsOnly(true)
  }
  const searchParam = params.get('search')
  if (searchParam) {
    setSearch(searchParam)
    fetchCustomers(searchParam)
  } else {
    fetchCustomers()
  }
}, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelectCustomer = (customer: Customer) => {
    const isSelected = selectedCustomer?.id === customer.id
    if (isSelected) {
      setSelectedCustomer(null)
      setActiveTab('bookings')
    } else {
      setActiveTab('bookings')
      fetchCustomerHistory(customer.id)
      fetchConversations(customer.id)
    }
  }

  const handleTabChange = (tab: 'bookings' | 'conversations') => {
    setActiveTab(tab)
    if (tab === 'conversations' && selectedCustomer) {
      fetchConversations(selectedCustomer.id)
    }
  }

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

  const formatDateTime = (dt: string) => {
    return new Date(dt).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    })
  }

  const formatMessageTime = (dt: string) => {
    return new Date(dt).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    })
  }

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

  const getConversationBadge = (state: string) => {
    switch (state) {
      case 'confirmed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Confirmed</span>
      case 'in_progress':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">In progress</span>
      case 'closed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">Closed</span>
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">{state}</span>
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
      <div className={`${selectedCustomer ? 'w-1/3' : 'w-full'} transition-all`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Customers</h1>
            <p className="text-gray-500 text-sm">
              {showNoshowsOnly
                ? `${customers.filter(c => c.no_shows > 0).length} customers with no-shows`
                : `${customers.length} total`
              }
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition">
            &larr; Dashboard
          </Link>
        </div>

        {/* Search and filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowNoshowsOnly(!showNoshowsOnly)}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition border whitespace-nowrap ${
              showNoshowsOnly
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-white/[0.03] text-gray-400 hover:text-white border-white/10'
            }`}
          >
            {showNoshowsOnly ? '&#9888; No-shows only' : 'All customers'}
          </button>
        </div>

        {/* Customer table */}
        {customers.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">&#128101;</div>
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
                  {!selectedCustomer && (
                    <>
                      <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Bookings</th>
                      <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Last visit</th>
                      <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Next booking</th>
                    </>
                  )}
                  <th className="text-left px-5 py-4 text-xs text-gray-500 font-medium uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {customers
                  .filter(customer => showNoshowsOnly ? customer.no_shows > 0 : true)
                  .map((customer, i) => {
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
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-sm">{customer.name || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs mt-0.5">+{customer.whatsapp_number}</div>
                          {risk && <div className={`text-xs mt-0.5 ${risk.color}`}>{risk.label}</div>}
                        </td>
                        {!selectedCustomer && (
                          <>
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-green-400">{customer.total_bookings}</div>
                              {customer.no_shows > 0 && (
                                <div className="text-xs text-yellow-400 mt-0.5">{customer.no_shows} no-show{customer.no_shows > 1 ? 's' : ''}</div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">{formatDate(customer.last_visit)}</td>
                            <td className="px-5 py-4 text-sm">
                              {customer.next_booking ? (
                                <span className="text-green-400">{formatDate(customer.next_booking)}</span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-600 hover:text-gray-400 transition">
                            {isSelected ? '&#8592;' : 'View &rarr;'}
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
        <div className="flex-1 flex gap-4">

          {/* Main detail panel */}
          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-6 self-start sticky top-24">

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{selectedCustomer.name || 'Unknown'}</h2>
                <div className="text-gray-500 text-sm mt-1">+{selectedCustomer.whatsapp_number}</div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-600 hover:text-white transition text-xl leading-none"
              >
                &#215;
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{selectedCustomer.total_bookings}</div>
                <div className="text-xs text-gray-500 mt-1">Bookings</div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{selectedCustomer.no_shows}</div>
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

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleTabChange('bookings')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'bookings' ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                Booking history
              </button>
              <button
                onClick={() => handleTabChange('conversations')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'conversations' ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                Conversations
              </button>
            </div>

            {/* Booking history tab */}
            {activeTab === 'bookings' && (
              historyLoading ? (
                <div className="text-center py-8 text-gray-600 text-sm">Loading...</div>
              ) : customerHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No bookings found</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {customerHistory.map(reservation => (
                    <div key={reservation.id} className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
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
              )
            )}

            {/* Conversations tab */}
            {activeTab === 'conversations' && (
              conversationsLoading ? (
                <div className="text-center py-8 text-gray-600 text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No conversations found</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv)
                        fetchMessages(conv.id)
                      }}
                      className={`bg-white/[0.02] border rounded-xl px-4 py-3 cursor-pointer transition ${
                        selectedConversation?.id === conv.id
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {getConversationBadge(conv.state)}
                        <span className="text-xs text-gray-600">{conv.message_count} messages</span>
                      </div>
                      <div className="text-xs text-gray-500">{formatDateTime(conv.last_message_at)}</div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Conversation thread panel */}
          {activeTab === 'conversations' && selectedConversation && (
            <div className="w-80 bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden flex flex-col self-start sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)' }}>

              {/* Thread header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#111827]">
                <div>
                  <div className="text-sm font-medium">Conversation thread</div>
                  <div className="text-xs text-gray-500">{formatDateTime(selectedConversation.created_at)}</div>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-600 hover:text-white transition"
                >
                  &#215;
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0F14]">
                {messagesLoading ? (
                  <div className="text-center py-8 text-gray-600 text-sm">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 text-sm">No messages</div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] ${msg.direction === 'inbound' ? '' : ''}`}>
                        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                          msg.direction === 'inbound'
                            ? 'bg-white text-black rounded-tl-sm'
                            : 'bg-green-500 text-black rounded-tr-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`text-xs text-gray-600 mt-1 ${msg.direction === 'inbound' ? 'text-left' : 'text-right'}`}>
                          {formatMessageTime(msg.sent_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
