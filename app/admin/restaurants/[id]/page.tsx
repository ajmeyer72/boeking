'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ManageRestaurantPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff' })

  const token = typeof window !== 'undefined' ? localStorage.getItem('boeking_token') : null
  const base = process.env.NEXT_PUBLIC_API_URL

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`${base}/admin/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      setData(result)
    } catch {
      setError('Failed to load restaurant')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurant()
  }, [id])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${base}/admin/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.restaurant.name,
          whatsapp_number: data.restaurant.whatsapp_number,
          meta_phone_number_id: data.restaurant.meta_phone_number_id,
          is_active: data.restaurant.is_active,
          ...data.settings
        })
      })
      if (!res.ok) throw new Error()
      showSuccess('Restaurant updated successfully')
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async () => {
    try {
      const res = await fetch(`${base}/admin/restaurants/${id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })
      if (!res.ok) throw new Error()
      setNewUser({ name: '', email: '', password: '', role: 'staff' })
      setAddingUser(false)
      fetchRestaurant()
      showSuccess('User added successfully')
    } catch {
      setError('Failed to add user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Remove this user?')) return
    try {
      await fetch(`${base}/admin/restaurants/${id}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchRestaurant()
      showSuccess('User removed')
    } catch {
      setError('Failed to remove user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/admin" className="text-gray-500 hover:text-white transition text-sm">
          ← Back to restaurants
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{data.restaurant.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{data.restaurant.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full border ${
            data.restaurant.is_active
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {data.restaurant.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

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

      <div className="space-y-6">

        {/* Restaurant details */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Restaurant details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                value={data.restaurant.name}
                onChange={e => setData({ ...data, restaurant: { ...data.restaurant, name: e.target.value } })}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">WhatsApp number</label>
                <input
                  type="text"
                  value={data.restaurant.whatsapp_number}
                  onChange={e => setData({ ...data, restaurant: { ...data.restaurant, whatsapp_number: e.target.value } })}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meta Phone Number ID</label>
                <input
                  type="text"
                  value={data.restaurant.meta_phone_number_id || ''}
                  onChange={e => setData({ ...data, restaurant: { ...data.restaurant, meta_phone_number_id: e.target.value } })}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.restaurant.is_active}
                  onChange={e => setData({ ...data, restaurant: { ...data.restaurant, is_active: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
              </label>
              <span className="text-sm text-gray-400">Restaurant is active</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        {data.settings && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Booking configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'max_covers_per_slot', label: 'Max covers per slot' },
                { key: 'max_party_size', label: 'Max party size' },
                { key: 'min_notice_hours', label: 'Min notice (hours)' },
                { key: 'booking_window_days', label: 'Booking window (days)' },
                { key: 'slot_duration_mins', label: 'Slot duration (mins)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-2">{label}</label>
                  <input
                    type="number"
                    value={data.settings[key] || ''}
                    onChange={e => setData({ ...data, settings: { ...data.settings, [key]: parseInt(e.target.value) } })}
                    className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff users */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Staff logins</h2>
            <button
              onClick={() => setAddingUser(!addingUser)}
              className="text-sm px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition"
            >
              + Add user
            </button>
          </div>

          {addingUser && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none"
                />
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ backgroundColor: '#0B0F14', color: 'white' }}
                  className="border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="staff" style={{ backgroundColor: '#0B0F14' }}>Staff</option>
                  <option value="owner" style={{ backgroundColor: '#0B0F14' }}>Owner</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddUser}
                  className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition"
                >
                  Add user
                </button>
                <button
                  onClick={() => setAddingUser(false)}
                  className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {data.users?.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No staff logins yet</div>
          ) : (
            <div className="space-y-2">
              {data.users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{user.name || 'Unnamed'}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{user.email}</span>
                      <span>·</span>
                      <span className="capitalize">{user.role}</span>
                      {user.last_login && (
                        <>
                          <span>·</span>
                          <span>Last login: {new Date(user.last_login).toLocaleDateString('en-ZA')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-4 rounded-2xl transition"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

      </div>
    </div>
  )
}