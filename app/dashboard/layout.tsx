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
  const [plan, setPlan] = useState<string>('growth')

  // Send WhatsApp modal state
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [waName, setWaName] = useState('')
  const [waNumber, setWaNumber] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waSuccess, setWaSuccess] = useState('')
  const [waError, setWaError] = useState('')

  // Walk-in modal state
  const [showWalkin, setShowWalkin] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  const [walkinNumber, setWalkinNumber] = useState('')
  const [walkinParty, setWalkinParty] = useState('')
  const [walkinSending, setWalkinSending] = useState(false)
  const [walkinSuccess, setWalkinSuccess] = useState('')
  const [walkinError, setWalkinError] = useState('')

  // Upgrade modal state
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')

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
          const parsed = JSON.parse(userData)
          setUser(parsed)
          setPlan(parsed.plan || 'growth')
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

  const handleWalkin = async () => {
    if (!walkinParty) return
    setWalkinSending(true)
    setWalkinError('')
    setWalkinSuccess('')

    try {
      const token = localStorage.getItem('boeking_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/walkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: walkinName,
          whatsapp_number: walkinNumber,
          party_size: walkinParty
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setWalkinError(data.error || 'Failed to add walk-in')
        return
      }

      setWalkinSuccess(walkinNumber
        ? 'Walk-in added and welcome message sent!'
        : 'Walk-in added and slot blocked!'
      )
      setWalkinName('')
      setWalkinNumber('')
      setWalkinParty('')
      setTimeout(() => {
        setWalkinSuccess('')
        setShowWalkin(false)
      }, 2500)
    } catch {
      setWalkinError('Something went wrong. Please try again.')
    } finally {
      setWalkinSending(false)
    }
  }

  const requireGrowth = (featureName: string, action: () => void) => {
    if (plan === 'starter') {
      setUpgradeFeature(featureName)
      setShowUpgrade(true)
    } else {
      action()
    }
  }

  const isGrowth = plan === 'growth'

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
            {plan === 'starter' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Starter
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isGrowth && (
              <>
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
              </>
            )}

            {/* Walk-in button — available to all plans */}
            <button
              onClick={() => setShowWalkin(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Walk-in
            </button>
            <span className="text-gray-600">·</span>

            {isGrowth ? (
              <Link href="/dashboard/waitinglist" className="text-sm text-gray-500 hover:text-white transition">
                Waiting list
              </Link>
            ) : (
              <button onClick={() => requireGrowth('Waiting List', () => {})} className="text-sm text-gray-600 hover:text-gray-400 transition flex items-center gap-1">
                Waiting list
                <span className="text-xs">&#128274;</span>
              </button>
            )}
            <span className="text-gray-600">·</span>

            {isGrowth ? (
              <Link href="/dashboard/customers" className="text-sm text-gray-500 hover:text-white transition">
                Customers
              </Link>
            ) : (
              <button onClick={() => requireGrowth('Customer History', () => {})} className="text-sm text-gray-600 hover:text-gray-400 transition flex items-center gap-1">
                Customers
                <span className="text-xs">&#128274;</span>
              </button>
            )}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWhatsApp(false)} />
          <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Send WhatsApp Invitation</h2>
                <p className="text-gray-500 text-sm mt-0.5">Invite a customer to book via WhatsApp</p>
              </div>
              <button onClick={() => setShowWhatsApp(false)} className="text-gray-600 hover:text-white transition text-xl leading-none">x</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Customer name <span className="text-gray-600 font-normal">(optional)</span></label>
                <input type="text" value={waName} onChange={e => setWaName(e.target.value)} placeholder="e.g. Sarah" className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Customer WhatsApp number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={e => {
                    let num = e.target.value.replace(/[\s\-\+]/g, '')
                    if (num.startsWith('0')) num = '27' + num.slice(1)
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

              {waSuccess && <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">{waSuccess}</div>}
              {waError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{waError}</div>}

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
                <button onClick={() => setShowWhatsApp(false)} className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWalkin(false)} />
          <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Add Walk-in</h2>
                <p className="text-gray-500 text-sm mt-0.5">Record a walk-in and block the slot</p>
              </div>
              <button onClick={() => setShowWalkin(false)} className="text-gray-600 hover:text-white transition text-xl leading-none">x</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Party size <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={walkinParty}
                  onChange={e => setWalkinParty(e.target.value)}
                  placeholder="e.g. 4"
                  min={1}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-gray-500 mb-3">Optional — enter customer details to build your database and send a welcome message</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Customer name</label>
                    <input
                      type="text"
                      value={walkinName}
                      onChange={e => setWalkinName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">WhatsApp number</label>
                    <input
                      type="text"
                      value={walkinNumber}
                      onChange={e => {
                        let num = e.target.value.replace(/[\s\-\+]/g, '')
                        if (num.startsWith('0')) num = '27' + num.slice(1)
                        setWalkinNumber(num)
                      }}
                      placeholder="e.g. 27821234567"
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition"
                    />
                    <p className="text-gray-600 text-xs mt-1">If entered, a welcome WhatsApp will be sent automatically</p>
                  </div>
                </div>
              </div>

              {walkinNumber && (
                <div className="bg-blue-500/[0.05] border border-blue-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-400/80 font-medium mb-1">Welcome message that will be sent:</p>
                  <p className="text-xs text-gray-400 italic">
                    "Hi {walkinName || 'there'}! Welcome to {user?.restaurantName}. We're so glad you're here today. We've added you to our guest list — next time you'd like a table, just message us here and our booking assistant will take care of everything instantly!"
                  </p>
                </div>
              )}

              {walkinSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
                  &#10003; {walkinSuccess}
                </div>
              )}

              {walkinError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {walkinError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleWalkin}
                  disabled={walkinSending || !walkinParty}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {walkinSending ? 'Adding...' : 'Add walk-in'}
                </button>
                <button
                  onClick={() => setShowWalkin(false)}
                  className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgrade(false)} />
          <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl mx-auto mb-6">
              &#128274;
            </div>
            <h2 className="text-xl font-bold mb-2">Growth Plan Feature</h2>
            <p className="text-gray-400 text-sm mb-6">
              <strong className="text-white">{upgradeFeature}</strong> is available on the Growth plan. Upgrade to unlock this feature and get access to the full Boeking experience.
            </p>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm font-medium text-gray-300 mb-2">Growth plan includes:</div>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>&#10003; Waiting list management</li>
                <li>&#10003; Customer history and no-show tracking</li>
                <li>&#10003; Configurable reminders</li>
                <li>&#10003; Late arrival notifications</li>
                <li>&#10003; Bot customisation</li>
                <li>&#10003; Send WhatsApp invitations</li>
                <li>&#10003; Unlimited bookings</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:info@boeking.co.za?subject=Upgrade to Growth Plan"
                className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition text-sm"
              >
                Contact us to upgrade
              </a>
              <button onClick={() => setShowUpgrade(false)} className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition text-sm">
                Close
              </button>
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
