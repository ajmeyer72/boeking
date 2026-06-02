const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')
const { requireAuth, requireRole } = require('../middleware/auth')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// All admin routes require super_admin role
router.use(requireAuth)
router.use(requireRole('super_admin'))

// GET /admin/restaurants — all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.*,
        COUNT(DISTINCT res.id) FILTER (WHERE res.status = 'confirmed' AND res.reservation_date >= CURRENT_DATE) as upcoming_bookings,
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT u.id) as total_users
       FROM restaurants r
       LEFT JOIN reservations res ON res.restaurant_id = r.id
       LEFT JOIN customers c ON c.restaurant_id = r.id
       LEFT JOIN users u ON u.restaurant_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    )
    res.json({ restaurants: result.rows })
  } catch (error) {
    console.error('Admin restaurants error:', error)
    res.status(500).json({ error: 'Failed to fetch restaurants' })
  }
})

// POST /admin/restaurants — create new restaurant
router.post('/restaurants', async (req, res) => {
  try {
    const {
      name,
      slug,
      whatsapp_number,
      meta_phone_number_id,
      timezone,
      // Settings
      slot_duration_mins,
      max_covers_per_slot,
      max_party_size,
      min_notice_hours,
      booking_window_days,
      // Bot
      restaurant_display_name,
      greeting_message,
      bot_tone,
      // Operating hours
      hours,
      // Owner login
      owner_name,
      owner_email,
      owner_password
    } = req.body

    // Check slug is unique
    const existing = await pool.query(
      `SELECT id FROM restaurants WHERE slug = $1`,
      [slug]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A restaurant with this slug already exists' })
    }

    // Create restaurant
    const restaurant = await pool.query(
      `INSERT INTO restaurants (name, slug, whatsapp_number, meta_phone_number_id, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, whatsapp_number, meta_phone_number_id, timezone || 'Africa/Johannesburg']
    )

    const restaurantId = restaurant.rows[0].id

    // Create settings
    await pool.query(
      `INSERT INTO restaurant_settings 
       (restaurant_id, slot_duration_mins, max_covers_per_slot, max_party_size, 
        min_notice_hours, booking_window_days, restaurant_display_name, greeting_message, bot_tone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        restaurantId,
        slot_duration_mins || 90,
        max_covers_per_slot || 20,
        max_party_size || 12,
        min_notice_hours || 2,
        booking_window_days || 30,
        restaurant_display_name || name,
        greeting_message || '',
        bot_tone || 'friendly'
      ]
    )

    // Create operating hours if provided
    if (hours && hours.length > 0) {
      for (const hour of hours) {
        await pool.query(
          `INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
           VALUES ($1, $2, $3, $4, $5)`,
          [restaurantId, hour.day_of_week, hour.open_time, hour.close_time, hour.is_closed]
        )
      }
    } else {
      // Default hours — open Tue-Sun 11:00-22:00, closed Monday
      const defaultHours = [
        { day: 0, closed: false }, // Sunday
        { day: 1, closed: true },  // Monday
        { day: 2, closed: false }, // Tuesday
        { day: 3, closed: false }, // Wednesday
        { day: 4, closed: false }, // Thursday
        { day: 5, closed: false }, // Friday
        { day: 6, closed: false }, // Saturday
      ]
      for (const h of defaultHours) {
        await pool.query(
          `INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
           VALUES ($1, $2, '11:00', '22:00', $3)`,
          [restaurantId, h.day, h.closed]
        )
      }
    }

    // Create owner login
    if (owner_email && owner_password) {
      const hash = bcrypt.hashSync(owner_password, 12)
      await pool.query(
        `INSERT INTO users (restaurant_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, 'owner')`,
        [restaurantId, owner_email.toLowerCase().trim(), hash, owner_name || '']
      )
    }

    res.json({ success: true, restaurant: restaurant.rows[0] })
  } catch (error) {
    console.error('Create restaurant error:', error)
    res.status(500).json({ error: 'Failed to create restaurant' })
  }
})

// GET /admin/restaurants/:id — single restaurant details
router.get('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [restaurant, settings, hours, users] = await Promise.all([
      pool.query(`SELECT * FROM restaurants WHERE id = $1`, [id]),
      pool.query(`SELECT * FROM restaurant_settings WHERE restaurant_id = $1`, [id]),
      pool.query(`SELECT * FROM operating_hours WHERE restaurant_id = $1 ORDER BY day_of_week`, [id]),
      pool.query(`SELECT id, name, email, role, is_active, last_login FROM users WHERE restaurant_id = $1`, [id])
    ])

    if (restaurant.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    res.json({
      restaurant: restaurant.rows[0],
      settings: settings.rows[0],
      hours: hours.rows,
      users: users.rows
    })
  } catch (error) {
    console.error('Get restaurant error:', error)
    res.status(500).json({ error: 'Failed to fetch restaurant' })
  }
})

// PUT /admin/restaurants/:id — update restaurant
router.put('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      whatsapp_number,
      meta_phone_number_id,
      is_active,
      slot_duration_mins,
      max_covers_per_slot,
      max_party_size,
      min_notice_hours,
      booking_window_days,
      restaurant_display_name,
      greeting_message,
      bot_tone
    } = req.body

    await pool.query(
      `UPDATE restaurants SET name = $1, whatsapp_number = $2, meta_phone_number_id = $3, is_active = $4
       WHERE id = $5`,
      [name, whatsapp_number, meta_phone_number_id, is_active, id]
    )

    await pool.query(
      `UPDATE restaurant_settings SET
        slot_duration_mins = $1,
        max_covers_per_slot = $2,
        max_party_size = $3,
        min_notice_hours = $4,
        booking_window_days = $5,
        restaurant_display_name = $6,
        greeting_message = $7,
        bot_tone = $8
       WHERE restaurant_id = $9`,
      [
        slot_duration_mins,
        max_covers_per_slot,
        max_party_size,
        min_notice_hours,
        booking_window_days,
        restaurant_display_name,
        greeting_message,
        bot_tone,
        id
      ]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Update restaurant error:', error)
    res.status(500).json({ error: 'Failed to update restaurant' })
  }
})

// POST /admin/restaurants/:id/users — add staff login
router.post('/restaurants/:id/users', async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, role } = req.body

    const hash = bcrypt.hashSync(password, 12)

    await pool.query(
      `INSERT INTO users (restaurant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, email.toLowerCase().trim(), hash, name, role || 'staff']
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Add user error:', error)
    res.status(500).json({ error: 'Failed to add user' })
  }
})

// DELETE /admin/restaurants/:id/users/:userId — remove user
router.delete('/restaurants/:id/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId])
    res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

module.exports = router