const { addToWaitingList, handleWaitingListResponse } = require('./waitingListService')
const { sendMessage } = require('./metaService')
const { processWithAI } = require('./aiService')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getOrCreateConversation = async (from) => {
  const active = await pool.query(
    `SELECT c.*, cu.name as customer_name
     FROM conversations c
     LEFT JOIN customers cu ON cu.id = c.customer_id
     WHERE c.whatsapp_thread_id = $1
     AND c.state = 'in_progress'
     ORDER BY c.last_message_at DESC
     LIMIT 1`,
    [from]
  )

  if (active.rows.length > 0) {
    return active.rows[0]
  }

  const restaurant = await pool.query(
    `SELECT id FROM restaurants WHERE slug = 'test-restaurant' LIMIT 1`
  )
  const restaurantId = restaurant.rows[0].id

  let customer = await pool.query(
    `SELECT * FROM customers
     WHERE whatsapp_number = $1
     AND restaurant_id = $2`,
    [from, restaurantId]
  )

  if (customer.rows.length === 0) {
    customer = await pool.query(
      `INSERT INTO customers (restaurant_id, whatsapp_number)
       VALUES ($1, $2)
       RETURNING *`,
      [restaurantId, from]
    )
  }

  const customerId = customer.rows[0].id
  const customerName = customer.rows[0].name

  const existingBooking = await pool.query(
    `SELECT * FROM reservations
     WHERE customer_id = $1
     AND status = 'confirmed'
     AND reservation_date >= CURRENT_DATE
     ORDER BY reservation_date ASC
     LIMIT 1`,
    [customerId]
  )

  const conversation = await pool.query(
    `INSERT INTO conversations
     (restaurant_id, customer_id, whatsapp_thread_id, state, context_data)
     VALUES ($1, $2, $3, 'new', $4)
     RETURNING *`,
    [
      restaurantId,
      customerId,
      from,
      JSON.stringify({
        existingBooking: existingBooking.rows[0] || null,
        customerName: customerName || null
      })
    ]
  )

  return {
    ...conversation.rows[0],
    customer_name: customerName
  }
}

const saveMessage = async (conversationId, direction, content) => {
  await pool.query(
    `INSERT INTO messages (conversation_id, direction, content)
     VALUES ($1, $2, $3)`,
    [conversationId, direction, content]
  )
}

const updateConversationState = async (conversationId, newState) => {
  await pool.query(
    `UPDATE conversations
     SET state = $1, last_message_at = NOW()
     WHERE id = $2`,
    [newState, conversationId]
  )
}

const saveReservation = async (conversation, bookingDetails) => {
  console.log('Saving reservation with details:', bookingDetails)

  const existing = await pool.query(
    `SELECT id FROM reservations
     WHERE customer_id = $1
     AND status = 'confirmed'
     AND reservation_date >= CURRENT_DATE
     ORDER BY reservation_date ASC
     LIMIT 1`,
    [conversation.customer_id]
  )

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE reservations
       SET reservation_date = $1,
           reservation_time = $2,
           party_size = $3,
           special_requests = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        bookingDetails.date,
        bookingDetails.time,
        parseInt(bookingDetails.party),
        bookingDetails.requests === 'none' ? null : bookingDetails.requests,
        existing.rows[0].id
      ]
    )
    console.log('Existing reservation updated:', existing.rows[0].id)
  } else {
    await pool.query(
      `INSERT INTO reservations
       (restaurant_id, customer_id, reservation_date, reservation_time, party_size, special_requests, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')`,
      [
        conversation.restaurant_id,
        conversation.customer_id,
        bookingDetails.date,
        bookingDetails.time,
        parseInt(bookingDetails.party),
        bookingDetails.requests === 'none' ? null : bookingDetails.requests
      ]
    )
    console.log('New reservation created')
  }

  if (bookingDetails.name) {
    await pool.query(
      `UPDATE customers SET name = $1, total_bookings = total_bookings + 1
       WHERE id = $2`,
      [bookingDetails.name, conversation.customer_id]
    )
    console.log('Customer name updated to:', bookingDetails.name)
  }
}

