const { Pool } = require('pg')
const { sendMessage } = require('./metaService')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const addToWaitingList = async (conversation, date, time, party, requests) => {
  // Check if customer already on waiting list for this slot
  const existing = await pool.query(
    `SELECT id FROM waiting_list
     WHERE customer_id = $1
     AND requested_date = $2
     AND requested_time = $3
     AND status = 'waiting'`,
    [conversation.customer_id, date, time]
  )

  if (existing.rows.length > 0) {
    return { alreadyOnList: true }
  }

  await pool.query(
    `INSERT INTO waiting_list
     (restaurant_id, customer_id, requested_date, requested_time, party_size, special_requests)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      conversation.restaurant_id,
      conversation.customer_id,
      date,
      time,
      party,
      requests || null
    ]
  )

  console.log(`Added customer ${conversation.customer_id} to waiting list for ${date} at ${time}`)
  return { success: true }
}

const notifyWaitingList = async (restaurantId, date, time, partySize) => {
  // Find first person on waiting list for this slot whose party fits
  const waiting = await pool.query(
    `SELECT w.*, c.whatsapp_number, c.name as customer_name
     FROM waiting_list w
     JOIN customers c ON c.id = w.customer_id
     WHERE w.restaurant_id = $1
     AND w.requested_date = $2
     AND w.requested_time = $3
     AND w.party_size <= $4
     AND w.status = 'waiting'
     ORDER BY w.created_at ASC
     LIMIT 1`,
    [restaurantId, date, time, partySize]
  )

  if (waiting.rows.length === 0) {
    console.log('No one on waiting list for this slot')
    return
  }

  const entry = waiting.rows[0]

  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Johannesburg'
  })

  const formattedTime = time.slice(0, 5)
  const name = entry.customer_name || 'there'

  // Send notification
  const message = `Hi ${name}! 🎉 Good news — a table has just become available at the time you requested!\n\n📅 ${formattedDate}\n🕕 ${formattedTime}\n👥 ${entry.party_size} ${entry.party_size === 1 ? 'guest' : 'guests'}\n\nWould you like to confirm this booking? Reply *YES* to confirm or *NO* to decline.\n\nThis offer expires in 1 hour.`

  await sendMessage(entry.whatsapp_number, message)

  // Update status to offered with expiry
  await pool.query(
    `UPDATE waiting_list
     SET status = 'offered',
         offered_at = NOW(),
         expires_at = NOW() + INTERVAL '1 hour'
     WHERE id = $1`,
    [entry.id]
  )

  console.log(`Waiting list offer sent to ${entry.whatsapp_number}`)
}

const handleWaitingListResponse = async (from, response, restaurantId) => {
  // Find offered entry for this customer
  const entry = await pool.query(
    `SELECT w.*, c.whatsapp_number
     FROM waiting_list w
     JOIN customers c ON c.id = w.customer_id
     WHERE c.whatsapp_number = $1
     AND w.restaurant_id = $2
     AND w.status = 'offered'
     AND w.expires_at > NOW()
     ORDER BY w.offered_at DESC
     LIMIT 1`,
    [from, restaurantId]
  )

  if (entry.rows.length === 0) return null

  const waiting = entry.rows[0]
  const answer = response.trim().toLowerCase()

  if (answer === 'yes' || answer === 'y' || answer === 'ja') {
    // Confirm the booking
    await pool.query(
      `UPDATE waiting_list SET status = 'confirmed' WHERE id = $1`,
      [waiting.id]
    )

    // Create the reservation
    await pool.query(
      `INSERT INTO reservations
       (restaurant_id, customer_id, reservation_date, reservation_time, party_size, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')`,
      [
        waiting.restaurant_id,
        waiting.customer_id,
        waiting.requested_date,
        waiting.requested_time,
        waiting.party_size,
        waiting.special_requests
      ]
    )

    // Update customer total bookings
    await pool.query(
      `UPDATE customers SET total_bookings = total_bookings + 1 WHERE id = $1`,
      [waiting.customer_id]
    )

    const formattedDate = new Date(waiting.requested_date).toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Africa/Johannesburg'
    })

    return {
      handled: true,
      reply: `Wonderful! Your booking is confirmed 🎉\n\n📅 ${formattedDate}\n🕕 ${waiting.requested_time.slice(0, 5)}\n👥 ${waiting.party_size} ${waiting.party_size === 1 ? 'guest' : 'guests'}\n\nWe look forward to seeing you! If you need to make any changes, just send us a message.`
    }
  }

  if (answer === 'no' || answer === 'n' || answer === 'nee') {
    await pool.query(
      `UPDATE waiting_list SET status = 'declined' WHERE id = $1`,
      [waiting.id]
    )

    // Notify next person on waiting list
    await notifyWaitingList(
      waiting.restaurant_id,
      waiting.requested_date,
      waiting.requested_time,
      waiting.party_size
    )

    return {
      handled: true,
      reply: `No problem! We've removed you from the waiting list for that slot. Feel free to message us if you'd like to book for a different time. 😊`
    }
  }

  return null
}

const expireWaitingListOffers = async () => {
  // Find expired offers
  const expired = await pool.query(
    `UPDATE waiting_list
     SET status = 'expired'
     WHERE status = 'offered'
     AND expires_at < NOW()
     RETURNING id, restaurant_id, requested_date, requested_time, party_size`
  )

  for (const entry of expired.rows) {
    console.log(`Waiting list offer expired: ${entry.id}`)
    // Notify next person on waiting list
    await notifyWaitingList(
      entry.restaurant_id,
      entry.requested_date,
      entry.requested_time,
      entry.party_size
    )
  }
}

module.exports = {
  addToWaitingList,
  notifyWaitingList,
  handleWaitingListResponse,
  expireWaitingListOffers
}