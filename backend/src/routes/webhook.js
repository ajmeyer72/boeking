const express = require('express')
const router = express.Router()
const messageHandler = require('../services/messageHandler')

console.log('messageHandler exports:', Object.keys(messageHandler))

router.get('/', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('Webhook verified successfully')
    res.status(200).send(challenge)
  } else {
    res.status(403).send('Forbidden')
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body

    if (
      body.object === 'whatsapp_business_account' &&
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0]
      const from = message.from
      const text = message.text?.body

      console.log('handleIncomingMessage type:', typeof messageHandler.handleIncomingMessage)

      if (text) {
        await messageHandler.handleIncomingMessage(from, text)
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Error')
  }
})

module.exports = router