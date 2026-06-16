console.log('availabilityService loaded — v5')

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const toMinutes = (timeStr) => {
  const clean = timeStr.toString().slice(0, 5)
  const [h, m] = clean.split(':').map(Number)
  return h * 60 + m
}

const checkAvailability = async (restaurantId, date, time, partySize) => {
  console.log('checkAvailability v5 called for:', date, time, partySize)

  const settings = await pool.query(
    `SELECT max_covers_per_slot, slot_duration_mins, max_party_size,
            min_notice_hours, min_notice_mins, booking_window_days
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
    min_notice_mins,
    booking_window_days,
    slot_duration_mins
  } = settings.rows[0]

  console.log('Settings loaded:', { max_covers_per_slot, slot_duration_mins, max_party_size, min_notice_mins })

  // Check party size limit
  if (partySize > max_party_size) {
    return {
      available: false,
      reason: 'party_too_large',
      message: `Sorry, we can only accommodate up to ${max_party_size} guests per booking. For larger groups please call us directly.`
    }
  }

  // Check minimum notice — use mins if set, otherwise fall back to hours
  const noticeMs = min_notice_mins != null
    ? min_notice_mins * 60 * 1000
    : (min_notice_hours || 2) * 60 * 60 * 1000

  const noticeDisplay = min_notice_mins != null
    ? min_notice_mins >= 60
      ? `${Math.floor(min_notice_mins / 60)} hour${Math.floor(min_notice_mins / 60) > 1 ? 's' : ''}`
      : `${min_notice_mins} minutes`
    : `${min_notice_hours || 2} hours`

  const requestedDateTime = new Date(`${date}T${time}`)
  const minNoticeTime = new Date(Date.now() + noticeMs)

  if (requestedDateTime < minNoticeTime) {
    return {
      available: false,
      reason: 'too_soon',
      message: `Sorry, we need at least ${noticeDisplay} notice for bookings. Please call us directly for same-day reservations.`
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

  console.log('Availability check:', { bookedCovers, partySize, max_covers_per_slot, available })

  if (!available) {
    const alternatives = await findAlternativeSlots(
      restaurantId,
      date,
      time,
      partySize,
      max_covers_per_slot,
      slot_duration_mins
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

const findAlternativeSlots = async (restaurantId, date, requestedTime, partySize, maxCovers, slotDuration) => {
  if (!slotDuration) {
    const settings = await pool.query(
      `SELECT slot_duration_mins FROM restaurant_settings WHERE restaurant_id = $1`,
      [restaurantId]
    )
    slotDuration = settings.rows[0]?.slot_duration_mins || 90
  }

  console.log('Using slot duration for alternatives:', slotDuration, 'minutes')

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

  console.log('Booked slots for the day:', bookedByTime)

  const dayOfWeek = new Date(date).getDay()
  const hours = await pool.query(
    `SELECT open_time, close_time FROM operating_hours
     WHERE restaurant_id = $1 AND day_of_week = $2 AND is_closed = false`,
    [restaurantId, dayOfWeek]
  )

  if (hours.rows.length === 0) {
    console.log('No operating hours found — returning empty alternatives')
    return []
  }

  const openMins = toMinutes(hours.rows[0].open_time)
  const closeMins = toMinutes(hours.rows[0].close_time)
  const lastBookingMins = closeMins - 60

  console.log('Operating window (minutes):', { openMins, closeMins, lastBookingMins })

  const requestedMins = toMinutes(requestedTime)

  const isSlotAvailable = (slotMins) => {
    const slotEnd = slotMins + slotDuration

    for (const [timeStr, bookedCovers] of Object.entries(bookedByTime)) {
      if (bookedCovers + partySize <= maxCovers) continue

      const bookedStart = toMinutes(timeStr)
      const bookedEnd = bookedStart + slotDuration

      if (slotMins < bookedEnd && slotEnd > bookedStart) {
        return false
      }
    }

    return true
  }

  const alternatives = []
  const checkedSlots = new Set()
  const candidateSlots = []

  let forwardMins = requestedMins + slotDuration
  while (forwardMins <= lastBookingMins) {
    candidateSlots.push({ mins: forwardMins, diff: forwardMins - requestedMins })
    forwardMins += slotDuration
  }

  let backwardMins = requestedMins - slotDuration
  while (backwardMins >= openMins) {
    candidateSlots.push({ mins: backwardMins, diff: requestedMins - backwardMins })
    backwardMins -= slotDuration
  }

  candidateSlots.sort((a, b) => a.diff - b.diff)

  for (const { mins } of candidateSlots) {
    if (checkedSlots.has(mins)) continue
    checkedSlots.add(mins)

    if (mins < openMins || mins > lastBookingMins) continue
    if (mins === requestedMins) continue

    if (isSlotAvailable(mins)) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      const slot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      console.log('Alternative slot found:', slot)
      alternatives.push(slot)
    }

    if (alternatives.length >= 3) break
  }

  console.log('Final alternatives:', alternatives)
  return alternatives
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

  const openMins = toMinutes(open_time)
  const closeMins = toMinutes(close_time)
  const requestMins = toMinutes(time)
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

const checkMonthlyLimit = async (restaurantId) => {
  const restaurant = await pool.query(
    `SELECT r.plan, r.monthly_booking_limit
     FROM restaurants r
     WHERE r.id = $1`,
    [restaurantId]
  )

  if (restaurant.rows.length === 0) return { withinLimit: true }

  const { plan, monthly_booking_limit } = restaurant.rows[0]

  if (plan === 'growth' || !monthly_booking_limit) return { withinLimit: true }

  const count = await pool.query(
    `SELECT COUNT(*) as count FROM reservations
     WHERE restaurant_id = $1
     AND status = 'confirmed'
     AND EXTRACT(MONTH FROM reservation_date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM reservation_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
    [restaurantId]
  )

  const currentCount = parseInt(count.rows[0].count)

  if (currentCount >= monthly_booking_limit) {
    return {
      withinLimit: false,
      message: `Sorry, we have reached our maximum bookings for this month. Please call us directly to make a reservation.`
    }
  }

  return {
    withinLimit: true,
    remaining: monthly_booking_limit - currentCount
  }
}

module.exports = {
  checkAvailability,
  checkOperatingHours,
  checkBlockedDate,
  checkMonthlyLimit
}
