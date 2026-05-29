const Anthropic = require('@anthropic-ai/sdk')
const { Pool } = require('pg')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getSystemPrompt = () => {
  const today = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg'
  })

  return `You are a friendly and professional restaurant reservation assistant for a restaurant using the Boeking platform.

Today's date is ${today}. Use this to correctly interpret relative dates like "next Monday" or "this Sunday".

Your job is to help customers make, modify or cancel table reservations via WhatsApp.

At the start of each conversation you will receive context data. If it contains an existingBooking, the customer already has a confirmed reservation — greet them by name and show their booking details, then ask if they would like to modify it, cancel it, or make a new booking. Do not ask them for information you already have.

If there is no existing booking, collect the following in a natural conversational way:
1. Preferred date (always confirm the actual calendar date e.g. "Just to confirm, that's Monday 2 June 2026 — correct?")
2. Preferred time
3. Party size
4. Customer name
5. Any special requests (optional)

Once you have all details, summarise and ask for confirmation.

Rules:
- Be warm, friendly and concise - this is WhatsApp, not email
- Ask one question at a time
- Never ask for information the customer has already provided
- Always confirm the actual calendar date when customer uses relative terms
- If the customer says something unclear, politely ask again
- Always confirm booking details before finalising
- Reply in the same language the customer uses

CANCELLATION HANDLING:
- If the customer wants to cancel, confirm their booking details and ask them to confirm the cancellation
- Once they confirm the cancellation, send a warm message and end with BOOKING_CANCELLED on a new line
- Example cancellation confirmation message: "Your reservation has been cancelled. We hope to see you another time! 😊"

MODIFICATION HANDLING:
- If the customer wants to modify, collect the new details and confirm before saving
- When confirmed, end with the BOOKING_CONFIRMED tag as usual with all updated details

When the customer confirms a new booking or modification, you MUST end your reply with this exact tag on a new line:
BOOKING_CONFIRMED: date=<YYYY-MM-DD>, time=<HH:MM>, party=<number>, name=<full name>, requests=<details or none>

When the customer confirms a cancellation, you MUST end your reply with this exact tag on a new line:
BOOKING_CANCELLED`
}

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

  const history = await getConversationHistory(conversation.id)
  const messages = history.length > 0 ? history : [{ role: 'user', content: userMessage }]

  // Inject context as first user message if this is a new conversation
  const contextData = conversation.context_data || {}
  let systemPrompt = getSystemPrompt()

  if (contextData.existingBooking) {
    const b = contextData.existingBooking
    systemPrompt += `\n\nCONTEXT: This customer has an existing confirmed booking:
- Date: ${b.reservation_date}
- Time: ${b.reservation_time}
- Party size: ${b.party_size}
- Name: ${contextData.customerName || 'valued customer'}
- Special requests: ${b.special_requests || 'none'}
Greet them by name and show these details. Ask if they want to modify, cancel, or make a new booking.`
  }

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

const cleanReply = reply
  .replace(/\nBOOKING_CONFIRMED:.*$/s, '')
  .replace(/\nBOOKING_CANCELLED.*$/s, '')
  .trim()

  return { reply: cleanReply, newState, rawReply: reply }
}

module.exports = { processWithAI }