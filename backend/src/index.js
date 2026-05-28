const express = require('express')
const dotenv = require('dotenv')

dotenv.config()

const webhookRoutes = require('./routes/webhook')

const app = express()
app.use(express.json())

app.use('/webhook', webhookRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'Boeking backend is running' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Boeking backend running on port ${PORT}`)
})