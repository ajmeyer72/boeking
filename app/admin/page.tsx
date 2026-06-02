'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
  slug: string
  whatsapp_number: string
  meta_phone_number_id: string
  is_active: boolean
  created_at: string
  upcoming_bookings: number
  total_customers: number
  total_users: number
}

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetch(`${base}/admin/restaurants`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setRestaurants(data.restaurants || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Restaurants</h1>
          <p className="text-gray-500 text-sm">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} on Boeking</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-3 rounded-xl transition text-sm"
        >
          + Add restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <div className="text-gray-400 font-medium">No restaurants yet</div>
          <div className="text-gray-600 text-sm mt-2">
            Add your first restaurant to get started
          </div>
          <Link
            href="/admin/restaurants/new"
            className="inline-block mt-6 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            Add restaurant
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map(restaurant => (
            <div
              key={restaurant.id}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/[0.05] transition"
            >
              <div className="flex items-center gap-6">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${restaurant.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                <div>
                  <div className="font-semibold text-lg">{restaurant.name}</div>
                  <div className="text-gray-500 text-sm mt-0.5 flex items-center gap-3">
                    <span>+{restaurant.whatsapp_number}</span>
                    <span>·</span>
                    <span>{restaurant.slug}</span>
                    {restaurant.meta_phone_number_id && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-xs">ID: {restaurant.meta_phone_number_id}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{restaurant.upcoming_bookings}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{restaurant.total_customers}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{restaurant.total_users}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Staff</div>
                </div>
                <Link
                  href={`/admin/restaurants/${restaurant.id}`}
                  className="text-sm px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
                >
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}