const cancelReservation = async (customerId) => {
  const result = await pool.query(
    `UPDATE reservations
     SET status = 'cancelled', updated_at = NOW()
     WHERE customer_id = $1
     AND status = 'confirmed'
     AND reservation_date >= CURRENT_DATE
     RETURNING *`,
    [customerId]
  )

  if (result.rows.length > 0) {
    // Log a cancellation notification
    await pool.query(
      `INSERT INTO notifications (reservation_id, type, status, scheduled_for, sent_at)
       VALUES ($1, 'cancellation', 'sent', NOW(), NOW())`,
      [result.rows[0].id]
    )
    console.log('Reservation cancelled:', result.rows[0].id)
    return result.rows[0]
  }

  return null
}

const parseBookingDetails = (reply) => {
  const match = reply.match(/BOOKING_CONFIRMED:\s*date=([^,]+),\s*time=([^,]+),\s*party=([^,]+),\s*name=([^,]+),\s*requests=(.+)/i)
  if (!match) {
    console.log('No BOOKING_CONFIRMED tag found in reply')
    return null
  }

  const details = {
    date: match[1].trim(),
    time: match[2].trim(),
    party: match[3].trim(),
    name: match[4].trim(),
    requests: match[5].trim()
  }

  console.log('Parsed booking details:', details)
  return details
}

const handleIncomingMessage = async (from, text) => {
  try {
    console.log(`Message from ${from}: ${text}`)

    const conversation = await getOrCreateConversation(from)
    console.log('Conversation retrieved:', conversation.id)

    // Check if this is a waiting list response before anything else
    const waitingListResponse = await handleWaitingListResponse(
      from,
      text,
      conversation.restaurant_id
    )

    if (waitingListResponse?.handled) {
      await sendMessage(from, waitingListResponse.reply)
      return
    }

    await saveMessage(conversation.id, 'inbound', text)

    const { reply, newState, rawReply } = await processWithAI(text, conversation)
    console.log('AI reply:', reply)

    // Handle booking confirmation
    if (rawReply && rawReply.includes('BOOKING_CONFIRMED:')) {
      const bookingDetails = parseBookingDetails(rawReply)
      if (bookingDetails) {
        await saveReservation(conversation, bookingDetails)
        console.log('Reservation saved successfully')
      }
    }

    // Handle cancellation
    if (rawReply && rawReply.includes('BOOKING_CANCELLED')) {
      const cancelled = await cancelReservation(conversation.customer_id)
      if (cancelled) {
        console.log('Reservation cancelled successfully')
        // Notify waiting list for that slot
        const { notifyWaitingList } = require('./waitingListService')
        await notifyWaitingList(
          conversation.restaurant_id,
          cancelled.reservation_date,
          cancelled.reservation_time,
          cancelled.party_size
        )
      }
    }

    // Handle waiting list addition
    if (rawReply && rawReply.includes('ADD_TO_WAITLIST:')) {
      const match = rawReply.match(/ADD_TO_WAITLIST:\s*date=([^,]+),\s*time=([^,]+),\s*party=([^,]+)(?:,\s*requests=(.+))?/i)
      if (match) {
        await addToWaitingList(
          conversation,
          match[1].trim(),
          match[2].trim(),
          parseInt(match[3].trim()),
          match[4]?.trim() || null
        )
        console.log('Customer added to waiting list')
      }
    }

    await updateConversationState(conversation.id, newState)
    await saveMessage(conversation.id, 'outbound', reply)
    await sendMessage(from, reply)

  } catch (error) {
    console.error('Error handling message:', error)
    await sendMessage(from, 'Sorry, something went wrong. Please try again.')
  }
}

module.exports = { handleIncomingMessage }