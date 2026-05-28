const axios = require('axios')

const sendMessage = async (to, message) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
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
    console.log(`Message sent to ${to}`)
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message)
  }
}

module.exports = { sendMessage }