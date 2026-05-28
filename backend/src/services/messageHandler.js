const { sendMessage } = require('./metaService')
const { getOrCreateConversation, updateConversationState, saveMessage } = require('./conversationService')
const { processWithAI } = require('./aiService')

const handleIncomingMessage = async (from, text) => {
  try {
    console.log(`Message from ${from}: ${text}`)

    // Save inbound message
    const conversation = await getOrCreateConversation(from)
    await saveMessage(from, 'inbound', text)

    // Process with AI
    const { reply, newState } = await processWithAI(text, conversation)

    // Update conversation state
    await updateConversationState(from, newState)

    // Save outbound message
    await saveMessage(from, 'outbound', reply)

    // Send reply
    await sendMessage(from, reply)

  } catch (error) {
    console.error('Error handling message:', error)
    await sendMessage(from, 'Sorry, something went wrong. Please try again.')
  }
}

module.exports = { handleIncomingMessage }