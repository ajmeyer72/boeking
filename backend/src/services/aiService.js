const Anthropic = require('@anthropic-ai/sdk')
const { Pool } = require('pg')
const { checkAvailability, checkOperatingHours, checkBlockedDate } = require('./availabilityService')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const getRestaurantSettings = async (restaurantId) => {
  const result = await pool.query(
    `SELECT 
      r.name as restaurant_name,
      rs.greeting_message,
      rs.restaurant_display_name,
      rs.bot_tone,
      rs.max_party_size,
      rs.min_notice_hours,
      rs.booking_window_days,
      rs.max_covers_per_slot,
      rs.slot_duration_mins
     FROM restaurants r
     LEFT JOIN restaurant_settings rs ON rs.restaurant_id = r.id
     WHERE r.id = $1`,
    [restaurantId]
  )
  return result.rows[0] || {}
}

const getToneInstructions = (tone) => {
  switch (tone) {
    case 'formal':
      return 'You communicate in a professional and polished manner. Use proper greetings, avoid contractions, and maintain a refined tone throughout.'
    case 'casual':
      return 'You communicate in a relaxed and conversational way. Keep things light, friendly and approachable — like chatting with a friend.'
    default:
      return 'You communicate in a warm and friendly manner. Be approachable, helpful and personable without being overly formal.'
  }
}

const getSystemPrompt = (settings = {}, availabilityContext = '', existingBookingContext = '') => {
  const today = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg'
  })

  const restaurantName = settings.restaurant_display_name || settings.restaurant_name || 'our restaurant'
  const tone = getToneInstructions(settings.bot_tone)
  const greeting = settings.greeting_message
    ? `Your opening greeting when a new customer messages: "${settings.greeting_message}"`
    : `Greet new customers warmly and introduce yourself as the reservation assistant for ${restaurantName}.`

  return `You are a reservation assistant for ${restaurantName}, handling table bookings via WhatsApp.

Today's date is ${today}. Use this to correctly interpret relative dates like "next Monday" or "this Sunday".

TONE: ${tone}

GREETING: ${greeting}

${existingBookingContext}

Your job is to help customers make, modify or cancel table reservations.

If there is no existing booking, collect the following in a natural conversational way:
1. Preferred date (always confirm the actual calendar date e.g. "Just to confirm, that's Monday 2 June 2026 — correct?")
2. Preferred time
3. Party size
4. Customer name
5. Any special requests (optional)

${availabilityContext}

Once you have all details and availability is confirmed, summarise and ask for confirmation.

Rules:
- Be concise — this is WhatsApp, not email
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
WAITING LIST HANDLING:
- If a slot is fully booked, offer to add the customer to the waiting list
- Ask: "We're fully booked at that time. Would you like to be added to the waiting list? If a spot opens up we'll message you straight away."
- If they say yes, collect any missing details (date, time, party size) then end your reply with:
ADD_TO_WAITLIST: date=<YYYY-MM-DD>, time=<HH:MM>, party=<number>, requests=<details or none>
- Confirm to the customer they've been added: "You're on the waiting list for [date] at [time]. We'll be in touch if a table becomes available! 🤞"

MODIFICATION HANDLING:
- If the customer wants to modify, collect the new details
- Before confirming, include a CHECK_AVAILABILITY tag
- Format: CHECK_AVAILABILITY: date=<YYYY-MM-DD>, time=<HH:MM>, party=<number>

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

  // Load restaurant settings
  const settings = await getRestaurantSettings(conversation.restaurant_id)
  console.log('Restaurant settings loaded:', {
    name: settings.restaurant_display_name || settings.restaurant_name,
    tone: settings.bot_tone,
    hasGreeting: !!settings.greeting_message
  })

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

  // First pass
  let response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: getSystemPrompt(settings, '', existingBookingContext),
    messages,
  })

  let reply = response.content[0].text
  console.log('Initial AI reply:', reply)

  // Check if Claude wants to check availability
  const availabilityRequest = parseCheckAvailability(reply)

  if (availabilityRequest) {
    console.log('Checking availability for:', availabilityRequest)

    let availabilityResult = ''

    const blockedCheck = await checkBlockedDate(conversation.restaurant_id, availabilityRequest.date)
    if (blockedCheck.blocked) {
      availabilityResult = `AVAILABILITY RESULT: Not available — ${blockedCheck.message}`
    } else {
      const hoursCheck = await checkOperatingHours(
        conversation.restaurant_id,
        availabilityRequest.date,
        availabilityRequest.time
      )

      if (!hoursCheck.open) {
        availabilityResult = `AVAILABILITY RESULT: Not available — ${hoursCheck.message}`
      } else {
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

    // Second pass with availability result
    const messagesWithAvailability = [
      ...messages,
      { role: 'assistant', content: reply },
      { role: 'user', content: availabilityResult }
    ]

    response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: getSystemPrompt(settings, availabilityResult, existingBookingContext),
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
  .replace(/\nADD_TO_WAITLIST:.*$/s, '')
  .trim()

  return { reply: cleanReply, newState, rawReply: reply }
}

module.exports = { processWithAI }