const Anthropic = require('@anthropic-ai/sdk')
const { Pool } = require('pg')
const { checkAvailability, checkOperatingHours, checkBlockedDate } = require('./availabilityService')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getSystemPrompt = (availabilityContext = '', existingBookingContext = '') => {
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

${existingBookingContext}

If there is no existing booking, collect the following in a natural conversational way:
1. Preferred date (always confirm the actual calendar date e.g. "Just to confirm, that's Monday 2 June 2026 — correct?")
2. Preferred time
3. Party size
4. Customer name
5. Any special requests (optional)

${availabilityContext}

Once you have all details and availability is confirmed, summarise and ask for confirmation.

Rules:
- Be warm, friendly and concise - this is WhatsApp, not email
- Ask one question at a time
- Never ask for information the customer has already provided
- Always confirm the actual calendar date when customer uses relative terms
- If a slot is unavailable, suggest the alternatives provided naturally
- If the customer says something unclear, politely ask again
- Always confirm booking details before finalising
- Reply in the same language the customer uses

CANCELLATION HANDLING:
- If the customer wants to cancel, confirm their booking details and ask them to confirm the cancellation
- Once they confirm, send a warm message and end with BOOKING_CANCELLED on a new line

MODIFICATION HANDLING:
- If the customer wants to modify, collect the new details
- Before confirming, you MUST check availability by including a CHECK_AVAILABILITY tag
- Format: CHECK_AVAILABILITY: date=<YYYY-MM-DD>, time=<HH:MM>, party=<number>
- Wait for availability confirmation before proceeding

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

const parseCheckAvailability = (reply) => {
  const match = reply.match(/CHECK_AVAILABILITY:\s*date=([^,]+),\s*time=([^,]+),\s*party=(\d+)/i)
  if (!match) return null
  return {
    date: match[1].trim(),
    time: match[2].trim(),
    party: parseInt(match[3].trim())
  }
}

const processWithAI = async (userMessage, conversation) => {
  console.log('Calling Claude API with model: claude-sonnet-4-5')

  const history = await getConversationHistory(conversation.id)
  const messages = history.length > 0 ? history : [{ role: 'user', content: userMessage }]

  // Build existing booking context
  let existingBookingContext = ''
  const contextData = conversation.context_data || {}
  if (contextData.existingBooking) {
    const b = contextData.existingBooking
    const name = contextData.customerName || 'valued customer'
    existingBookingContext = `EXISTING BOOKING: This customer (${name}) has a confirmed reservation:
- Date: ${b.reservation_date}
- Time: ${b.reservation_time}
- Party size: ${b.party_size}
- Special requests: ${b.special_requests || 'none'}
Greet them by name and show these details. Ask if they want to modify, cancel, or make a new booking.`
  }

  // First pass — get Claude's response
  let availabilityContext = ''
  const systemPrompt = getSystemPrompt(availabilityContext, existingBookingContext)

  let response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  })

  let reply = response.content[0].text
  console.log('Initial AI reply:', reply)

  // Check if Claude wants to check availability
  const availabilityRequest = parseCheckAvailability(reply)

  if (availabilityRequest) {
    console.log('Checking availability for:', availabilityRequest)

    let availabilityResult = ''

    // Check blocked dates
    const blockedCheck = await checkBlockedDate(conversation.restaurant_id, availabilityRequest.date)
    if (blockedCheck.blocked) {
      availabilityResult = `AVAILABILITY RESULT: Not available — ${blockedCheck.message}`
    } else {
      // Check operating hours
      const hoursCheck = await checkOperatingHours(
        conversation.restaurant_id,
        availabilityRequest.date,
        availabilityRequest.time
      )

      if (!hoursCheck.open) {
        availabilityResult = `AVAILABILITY RESULT: Not available — ${hoursCheck.message}`
      } else {
        // Check capacity
        const availability = await checkAvailability(
          conversation.restaurant_id,
          availabilityRequest.date,
          availabilityRequest.time,
          availabilityRequest.party
        )

        if (!availability.available) {
          if (availability.alternatives?.length > 0) {
            availabilityResult = `AVAILABILITY RESULT: Fully booked at ${availabilityRequest.time}. Available alternatives: ${availability.alternatives.join(', ')}.`
          } else {
            availabilityResult = `AVAILABILITY RESULT: Not available — ${availability.message}`
          }
        } else {
          availabilityResult = `AVAILABILITY RESULT: Available — slot confirmed for ${availabilityRequest.date} at ${availabilityRequest.time} for ${availabilityRequest.party} guests.`
        }
      }
    }

    console.log('Availability result:', availabilityResult)

    // Second pass — send availability result back to Claude
    const messagesWithAvailability = [
      ...messages,
      { role: 'assistant', content: reply },
      { role: 'user', content: availabilityResult }
    ]

    response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: getSystemPrompt(availabilityResult, existingBookingContext),
      messages: messagesWithAvailability,
    })

    reply = response.content[0].text
    console.log('Final AI reply:', reply)
  }

  let newState = conversation.state || 'new'
  if (reply.includes('BOOKING_CONFIRMED:')) {
    newState = 'confirmed'
  } else if (newState === 'new') {
    newState = 'in_progress'
  }

  const cleanReply = reply
    .replace(/\nCHECK_AVAILABILITY:.*$/m, '')
    .replace(/\nBOOKING_CONFIRMED:.*$/s, '')
    .replace(/\nBOOKING_CANCELLED.*$/s, '')
    .trim()

  return { reply: cleanReply, newState, rawReply: reply }
}

module.exports = { processWithAI }