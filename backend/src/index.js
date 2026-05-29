const express = require('express')
const dotenv = require('dotenv')
const { Pool } = require('pg')
const { startReminderService } = require('./services/reminderService')

dotenv.config()

const webhookRoutes = require('./routes/webhook')

const app = express()
app.use(express.json())

// Test database connection on startup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message)
  } else {
    console.log('Database connected successfully')
    release()
  }
})

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use('/webhook', webhookRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'Boeking backend is running' })
})

// Start reminder cron job
startReminderService()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Boeking backend running on port ${PORT}`)
})