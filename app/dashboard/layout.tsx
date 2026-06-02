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
            <Link
              href="/dashboard/waitinglist"
              className="text-sm text-gray-500 hover:text-white transition"
            >
              Waiting list
            </Link>
            <span className="text-gray-600">·</span>
            <Link
              href="/dashboard/customers"
              className="text-sm text-gray-500 hover:text-white transition"
            >
              Customers
            </Link>
            <span className="text-gray-600">·</span>
            <Link
              href="/dashboard/settings"
              className="text-sm text-gray-500 hover:text-white transition"
            >
              Settings
            </Link>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}