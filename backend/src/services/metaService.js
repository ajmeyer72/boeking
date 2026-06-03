const axios = require('axios')

const sendMessage = async (to, message, phoneNumberId = null) => {
  // Use provided phone number ID or fall back to environment variable
  const numId = phoneNumberId || process.env.META_PHONE_NUMBER_ID

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${numId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    console.log(`Message sent to ${to} via phone number ID ${numId}`)
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message)
  }
}

module.exports = { sendMessage }