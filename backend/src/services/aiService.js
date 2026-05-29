const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })

const systemPrompt = `You are a friendly and professional restaurant reservation assistant for a restaurant using the Boeking platform.

Your job is to help customers make, modify or cancel table reservations via WhatsApp.

You collect the following information in a natural conversational way:
1. Preferred date
2. Preferred time
3. Party size
4. Customer name (if new customer)
5. Any special requests (optional)

Once you have all the details, summarise the booking and ask for confirmation.

Current conversation state: {STATE}
Context data collected so far: {CONTEXT}

Rules:
- Be warm, friendly and concise — this is WhatsApp, not email
- Ask one question at a time
- If the customer says something unclear, politely ask again
- If the customer wants to cancel or modify, help them do so
- Always confirm the booking details before finalising
- Reply in the same language the customer uses

When you have collected all details and the customer confirms, end your reply with:
BOOKING_CONFIRMED: date=<date>, time=<time>, party=<size>, name=<name>, requests=<requests or none>`

const processWithAI = async (userMessage, conversation) => {
  const state = conversation.state || 'new'
  const context = JSON.stringify(conversation.context_data || {})

  const prompt = systemPrompt
    .replace('{STATE}', state)
    .replace('{CONTEXT}', context)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: prompt,
    messages: [
      ...buildMessageHistory(conversation),
      { role: 'user', content: userMessage }
    ],
  })

  const reply = response.content[0].text

  // Detect if booking was confirmed
  let newState = state
  if (reply.includes('BOOKING_CONFIRMED:')) {
    newState = 'confirmed'
  } else if (state === 'new') {
    newState = 'in_progress'
  }

  // Strip the BOOKING_CONFIRMED tag from the customer-facing reply
  const cleanReply = reply.replace(/BOOKING_CONFIRMED:.*$/s, '').trim()

  return { reply: cleanReply, newState }
}

const buildMessageHistory = (conversation) => {
  // For now return empty — we'll add full history once DB is connected
  return []
}

module.exports = { processWithAI }