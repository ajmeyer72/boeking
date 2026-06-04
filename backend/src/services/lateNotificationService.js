const { Pool } = require('pg')
const { sendMessage } = require('./metaService')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const checkLateCustomers = async () => {
  console.log('Checking for late customers...')

  try {
    // Get all active restaurants with late notifications enabled
    const restaurants = await pool.query(
      `SELECT r.id, r.meta_phone_number_id,
              rs.late_grace_mins, rs.late_hold_mins, rs.auto_noshow_mins,
              rs.late_notifications_enabled
       FROM restaurants r
       JOIN restaurant_settings rs ON rs.restaurant_id = r.id
       WHERE r.is_active = true
       AND rs.late_notifications_enabled = true`
    )

    console.log('Restaurants to check:', restaurants.rows.length, restaurants.rows.map(r => r.id))

    for (const restaurant of restaurants.rows) {
      const graceMins = restaurant.late_grace_mins || 15
      const autoNoshowMins = restaurant.auto_noshow_mins || 45

      console.log(`Checking restaurant ${restaurant.id} — grace: ${graceMins} mins, auto noshow: ${autoNoshowMins} mins`)

      // Current SA time for comparison
      const nowResult = await pool.query(
        `SELECT (NOW() AT TIME ZONE 'Africa/Johannesburg')::time as sa_time`
      )
      const saTime = nowResult.rows[0].sa_time
      console.log('Current SA time:', saTime)

      // Find reservations past grace period that have not arrived
      const lateReservations = await pool.query(
        `SELECT r.*, c.whatsapp_number, c.name as customer_name
         FROM reservations r
         JOIN customers c ON c.id = r.customer_id
         WHERE r.restaurant_id = $1
         AND r.status = 'confirmed'
         AND r.reservation_date = CURRENT_DATE
         AND r.arrived_at IS NULL
         AND r.late_notification_sent_at IS NULL
         AND (NOW() AT TIME ZONE 'Africa/Johannesburg')::time >
             (r.reservation_time + ($2 || ' minutes')::INTERVAL)`,
        [restaurant.id, graceMins]
      )

      console.log('Late reservations found:', lateReservations.rows.length)

      for (const reservation of lateReservations.rows) {
        console.log('Processing late reservation:', reservation.id, 'time:', reservation.reservation_time)
        const holdMins = restaurant.late_hold_mins || 30
        const name = reservation.customer_name || 'there'
        const time = reservation.reservation_time.slice(0, 5)

        const message = `Hi ${name}! We have your table ready at ${time} but have not seen you yet.\n\nShall we hold your table for another ${holdMins} minutes?\n\nReply YES to hold your table or NO to cancel your reservation.`

        await sendMessage(reservation.whatsapp_number, message, restaurant.meta_phone_number_id)

        await pool.query(
          `UPDATE reservations
           SET late_notification_sent_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [reservation.id]
        )

        console.log(`Late notification sent to ${reservation.whatsapp_number}`)
      }

      // Auto no-show reservations that have not responded
      const autoNoshow = await pool.query(
        `SELECT r.*, c.whatsapp_number, c.name as customer_name
         FROM reservations r
         JOIN customers c ON c.id = r.customer_id
         WHERE r.restaurant_id = $1
         AND r.status = 'confirmed'
         AND r.reservation_date = CURRENT_DATE
         AND r.arrived_at IS NULL
         AND r.late_notification_sent_at IS NOT NULL
         AND (NOW() AT TIME ZONE 'Africa/Johannesburg')::time >
             (r.reservation_time + ($2 || ' minutes')::INTERVAL)`,
        [restaurant.id, graceMins + autoNoshowMins]
      )

      console.log('Auto no-show candidates:', autoNoshow.rows.length)

      for (const reservation of autoNoshow.rows) {
        console.log('Auto no-show:', reservation.id)

        await pool.query(
          `UPDATE reservations SET status = 'no_show', updated_at = NOW() WHERE id = $1`,
          [reservation.id]
        )

        await pool.query(
          `UPDATE customers SET no_shows = no_shows + 1 WHERE id = $1`,
          [reservation.customer_id]
        )

        const { notifyWaitingList } = require('./waitingListService')
        await notifyWaitingList(
          restaurant.id,
          reservation.reservation_date,
          reservation.reservation_time,
          reservation.party_size
        )

        console.log(`Auto no-show processed: ${reservation.id}`)
      }
    }
  } catch (error) {
    console.error('Late notification error:', error)
  }
}

const handleLateResponse = async (from, text, restaurantId) => {
  const reservation = await pool.query(
    `SELECT r.*, c.whatsapp_number
     FROM reservations r
     JOIN customers c ON c.id = r.customer_id
     WHERE c.whatsapp_number = $1
     AND r.restaurant_id = $2
     AND r.status = 'confirmed'
     AND r.reservation_date = CURRENT_DATE
     AND r.arrived_at IS NULL
     AND r.late_notification_sent_at IS NOT NULL
     ORDER BY r.reservation_time DESC
     LIMIT 1`,
    [from, restaurantId]
  )

  if (reservation.rows.length === 0) return null

  const res = reservation.rows[0]
  const answer = text.trim().toLowerCase()

  if (answer === 'yes' || answer === 'y' || answer === 'ja') {
    const name = res.customer_name || 'there'
    const holdMins = 30
    return {
      handled: true,
      reply: `Great news! We will hold your table for another ${holdMins} minutes. See you soon ${name}!`
    }
  }

  if (answer === 'no' || answer === 'n' || answer === 'nee') {
    await pool.query(
      `UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [res.id]
    )

    const { notifyWaitingList } = require('./waitingListService')
    await notifyWaitingList(restaurantId, res.reservation_date, res.reservation_time, res.party_size)

    return {
      handled: true,
      reply: `No problem — your reservation has been cancelled. We hope to see you another time!`
    }
  }

  return null
}

module.exports = { checkLateCustomers, handleLateResponse }
