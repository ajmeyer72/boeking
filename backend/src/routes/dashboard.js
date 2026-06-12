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

// GET /dashboard/today
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
        r.internal_notes,
        r.arrived_at,
        r.late_notification_sent_at,
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

    // Notify waiting list
    const { notifyWaitingList } = require('../services/waitingListService')
    const cancelled = result.rows[0]
    await notifyWaitingList(
      restaurantId,
      cancelled.reservation_date,
      cancelled.reservation_time,
      cancelled.party_size
    )

    res.json({ reservation: cancelled })
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

// GET /dashboard/customers — customer list with full stats
router.get('/customers', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { search } = req.query

    let query = `
      SELECT 
        c.id,
        c.name,
        c.whatsapp_number,
        c.email,
        c.total_bookings,
        c.no_shows,
        c.created_at,
        COUNT(r.id) FILTER (WHERE r.status = 'confirmed') as upcoming_bookings,
        MAX(r.reservation_date) FILTER (WHERE r.status = 'completed' OR r.reservation_date < CURRENT_DATE) as last_visit,
        MIN(r.reservation_date) FILTER (WHERE r.status = 'confirmed' AND r.reservation_date >= CURRENT_DATE) as next_booking
       FROM customers c
       LEFT JOIN reservations r ON r.customer_id = c.id
       WHERE c.restaurant_id = $1`

    const params = [restaurantId]

    if (search) {
      query += ` AND (c.name ILIKE $2 OR c.whatsapp_number ILIKE $2)`
      params.push(`%${search}%`)
    }

    query += ` GROUP BY c.id ORDER BY c.total_bookings DESC, c.created_at DESC`

    const result = await pool.query(query, params)
    res.json({ customers: result.rows })
  } catch (error) {
    console.error('Customers error:', error)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// GET /dashboard/customers/:id — single customer with booking history
router.get('/customers/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const customer = await pool.query(
      `SELECT * FROM customers WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    )

    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const reservations = await pool.query(
      `SELECT * FROM reservations 
       WHERE customer_id = $1
       ORDER BY reservation_date DESC, reservation_time DESC`,
      [id]
    )

    res.json({
      customer: customer.rows[0],
      reservations: reservations.rows
    })
  } catch (error) {
    console.error('Customer detail error:', error)
    res.status(500).json({ error: 'Failed to fetch customer' })
  }
})

// GET /dashboard/availability — check slot availability
router.get('/availability', async (req, res) => {
  try {
    const { date, time, party } = req.query
    const restaurantId = req.user.restaurantId

    if (!date || !time || !party) {
      return res.status(400).json({ error: 'Date, time and party size are required' })
    }

    const { checkAvailability, checkOperatingHours, checkBlockedDate } = require('../services/availabilityService')

    const blockedCheck = await checkBlockedDate(restaurantId, date)
    if (blockedCheck.blocked) {
      return res.json({ available: false, reason: blockedCheck.message })
    }

    const hoursCheck = await checkOperatingHours(restaurantId, date, time)
    if (!hoursCheck.open) {
      return res.json({ available: false, reason: hoursCheck.message })
    }

    const availability = await checkAvailability(restaurantId, date, time, parseInt(party))
    if (!availability.available) {
      return res.json({
        available: false,
        reason: availability.message,
        alternatives: availability.alternatives || []
      })
    }

    res.json({ available: true })
  } catch (error) {
    console.error('Availability check error:', error)
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

// POST /dashboard/bookings — create manual booking
// In backend/src/routes/dashboard.js
// Find the existing POST /dashboard/bookings route and replace it with this:

router.post('/bookings', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const {
      customer_name,
      whatsapp_number,
      reservation_date,
      reservation_time,
      party_size,
      special_requests
    } = req.body

    if (!whatsapp_number || !reservation_date || !reservation_time || !party_size) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Clean the number
    let cleanNumber = whatsapp_number.replace(/[\s\-\+]/g, '')
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '27' + cleanNumber.slice(1)
    }

    // Find or create customer
    let customer = await pool.query(
      `SELECT * FROM customers WHERE whatsapp_number = $1 AND restaurant_id = $2`,
      [cleanNumber, restaurantId]
    )

    if (customer.rows.length === 0) {
      customer = await pool.query(
        `INSERT INTO customers (restaurant_id, whatsapp_number, name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [restaurantId, cleanNumber, customer_name || null]
      )
    } else if (customer_name && !customer.rows[0].name) {
      await pool.query(
        `UPDATE customers SET name = $1 WHERE id = $2`,
        [customer_name, customer.rows[0].id]
      )
    }

    const customerId = customer.rows[0].id

    // Create reservation
    const reservation = await pool.query(
      `INSERT INTO reservations
       (restaurant_id, customer_id, reservation_date, reservation_time, party_size, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
       RETURNING *`,
      [restaurantId, customerId, reservation_date, reservation_time, parseInt(party_size), special_requests || null]
    )

    // Update customer total bookings
    await pool.query(
      `UPDATE customers SET total_bookings = total_bookings + 1 WHERE id = $1`,
      [customerId]
    )

    // Get restaurant details for the confirmation message
    const restaurant = await pool.query(
      `SELECT r.meta_phone_number_id, rs.restaurant_display_name, r.name
       FROM restaurants r
       JOIN restaurant_settings rs ON rs.restaurant_id = r.id
       WHERE r.id = $1`,
      [restaurantId]
    )

    const { meta_phone_number_id, restaurant_display_name, name: restaurantName } = restaurant.rows[0]
    const displayName = restaurant_display_name || restaurantName

    // Format date for confirmation message
    const formattedDate = new Date(reservation_date).toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Africa/Johannesburg'
    })

    const formattedTime = reservation_time.slice(0, 5)
    const customerDisplayName = customer_name || 'there'

    // Send booking confirmation template
    const { sendTemplate } = require('../services/metaService')
    await sendTemplate(
      cleanNumber,
      'booking_confirmation',
      [
        customerDisplayName,
        displayName,
        formattedDate,
        formattedTime,
        party_size.toString()
      ],
      meta_phone_number_id
    )

    console.log(`Booking confirmation sent to ${cleanNumber}`)

    // Send booking notification to restaurant if enabled
    const { sendBookingNotification } = require('../services/messageHandler')
    await sendBookingNotification(
      restaurantId,
      {
        date: reservation_date,
        time: formattedTime,
        party: party_size.toString(),
        requests: special_requests || 'none'
      },
      customer_name,
      meta_phone_number_id
    )

    res.json({ reservation: reservation.rows[0] })
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// GET /dashboard/calendar?month=2026-06 — bookings for a full month
router.get('/calendar', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { month } = req.query

    // Default to current month if not provided
    const monthDate = month ? new Date(`${month}-01`) : new Date()
    const year = monthDate.getFullYear()
    const monthNum = monthDate.getMonth() + 1

    const result = await pool.query(
      `SELECT 
        r.id,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests,
        c.name as customer_name,
        c.whatsapp_number
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.restaurant_id = $1
       AND EXTRACT(YEAR FROM r.reservation_date) = $2
       AND EXTRACT(MONTH FROM r.reservation_date) = $3
       AND r.status = 'confirmed'
       ORDER BY r.reservation_date ASC, r.reservation_time ASC`,
      [restaurantId, year, monthNum]
    )

    // Group by date
    const grouped = {}
    result.rows.forEach(row => {
      const date = row.reservation_date.toISOString().split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(row)
    })

    res.json({ bookings: grouped })
  } catch (error) {
    console.error('Calendar error:', error)
    res.status(500).json({ error: 'Failed to fetch calendar data' })
  }
})
// GET /dashboard/settings — get all restaurant settings
router.get('/settings', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const [restaurant, settings, hours, blocked] = await Promise.all([
      pool.query(
        `SELECT * FROM restaurants WHERE id = $1`,
        [restaurantId]
      ),
      pool.query(
        `SELECT * FROM restaurant_settings WHERE restaurant_id = $1`,
        [restaurantId]
      ),
      pool.query(
        `SELECT * FROM operating_hours WHERE restaurant_id = $1 ORDER BY day_of_week ASC`,
        [restaurantId]
      ),
      pool.query(
        `SELECT * FROM blocked_dates WHERE restaurant_id = $1 AND blocked_date >= CURRENT_DATE ORDER BY blocked_date ASC`,
        [restaurantId]
      )
    ])

    res.json({
      restaurant: restaurant.rows[0],
      settings: settings.rows[0],
      hours: hours.rows,
      blocked: blocked.rows
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /dashboard/settings/hours — update operating hours
router.put('/settings/hours', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { hours } = req.body

    // Delete existing hours and reinsert
    await pool.query(
      `DELETE FROM operating_hours WHERE restaurant_id = $1`,
      [restaurantId]
    )

    for (const hour of hours) {
      await pool.query(
        `INSERT INTO operating_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
         VALUES ($1, $2, $3, $4, $5)`,
        [restaurantId, hour.day_of_week, hour.open_time, hour.close_time, hour.is_closed]
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Hours update error:', error)
    res.status(500).json({ error: 'Failed to update operating hours' })
  }
})

// PUT /dashboard/settings/config — update booking config
// Replace the existing PUT /dashboard/settings/config route in backend/src/routes/dashboard.js with this:

router.put('/settings/config', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const {
      slot_duration_mins,
      max_covers_per_slot,
      max_party_size,
      min_notice_hours,
      booking_window_days,
      greeting_message,
      restaurant_display_name,
      bot_tone,
      reminder_1_hours,
      reminder_2_hours,
      reminder_2_enabled,
      late_grace_mins,
      late_hold_mins,
      auto_noshow_mins,
      late_notifications_enabled,
      booking_notifications_enabled,
      notification_number
    } = req.body

    await pool.query(
      `UPDATE restaurant_settings SET
        slot_duration_mins = $1,
        max_covers_per_slot = $2,
        max_party_size = $3,
        min_notice_hours = $4,
        booking_window_days = $5,
        greeting_message = $6,
        restaurant_display_name = $7,
        bot_tone = $8,
        reminder_1_hours = $9,
        reminder_2_hours = $10,
        reminder_2_enabled = $11,
        late_grace_mins = $12,
        late_hold_mins = $13,
        auto_noshow_mins = $14,
        late_notifications_enabled = $15,
        booking_notifications_enabled = $16,
        notification_number = $17
       WHERE restaurant_id = $18`,
      [
        slot_duration_mins,
        max_covers_per_slot,
        max_party_size,
        min_notice_hours,
        booking_window_days,
        greeting_message,
        restaurant_display_name,
        bot_tone,
        reminder_1_hours || 24,
        reminder_2_hours || 2,
        reminder_2_enabled !== undefined ? reminder_2_enabled : true,
        late_grace_mins || 15,
        late_hold_mins || 30,
        auto_noshow_mins || 45,
        late_notifications_enabled !== undefined ? late_notifications_enabled : true,
        booking_notifications_enabled || false,
        notification_number || null,
        restaurantId
      ]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Config update error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})




// POST /dashboard/settings/blocked — add a blocked date
router.post('/settings/blocked', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { date, reason } = req.body

    await pool.query(
      `INSERT INTO blocked_dates (restaurant_id, blocked_date, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [restaurantId, date, reason || null]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Blocked date error:', error)
    res.status(500).json({ error: 'Failed to add blocked date' })
  }
})

// DELETE /dashboard/settings/blocked/:date — remove a blocked date
router.delete('/settings/blocked/:date', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { date } = req.params

    await pool.query(
      `DELETE FROM blocked_dates WHERE restaurant_id = $1 AND blocked_date = $2`,
      [restaurantId, date]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete blocked date error:', error)
    res.status(500).json({ error: 'Failed to remove blocked date' })
  }
})
// GET /dashboard/reservations/:id — get single reservation
router.get('/reservations/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const result = await pool.query(
      `SELECT r.*, c.name as customer_name, c.whatsapp_number
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.id = $1 AND r.restaurant_id = $2`,
      [id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('Get reservation error:', error)
    res.status(500).json({ error: 'Failed to fetch reservation' })
  }
})

// PUT /dashboard/reservations/:id — update reservation
router.put('/reservations/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params
    const {
      reservation_date,
      reservation_time,
      party_size,
      special_requests,
      internal_notes
    } = req.body

    const result = await pool.query(
      `UPDATE reservations
       SET reservation_date = $1,
           reservation_time = $2,
           party_size = $3,
           special_requests = $4,
           internal_notes = $5,
           updated_at = NOW()
       WHERE id = $6 AND restaurant_id = $7
       RETURNING *`,
      [
        reservation_date,
        reservation_time,
        parseInt(party_size),
        special_requests || null,
        internal_notes || null,
        id,
        restaurantId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('Update reservation error:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})
// GET /dashboard/waitinglist — all active waiting list entries
router.get('/waitinglist', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await pool.query(
      `SELECT 
        w.id,
        w.requested_date,
        w.requested_time,
        w.party_size,
        w.status,
        w.special_requests,
        w.created_at,
        w.offered_at,
        w.expires_at,
        c.name as customer_name,
        c.whatsapp_number
       FROM waiting_list w
       JOIN customers c ON c.id = w.customer_id
       WHERE w.restaurant_id = $1
       AND w.status IN ('waiting', 'offered')
       AND w.requested_date >= CURRENT_DATE
       ORDER BY w.requested_date ASC, w.requested_time ASC, w.created_at ASC`,
      [restaurantId]
    )

    res.json({ waitingList: result.rows })
  } catch (error) {
    console.error('Waiting list error:', error)
    res.status(500).json({ error: 'Failed to fetch waiting list' })
  }
})

// DELETE /dashboard/waitinglist/:id — remove from waiting list
router.delete('/waitinglist/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    await pool.query(
      `UPDATE waiting_list SET status = 'declined'
       WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Remove waiting list error:', error)
    res.status(500).json({ error: 'Failed to remove from waiting list' })
  }
})

// POST /dashboard/waitinglist/:id/notify — manually notify waiting list customer
router.post('/waitinglist/:id/notify', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const entry = await pool.query(
      `SELECT w.*, c.whatsapp_number, c.name as customer_name
       FROM waiting_list w
       JOIN customers c ON c.id = w.customer_id
       WHERE w.id = $1 AND w.restaurant_id = $2`,
      [id, restaurantId]
    )

    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    const { notifyWaitingList } = require('../services/waitingListService')
    await notifyWaitingList(
      restaurantId,
      entry.rows[0].requested_date,
      entry.rows[0].requested_time,
      entry.rows[0].party_size
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Notify waiting list error:', error)
    res.status(500).json({ error: 'Failed to notify customer' })
  }
})

// POST /dashboard/waitinglist/:id/confirm — convert waiting list to booking
router.post('/waitinglist/:id/confirm', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const entry = await pool.query(
      `SELECT w.*, c.whatsapp_number
       FROM waiting_list w
       JOIN customers c ON c.id = w.customer_id
       WHERE w.id = $1 AND w.restaurant_id = $2`,
      [id, restaurantId]
    )

    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    const w = entry.rows[0]

    // Create reservation
    await pool.query(
      `INSERT INTO reservations
       (restaurant_id, customer_id, reservation_date, reservation_time, party_size, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')`,
      [restaurantId, w.customer_id, w.requested_date, w.requested_time, w.party_size, w.special_requests]
    )

    // Update waiting list status
    await pool.query(
      `UPDATE waiting_list SET status = 'confirmed' WHERE id = $1`,
      [id]
    )

    // Update customer total bookings
    await pool.query(
      `UPDATE customers SET total_bookings = total_bookings + 1 WHERE id = $1`,
      [w.customer_id]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Confirm waiting list error:', error)
    res.status(500).json({ error: 'Failed to confirm booking' })
  }
})
// GET /dashboard/dayview?date=2026-06-04 — bookings and waiting list for a specific day
router.get('/dayview', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date is required' })
    }

    const [reservations, waitingList] = await Promise.all([
      pool.query(
        `SELECT 
          r.id,
          r.reservation_date,
          r.arrived_at,
          r.late_notification_sent_at,
          r.reservation_time,
          r.party_size,
          r.status,
          r.special_requests,
          r.internal_notes,
          c.name as customer_name,
          c.whatsapp_number
         FROM reservations r
         JOIN customers c ON c.id = r.customer_id
         WHERE r.restaurant_id = $1
         AND r.reservation_date = $2
         AND r.status = 'confirmed'
         ORDER BY r.reservation_time ASC`,
        [restaurantId, date]
      ),
      pool.query(
        `SELECT 
          w.id,
          w.requested_date,
          w.requested_time,
          w.party_size,
          w.status,
          w.special_requests,
          w.created_at,
          w.offered_at,
          w.expires_at,
          c.name as customer_name,
          c.whatsapp_number
         FROM waiting_list w
         JOIN customers c ON c.id = w.customer_id
         WHERE w.restaurant_id = $1
         AND w.requested_date = $2
         AND w.status IN ('waiting', 'offered')
         ORDER BY w.requested_time ASC, w.created_at ASC`,
        [restaurantId, date]
      )
    ])

    res.json({
      reservations: reservations.rows,
      waitingList: waitingList.rows
    })
  } catch (error) {
    console.error('Day view error:', error)
    res.status(500).json({ error: 'Failed to fetch day view' })
  }
})
// PATCH /dashboard/reservations/:id/arrived — mark customer as arrived
router.patch('/reservations/:id/arrived', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const result = await pool.query(
      `UPDATE reservations
       SET arrived_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('Arrived error:', error)
    res.status(500).json({ error: 'Failed to mark as arrived' })
  }
})

// PATCH /dashboard/reservations/:id/unarrived — undo arrived
router.patch('/reservations/:id/unarrived', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const result = await pool.query(
      `UPDATE reservations
       SET arrived_at = NULL, updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING *`,
      [id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json({ reservation: result.rows[0] })
  } catch (error) {
    console.error('Unarrived error:', error)
    res.status(500).json({ error: 'Failed to undo arrived' })
  }
})
// POST /dashboard/send-whatsapp — send outbound WhatsApp to a number
router.post('/send-whatsapp', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { whatsapp_number, customer_name, use_template } = req.body

    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' })
    }

    // Clean the number
    let cleanNumber = whatsapp_number.replace(/[\s\-\+]/g, '')
if (cleanNumber.startsWith('0')) {
  cleanNumber = '27' + cleanNumber.slice(1)
}

    console.log('Sending WhatsApp to:', cleanNumber)

    // Get restaurant details
    const restaurant = await pool.query(
      `SELECT r.meta_phone_number_id, rs.restaurant_display_name, r.name
       FROM restaurants r
       JOIN restaurant_settings rs ON rs.restaurant_id = r.id
       WHERE r.id = $1`,
      [restaurantId]
    )

    if (restaurant.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' })
    }

    const { meta_phone_number_id, restaurant_display_name, name } = restaurant.rows[0]
    const restaurantName = restaurant_display_name || name

    console.log('Using phone number ID:', meta_phone_number_id)

    const { sendTemplate } = require('../services/metaService')

    // Use booking_invitation template
    await sendTemplate(
      cleanNumber,
      'booking_invitation',
      [customer_name || 'there', restaurantName],
      meta_phone_number_id
    )

    console.log('WhatsApp invitation sent successfully to:', cleanNumber)

    res.json({ success: true })
  } catch (error) {
    console.error('Send WhatsApp error:', error)
    res.status(500).json({ error: 'Failed to send WhatsApp message' })
  }
})
// Add these routes to backend/src/routes/dashboard.js before the module.exports line

// GET /dashboard/events — get all special events
router.get('/events', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await pool.query(
      `SELECT * FROM special_events
       WHERE restaurant_id = $1
       AND event_date >= CURRENT_DATE
       AND is_active = true
       ORDER BY event_date ASC, start_time ASC`,
      [restaurantId]
    )

    res.json({ events: result.rows })
  } catch (error) {
    console.error('Events error:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

// POST /dashboard/events — create a special event
router.post('/events', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { event_name, event_date, start_time, end_time, cover_charge, description } = req.body

    if (!event_name || !event_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Event name, date, start time and end time are required' })
    }

    const result = await pool.query(
      `INSERT INTO special_events
       (restaurant_id, event_name, event_date, start_time, end_time, cover_charge, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [restaurantId, event_name, event_date, start_time, end_time, cover_charge || null, description || null]
    )

    res.json({ event: result.rows[0] })
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

// PUT /dashboard/events/:id — update a special event
router.put('/events/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params
    const { event_name, event_date, start_time, end_time, cover_charge, description } = req.body

    const result = await pool.query(
      `UPDATE special_events
       SET event_name = $1, event_date = $2, start_time = $3, end_time = $4,
           cover_charge = $5, description = $6
       WHERE id = $7 AND restaurant_id = $8
       RETURNING *`,
      [event_name, event_date, start_time, end_time, cover_charge || null, description || null, id, restaurantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json({ event: result.rows[0] })
  } catch (error) {
    console.error('Update event error:', error)
    res.status(500).json({ error: 'Failed to update event' })
  }
})

// DELETE /dashboard/events/:id — delete a special event
router.delete('/events/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    await pool.query(
      `DELETE FROM special_events WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

// GET /dashboard/events/check?date=2026-06-04&time=19:00 — check if a date/time has a special event
router.get('/events/check', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { date, time } = req.query

    const result = await pool.query(
      `SELECT * FROM special_events
       WHERE restaurant_id = $1
       AND event_date = $2
       AND start_time <= $3
       AND end_time >= $3
       AND is_active = true
       LIMIT 1`,
      [restaurantId, date, time]
    )

    if (result.rows.length === 0) {
      return res.json({ hasEvent: false })
    }

    res.json({ hasEvent: true, event: result.rows[0] })
  } catch (error) {
    console.error('Check event error:', error)
    res.status(500).json({ error: 'Failed to check event' })
  }
})

// GET /dashboard/customers/:id/conversations — get conversation history
router.get('/customers/:id/conversations', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { id } = req.params

    const conversations = await pool.query(
      `SELECT 
        c.id,
        c.state,
        c.last_message_at,
        COUNT(m.id) as message_count
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.customer_id = $1
       AND c.restaurant_id = $2
       GROUP BY c.id
       ORDER BY c.last_message_at DESC`,
      [id, restaurantId]
    )

    res.json({ conversations: conversations.rows })
  } catch (error) {
    console.error('Conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})
// GET /dashboard/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params

    const messages = await pool.query(
      `SELECT id, direction, content, sent_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY sent_at ASC`,
      [id]
    )

    res.json({ messages: messages.rows })
  } catch (error) {
    console.error('Messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

module.exports = router