const axios = require('axios')

const sendMessage = async (to, message, phoneNumberId = null) => {
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

const sendTemplate = async (to, templateName, parameters, phoneNumberId = null) => {
  const numId = phoneNumberId || process.env.META_PHONE_NUMBER_ID

  try {
    const components = []

    if (parameters && parameters.length > 0) {
      components.push({
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param
        }))
      })
    }

    await axios.post(
      `https://graph.facebook.com/v19.0/${numId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    console.log(`Template "${templateName}" sent to ${to} via phone number ID ${numId}`)
  } catch (error) {
    console.error('Error sending template:', error.response?.data || error.message)
  }
}

module.exports = { sendMessage, sendTemplate }
