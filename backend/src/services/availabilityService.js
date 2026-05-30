const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const checkAvailability = async (restaurantId, date, time, partySize) => {
  const settings = await pool.query(
    `SELECT max_covers_per_slot, slot_duration_mins, max_party_size,
            min_notice_hours, booking_window_days
     FROM restaurant_settings
     WHERE restaurant_id = $1`,
    [restaurantId]
  )

  if (settings.rows.length === 0) {
    return { available: true }
  }

  const {
    max_covers_per_slot,
    max_party_size,
    min_notice_hours,
    booking_window_days
  } = settings.rows[0]

  // Check party size limit
  if (partySize > max_party_size) {
    return {
      available: false,
      reason: 'party_too_large',
      message: `Sorry, we can only accommodate up to ${max_party_size} guests per booking. For larger groups please call us directly.`
    }
  }

  // Check minimum notice
  const requestedDateTime = new Date(`${date}T${time}`)
  const minNoticeTime = new Date(Date.now() + min_notice_hours * 60 * 60 * 1000)

  if (requestedDateTime < minNoticeTime) {
    return {
      available: false,
      reason: 'too_soon',
      message: `Sorry, we need at least ${min_notice_hours} hours notice for bookings. Please call us directly for same-day reservations.`
    }
  }

  // Check booking window
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + booking_window_days)

  if (requestedDateTime > maxDate) {
    return {
      available: false,
      reason: 'too_far',
      message: `Sorry, we only accept bookings up to ${booking_window_days} days in advance.`
    }
  }

  // Check covers for this slot
  const booked = await pool.query(
    `SELECT COALESCE(SUM(party_size), 0) as booked_covers
     FROM reservations
     WHERE restaurant_id = $1
     AND reservation_date = $2
     AND reservation_time = $3
     AND status = 'confirmed'`,
    [restaurantId, date, time]
  )

  const bookedCovers = parseInt(booked.rows[0].booked_covers)
  const available = bookedCovers + partySize <= max_covers_per_slot

  if (!available) {
    const alternatives = await findAlternativeSlots(
      restaurantId,
      date,
      time,
      partySize,
      max_covers_per_slot
    )
    return {
      available: false,
      reason: 'fully_booked',
      alternatives,
      message: `Sorry, we're fully booked at ${time} on that date.`
    }
  }

  return {
    available: true,
    remainingCovers: max_covers_per_slot - bookedCovers - partySize
  }
}

const findAlternativeSlots = async (restaurantId, date, requestedTime, partySize, maxCovers) => {
  const dayBookings = await pool.query(
    `SELECT reservation_time, SUM(party_size) as booked_covers
     FROM reservations
     WHERE restaurant_id = $1
     AND reservation_date = $2
     AND status = 'confirmed'
     GROUP BY reservation_time`,
    [restaurantId, date]
  )

  const bookedByTime = {}
  dayBookings.rows.forEach(row => {
    bookedByTime[row.reservation_time.slice(0, 5)] = parseInt(row.booked_covers)
  })

  const slots = generateTimeSlots()
  const [reqH, reqM] = requestedTime.split(':').map(Number)
  const requestedMinutes = reqH * 60 + reqM

  const alternatives = []

  for (const slot of slots) {
    const [h, m] = slot.split(':').map(Number)
    const slotMinutes = h * 60 + m
    const diff = Math.abs(slotMinutes - requestedMinutes)

    if (diff === 0) continue
    if (diff > 120) continue

    const booked = bookedByTime[slot] || 0
    if (booked + partySize <= maxCovers) {
      alternatives.push(slot)
    }

    if (alternatives.length >= 3) break
  }

  return alternatives
}

const generateTimeSlots = () => {
  const slots = []
  for (let h = 11; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
}

const checkOperatingHours = async (restaurantId, date, time) => {
  const dayOfWeek = new Date(date).getDay()

  console.log('Checking operating hours for day:', dayOfWeek, 'time:', time)

  const hours = await pool.query(
    `SELECT open_time, close_time, is_closed
     FROM operating_hours
     WHERE restaurant_id = $1
     AND day_of_week = $2`,
    [restaurantId, dayOfWeek]
  )

  if (hours.rows.length === 0) {
    console.log('No operating hours found for this day — assuming open')
    return { open: true }
  }

  const { open_time, close_time, is_closed } = hours.rows[0]

  console.log('Operating hours:', { open_time, close_time, is_closed })

  if (is_closed) {
    return {
      open: false,
      message: "Sorry, we're closed on that day. Please choose another date."
    }
  }

  // Convert times to minutes for reliable comparison
  const toMinutes = (t) => {
    const clean = t.slice(0, 5)
    const [h, m] = clean.split(':').map(Number)
    return h * 60 + m
  }

  const openMins = toMinutes(open_time)
  const closeMins = toMinutes(close_time)
  const requestMins = toMinutes(time)

  // Last booking is 1 hour before closing
  const lastBookingMins = closeMins - 60

  console.log('Time comparison (minutes):', {
    open: openMins,
    close: closeMins,
    lastBooking: lastBookingMins,
    requested: requestMins
  })

  if (requestMins < openMins || requestMins > lastBookingMins) {
    const closeHour = Math.floor(lastBookingMins / 60)
    const closeMin = lastBookingMins % 60
    const lastBookingTime = `${closeHour.toString().padStart(2, '0')}:${closeMin.toString().padStart(2, '0')}`

    return {
      open: false,
      message: `Sorry, our last booking is at ${lastBookingTime}. We're open from ${open_time.slice(0, 5)} to ${close_time.slice(0, 5)}. Please choose an earlier time.`
    }
  }

  return { open: true }
}

const checkBlockedDate = async (restaurantId, date) => {
  const blocked = await pool.query(
    `SELECT reason FROM blocked_dates
     WHERE restaurant_id = $1
     AND blocked_date = $2`,
    [restaurantId, date]
  )

  if (blocked.rows.length > 0) {
    return {
      blocked: true,
      message: `Sorry, we're not taking bookings on that date${blocked.rows[0].reason ? ` (${blocked.rows[0].reason})` : ''}. Please choose another date.`
    }
  }

  return { blocked: false }
}

module.exports = {
  checkAvailability,
  checkOperatingHours,
  checkBlockedDate
}