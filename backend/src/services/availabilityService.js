console.log('availabilityService loaded — v3')

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
  console.log('checkAvailability v3 called for:', date, time, partySize)

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
    booking_window_days,
    slot_duration_mins
  } = settings.rows[0]

  console.log('Settings loaded:', { max_covers_per_slot, slot_duration_mins, max_party_size })

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
  // Use passed slot duration or fetch from settings
  if (!slotDuration) {
    const settings = await pool.query(
      `SELECT slot_duration_mins FROM restaurant_settings WHERE restaurant_id = $1`,
      [restaurantId]
    )
    slotDuration = settings.rows[0]?.slot_duration_mins || 90
  }

  console.log('Using slot duration for alternatives:', slotDuration, 'minutes')

  // Get all bookings for the day
  const dayBookings = await pool.query(
    `SELECT reservation_time, SUM(party_size) as booked_covers
     FROM reservations
     WHERE restaurant_id = $1
     AND reservation_date = $2
     AND status = 'confirmed'
     GROUP BY reservation_time`,
    [restaurantId, date]
  )

  // Build a map of booked covers per time slot
  const bookedByTime = {}
  dayBookings.rows.forEach(row => {
    bookedByTime[row.reservation_time.slice(0, 5)] = parseInt(row.booked_covers)
  })

  console.log('Booked slots for the day:', bookedByTime)

  // Get operating hours for this day
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

  // Convert requested time to minutes
  const requestedMins = toMinutes(requestedTime)

  // Check if a given slot overlaps with any fully booked slot
  const isSlotAvailable = (slotMins) => {
    const slotEnd = slotMins + slotDuration

    for (const [timeStr, bookedCovers] of Object.entries(bookedByTime)) {
      if (bookedCovers + partySize <= maxCovers) continue

      const bookedStart = toMinutes(timeStr)
      const bookedEnd = bookedStart + slotDuration

      if (slotMins < bookedEnd && slotEnd > bookedStart) {
        console.log(`Slot ${slotMins} overlaps with booked slot at ${bookedStart}`)
        return false
      }
    }

    return true
  }

  // Generate slots radiating out from requested time in both directions
  const alternatives = []
  const checkedSlots = new Set()

  // Generate candidate slots — go backwards and forwards from requested time
  const candidateSlots = []

  // Forward slots from requested time
  let forwardMins = requestedMins + slotDuration
  while (forwardMins <= lastBookingMins) {
    candidateSlots.push({ mins: forwardMins, diff: forwardMins - requestedMins })
    forwardMins += slotDuration
  }

  // Backward slots from requested time
  let backwardMins = requestedMins - slotDuration
  while (backwardMins >= openMins) {
    candidateSlots.push({ mins: backwardMins, diff: requestedMins - backwardMins })
    backwardMins -= slotDuration
  }

  // Sort by closest to requested time
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

const generateTimeSlots = (slotDuration = 90) => {
  const slots = []
  let minutes = 11 * 60
  const endMinutes = 22 * 60

  while (minutes <= endMinutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    minutes += slotDuration
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

module.exports = {
  checkAvailability,
  checkOperatingHours,
  checkBlockedDate
}