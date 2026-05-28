// v2 - inlined functions
const { sendMessage } = require('./metaService')
const { processWithAI } = require('./aiService')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getOrCreateConversation = async (from) => {
  const existing = await pool.query(
    `SELECT c.*, cu.name as customer_name 
     FROM conversations c
     LEFT JOIN customers cu ON cu.id = c.customer_id
     WHERE c.whatsapp_thread_id = $1
     AND c.state != 'confirmed'
     ORDER BY c.last_message_at DESC
     LIMIT 1`,
    [from]
  )

  if (existing.rows.length > 0) {
    return existing.rows[0]
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

  const conversation = await pool.query(
    `INSERT INTO conversations 
     (restaurant_id, customer_id, whatsapp_thread_id, state, context_data)
     VALUES ($1, $2, $3, 'new', '{}')
     RETURNING *`,
    [restaurantId, customerId, from]
  )

  return {
    ...conversation.rows[0],
    customer_name: customer.rows[0].name
  }
}

const saveMessage = async (from, direction, content) => {
  const conversation = await pool.query(
    `SELECT id FROM conversations 
     WHERE whatsapp_thread_id = $1 
     AND state != 'confirmed'
     ORDER BY last_message_at DESC
     LIMIT 1`,
    [from]
  )

  if (conversation.rows.length > 0) {
    await pool.query(
      `INSERT INTO messages (conversation_id, direction, content)
       VALUES ($1, $2, $3)`,
      [conversation.rows[0].id, direction, content]
    )
  }
}

const updateConversationState = async (from, newState) => {
  await pool.query(
    `UPDATE conversations 
     SET state = $1, last_message_at = NOW()
     WHERE whatsapp_thread_id = $2 AND state != 'confirmed'`,
    [newState, from]
  )
}

const handleIncomingMessage = async (from, text) => {
  try {
    console.log(`Message from ${from}: ${text}`)

    const conversation = await getOrCreateConversation(from)
    console.log('Conversation retrieved:', conversation.id)

    await saveMessage(from, 'inbound', text)
    console.log('Inbound message saved')

    const { reply, newState } = await processWithAI(text, conversation)
    console.log('AI reply:', reply)

    await updateConversationState(from, newState)
    await saveMessage(from, 'outbound', reply)
    await sendMessage(from, reply)

  } catch (error) {
    console.error('Error handling message:', error)
    await sendMessage(from, 'Sorry, something went wrong. Please try again.')
  }
}

module.exports = { handleIncomingMessage }