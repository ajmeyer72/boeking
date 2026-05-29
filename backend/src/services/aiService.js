const Anthropic = require('@anthropic-ai/sdk')
const { Pool } = require('pg')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const systemPrompt = `You are a friendly and professional restaurant reservation assistant for a restaurant using the Boeking platform.

Your job is to help customers make, modify or cancel table reservations via WhatsApp.

You collect the following information in a natural conversational way:
1. Preferred date
2. Preferred time
3. Party size
4. Customer name (if new customer)
5. Any special requests (optional)

Once you have all the details, summarise the booking and ask for confirmation.

Rules:
- Be warm, friendly and concise - this is WhatsApp, not email
- Ask one question at a time
- Never ask for information the customer has already provided
- Keep track of what has been collected and only ask for what is missing
- If the customer says something unclear, politely ask again
- If the customer wants to cancel or modify, help them do so
- Always confirm the booking details before finalising
- Reply in the same language the customer uses

When you have collected all details and the customer confirms, end your reply with:
BOOKING_CONFIRMED: date=<date>, time=<time>, party=<size>, name=<name>, requests=<requests or none>`

const getConversationHistory = async (conversationId) => {
  const result = await pool.query(
    `SELECT direction, content FROM messages
     WHERE conversation_id = $1
     ORDER BY sent_at ASC`,
    [conversationId]
  )

  return result.rows.map(row => ({
    role: row.direction === 'inbound' ? 'user' : 'assistant',
    content: row.content
  }))
}

const processWithAI = async (userMessage, conversation) => {
  console.log('Calling Claude API with model: claude-sonnet-4-5')

  // Get full conversation history from database
  const history = await getConversationHistory(conversation.id)

  // Build messages array — history already includes current message
  // since we saved it before calling processWithAI
  // So we don't add userMessage again
  const messages = history.length > 0 ? history : [{ role: 'user', content: userMessage }]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].text
  console.log('AI reply:', reply)

  let newState = conversation.state || 'new'
  if (reply.includes('BOOKING_CONFIRMED:')) {
    newState = 'confirmed'
  } else if (newState === 'new') {
    newState = 'in_progress'
  }

  const cleanReply = reply.replace(/BOOKING_CONFIRMED:.*$/s, '').trim()

  return { reply: cleanReply, newState }
}

module.exports = { processWithAI }