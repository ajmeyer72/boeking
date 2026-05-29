const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// All dashboard routes require authentication
router.use(requireAuth)

// GET /dashboard/today — today's bookings
router.get('/today', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await pool.query(
      `SELECT 
        r.id,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests,
        r.created_at,
        c.name as customer_name,
        c.whatsapp_number
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.restaurant_id = $1
       AND r.reservation_date = CURRENT_DATE
       AND r.status = 'confirmed'
       ORDER BY r.reservation_time ASC`,
      [restaurantId]
    )

    res.json({ reservations: result.rows })
  } catch (error) {
    console.error('Dashboard today error:', error)
    res.status(500).json({ error: 'Failed to fetch todays bookings' })
  }
})

// GET /dashboard/upcoming — next 7 days
router.get('/upcoming', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await pool.query(
      `SELECT 
        r.id,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests,
        r.created_at,
        c.name as customer_name,
        c.whatsapp_number
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.restaurant_id = $1
       AND r.reservation_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND r.status = 'confirmed'
       ORDER BY r.reservation_date ASC, r.reservation_time ASC`,
      [restaurantId]
    )

    res.json({ reservations: result.rows })
  } catch (error) {
    console.error('Dashboard upcoming error:', error)
    res.status(500).json({ error: 'Failed to fetch upcoming bookings' })
  }
})

// GET /dashboard/stats — summary stats
router.get('/stats', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND status = 'confirmed') as today_count,
        COALESCE(SUM(party_size) FILTER (WHERE reservation_date = CURRENT_DATE AND status = 'confirmed'), 0) as today_covers,
        COUNT(*) FILTER (WHERE reservation_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'confirmed') as week_count,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at >= NOW() - INTERVAL '30 days') as cancellations_30d,
        COUNT(*) FILTER (WHERE status = 'no_show' AND reservation_date >= CURRENT_DATE - INTERVAL '30 days') as no_shows_30d
       FROM reservations
       WHERE restaurant_id = $1`,
      [restaurantId]
    )

    res.json({ stats: stats.rows[0] })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// PATCH /dashboard/reservations/:id/cancel — cancel a reservation
router.patch('/reservations/:id/cancel', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('Cancel reservation error:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
})

// PATCH /dashboard/reservations/:id/noshow — mark as no show
router.patch('/reservations/:id/noshow', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'no_show', updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING *`,
      [id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    // Increment no_show counter on customer
    await pool.query(
      `UPDATE customers SET no_shows = no_shows + 1
       WHERE id = (SELECT customer_id FROM reservations WHERE id = $1)`,
      [id]
    )

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('No show error:', error)
    res.status(500).json({ error: 'Failed to mark as no show' })
  }
})

// GET /dashboard/customers — customer list
router.get('/customers', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.whatsapp_number,
        c.email,
        c.total_bookings,
        c.no_shows,
        c.created_at,
        MAX(r.reservation_date) as last_booking
       FROM customers c
       LEFT JOIN reservations r ON r.customer_id = c.id AND r.status = 'confirmed'
       WHERE c.restaurant_id = $1
       GROUP BY c.id
       ORDER BY c.total_bookings DESC`,
      [restaurantId]
    )

    res.json({ customers: result.rows })
  } catch (error) {
    console.error('Customers error:', error)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

module.exports = router