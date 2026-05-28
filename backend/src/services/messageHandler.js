const { sendMessage } = require('./metaService')
const { getOrCreateConversation, updateConversationState } = require('./conversationService')
const { processWithAI } = require('./aiService')

const handleIncomingMessage = async (from, text) => {
  try {
    console.log(`Message from ${from}: ${text}`)

    // Get or create conversation state for this customer
    const conversation = await getOrCreateConversation(from)

    // Process with AI, passing current state and message
    const { reply, newState } = await processWithAI(text, conversation)

    // Update conversation state
    await updateConversationState(from, newState)

    // Send reply back via WhatsApp
    await sendMessage(from, reply)

  } catch (error) {
    console.error('Error handling message:', error)
    await sendMessage(from, 'Sorry, something went wrong. Please try again.')
  }
}

module.exports = { handleIncomingMessage }