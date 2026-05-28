const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getOrCreateConversation = async (from) => {
  // Find existing open conversation
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

  // Get the test restaurant
  const restaurant = await pool.query(
    `SELECT id FROM restaurants WHERE slug = 'test-restaurant' LIMIT 1`
  )
  const restaurantId = restaurant.rows[0].id

  // Find or create customer
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

  // Create new conversation
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

const updateConversationState = async (from, newState, contextData = null) => {
  if (contextData) {
    await pool.query(
      `UPDATE conversations 
       SET state = $1, context_data = $2, last_message_at = NOW()
       WHERE whatsapp_thread_id = $3 AND state != 'confirmed'`,
      [newState, JSON.stringify(contextData), from]
    )
  } else {
    await pool.query(
      `UPDATE conversations 
       SET state = $1, last_message_at = NOW()
       WHERE whatsapp_thread_id = $2 AND state != 'confirmed'`,
      [newState, from]
    )
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

module.exports = { getOrCreateConversation, updateConversationState, saveMessage }