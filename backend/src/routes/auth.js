const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Rate limiting — simple in-memory store
const loginAttempts = {}

const checkRateLimit = (email) => {
  const now = Date.now()
  const attempts = loginAttempts[email]

  if (attempts) {
    // Reset if lockout period has passed (15 minutes)
    if (now - attempts.firstAttempt > 3 * 60 * 1000) {
      delete loginAttempts[email]
      return true
    }
    // Block if 5 or more attempts
    if (attempts.count >= 5) {
      return false
    }
  }
  return true
}

const recordLoginAttempt = (email) => {
  const now = Date.now()
  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 1, firstAttempt: now }
  } else {
    loginAttempts[email].count++
  }
}

const clearLoginAttempts = (email) => {
  delete loginAttempts[email]
}

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limit
    if (!checkRateLimit(normalizedEmail)) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again in 3 minutes.'
      })
    }

    // Find user
    const result = await pool.query(
      `SELECT u.*, r.name as restaurant_name, r.slug as restaurant_slug
       FROM users u
       LEFT JOIN restaurants r ON r.id = u.restaurant_id
       WHERE u.email = $1 AND u.is_active = true`,
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      recordLoginAttempt(normalizedEmail)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      recordLoginAttempt(normalizedEmail)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Clear rate limit on successful login
    clearLoginAttempts(normalizedEmail)

    // Update last login
    await pool.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    )

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name,
        restaurantSlug: user.restaurant_slug
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /auth/verify — verify a token is still valid
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    res.json({ valid: true, user: decoded })
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' })
  }
})

module.exports = router