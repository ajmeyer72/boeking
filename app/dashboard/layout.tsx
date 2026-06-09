'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Send WhatsApp modal state
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [waName, setWaName] = useState('')
  const [waNumber, setWaNumber] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waSuccess, setWaSuccess] = useState('')
  const [waError, setWaError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('boeking_token')
    const userData = localStorage.getItem('boeking_user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.valid) {
          localStorage.removeItem('boeking_token')
          localStorage.removeItem('boeking_user')
          router.push('/login')
        } else {
          setUser(JSON.parse(userData))
          setChecking(false)
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('boeking_token')
    localStorage.removeItem('boeking_user')
    router.push('/login')
  }

  const handleSendWhatsApp = async () => {
    if (!waNumber) return
    setWaSending(true)
    setWaError('')
    setWaSuccess('')

    try {
      const token = localStorage.getItem('boeking_token')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsapp_number: waNumber,
          customer_name: waName,
          use_template: true
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setWaError(data.error || 'Failed to send message')
        return
      }

      setWaSuccess('Message sent successfully!')
      setWaNumber('')
      setWaName('')
      setTimeout(() => {
        setWaSuccess('')
        setShowWhatsApp(false)
      }, 2000)
    } catch {
      setWaError('Something went wrong. Please try again.')
    } finally {
      setWaSending(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F14]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold">
              b
            </div>
            <Link href="/dashboard" className="font-semibold hover:text-green-400 transition">
              boeking
            </Link>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">{user?.restaurantName}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowWhatsApp(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send WhatsApp
            </button>
            <span className="text-gray-600">·</span>
            <Link href="/dashboard/waitinglist" className="text-sm text-gray-500 hover:text-white transition">
              Waiting list
            </Link>
            <span className="text-gray-600">·</span>
            <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:text-white transition">
              Customers
            </Link>
            <span className="text-gray-600">·</span>
            <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-white transition">
              Settings
            </Link>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-white transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Send WhatsApp Modal */}
      {showWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWhatsApp(false)}
          />
          <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Send WhatsApp Invitation</h2>
                <p className="text-gray-500 text-sm mt-0.5">Invite a customer to book via WhatsApp</p>
              </div>
              <button
                onClick={() => setShowWhatsApp(false)}
                className="text-gray-600 hover:text-white transition text-xl leading-none"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Customer name <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={waName}
                  onChange={e => setWaName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Customer WhatsApp number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={e => {
  let num = e.target.value.replace(/[\s\-\+]/g, '')
  if (num.startsWith('0')) {
    num = '27' + num.slice(1)
  }
  setWaNumber(num)
}}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition"
                />
                <p className="text-gray-600 text-xs mt-1">Include country code without + e.g. 27821234567</p>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">Message that will be sent:</p>
                <p className="text-xs text-gray-400 italic">
                  "Hi {waName || 'there'}! This is {user?.restaurantName || 'the restaurant'}. We received your call about a table reservation. Reply to this message and our booking assistant will help you complete your reservation instantly!"
                </p>
              </div>

              {waSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
                  {waSuccess}
                </div>
              )}

              {waError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {waError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendWhatsApp}
                  disabled={waSending || !waNumber}
                  className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {waSending ? 'Sending...' : 'Send invitation'}
                </button>
                <button
                  onClick={() => setShowWhatsApp(false)}
                  className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
