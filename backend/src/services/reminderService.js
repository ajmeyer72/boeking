const cron = require('node-cron')
const { Pool } = require('pg')
const { sendMessage } = require('./metaService')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const sendReminders = async () => {
  console.log('Running reminder check:', new Date().toISOString())

  try {
    // Find reservations needing 24hr reminder
    const twentyFourHour = await pool.query(
      `SELECT r.*, c.whatsapp_number, c.name as customer_name
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.status = 'confirmed'
       AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.reservation_id = r.id
         AND n.type = 'reminder_24hr'
         AND n.status = 'sent'
       )`
    )

    for (const reservation of twentyFourHour.rows) {
      const message = formatReminderMessage(reservation, '24hr')
      await sendMessage(reservation.whatsapp_number, message)
      await logNotification(reservation.id, 'reminder_24hr')
      console.log(`24hr reminder sent to ${reservation.whatsapp_number}`)
    }

    // Find reservations needing 2hr reminder
    const twoHour = await pool.query(
      `SELECT r.*, c.whatsapp_number, c.name as customer_name
       FROM reservations r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.status = 'confirmed'
       AND r.reservation_date = CURRENT_DATE
       AND r.reservation_time BETWEEN 
         (NOW() AT TIME ZONE 'Africa/Johannesburg' + INTERVAL '2 hours')::time
         AND (NOW() AT TIME ZONE 'Africa/Johannesburg' + INTERVAL '2 hours 59 minutes')::time
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.reservation_id = r.id
         AND n.type = 'reminder_2hr'
         AND n.status = 'sent'
       )`
    )

    for (const reservation of twoHour.rows) {
      const message = formatReminderMessage(reservation, '2hr')
      await sendMessage(reservation.whatsapp_number, message)
      await logNotification(reservation.id, 'reminder_2hr')
      console.log(`2hr reminder sent to ${reservation.whatsapp_number}`)
    }

  } catch (error) {
    console.error('Reminder service error:', error)
  }
}

const formatReminderMessage = (reservation, type) => {
  const name = reservation.customer_name || 'there'
  const date = new Date(reservation.reservation_date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Johannesburg'
  })
  const time = reservation.reservation_time.slice(0, 5)
  const party = reservation.party_size
  const requests = reservation.special_requests

  if (type === '24hr') {
    return `Hi ${name}! 👋 Just a reminder that you have a table booked with us tomorrow.

📅 ${date}
🕕 ${time}
👥 ${party} ${party === 1 ? 'guest' : 'guests'}${requests ? `\n✨ ${requests}` : ''}

We look forward to seeing you! If you need to make any changes, just reply to this message. 😊`
  }

  return `Hi ${name}! ⏰ Your table is coming up in about 2 hours!

📅 ${date}
🕕 ${time}
👥 ${party} ${party === 1 ? 'guest' : 'guests'}${requests ? `\n✨ ${requests}` : ''}

See you soon! If you need to make any changes, just reply to this message. 😊`
}

const logNotification = async (reservationId, type) => {
  await pool.query(
    `INSERT INTO notifications (reservation_id, type, status, scheduled_for, sent_at)
     VALUES ($1, $2, 'sent', NOW(), NOW())`,
    [reservationId, type]
  )
}

const startReminderService = () => {
  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', sendReminders, {
    timezone: 'Africa/Johannesburg'
  })
  console.log('Reminder service started — checking every hour')

  // Run once on startup to catch any missed reminders
  sendReminders()
}

module.exports = { startReminderService }