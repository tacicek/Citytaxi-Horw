import { NextRequest, NextResponse } from 'next/server'
import type { BookingPayload } from '@/lib/booking-notifications'
import {
  notifyBookingCustomer,
  notifyBookingDispatch,
} from '@/lib/booking-notifications'

const PHONE_DISPLAY = '041 514 44 44'

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.BOOKING_EMAIL_FROM &&
      process.env.BOOKING_EMAIL_DISPATCH
  )
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Honeypot spam filter — silent 200
    if (data.website && String(data.website).trim() !== '') {
      return NextResponse.json({ success: true, notifications: { dispatch: 'skipped', customer: 'skipped' } })
    }

    // Required field validation
    const required = ['pickup', 'destination', 'date', 'time', 'name', 'phone', 'consent']
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return NextResponse.json(
          { success: false, error: `Bitte füllen Sie das Feld "${field}" aus.` },
          { status: 400 }
        )
      }
    }

    if (data.consent !== 'on' && data.consent !== 'true' && data.consent !== true) {
      return NextResponse.json(
        { success: false, error: 'Bitte stimmen Sie der Datenverarbeitung zu.' },
        { status: 400 }
      )
    }

    // Date validation — allow up to 30 min in the past (accounts for form fill time)
    const bookingDate = new Date(`${String(data.date)}T${String(data.time)}`)
    if (Number.isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges Datum oder Uhrzeit.' },
        { status: 400 }
      )
    }
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
    if (bookingDate < thirtyMinAgo) {
      return NextResponse.json(
        { success: false, error: 'Das gewählte Datum / die Uhrzeit liegt in der Vergangenheit. Bitte wählen Sie einen späteren Zeitpunkt.' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailVal = data.email ? String(data.email).trim() : ''
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return NextResponse.json(
        { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
        { status: 400 }
      )
    }

    const payload: BookingPayload = {
      pickup: String(data.pickup).trim(),
      destination: String(data.destination).trim(),
      date: String(data.date),
      time: String(data.time),
      passengers: String(data.passengers || '1'),
      service: String(data.service || 'Stadtfahrt'),
      returnTrip: data.returnTrip === 'on' || data.returnTrip === true,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      email: emailVal || undefined,
      flightNumber: data.flightNumber ? String(data.flightNumber).trim() : undefined,
      luggage: data.luggage ? String(data.luggage) : undefined,
      notes: data.notes ? String(data.notes).trim() : undefined,
      receivedAt: new Date().toISOString(),
    }

    // Optional webhook (Zapier / Make / Slack)
    const webhookUrl = process.env.BOOKING_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking_request', ...payload }),
      }).catch((err) => console.error('[BookingAPI] Webhook error:', err))
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BookingRequest]', JSON.stringify(payload, null, 2))
    }

    const notifications: {
      dispatch: 'sent' | 'skipped' | 'failed'
      customer: 'sent' | 'skipped' | 'failed'
    } = { dispatch: 'skipped', customer: 'skipped' }

    if (isEmailConfigured()) {
      const dispatchResult = await notifyBookingDispatch(payload)
      if (!dispatchResult.ok) {
        // Email failure is non-blocking — booking is still received, log for follow-up
        console.error('[BookingAPI] Dispatch e-mail failed:', dispatchResult.error)
        notifications.dispatch = 'failed'
      } else {
        notifications.dispatch = 'sent'
      }

      if (payload.email) {
        const customerResult = await notifyBookingCustomer(payload)
        notifications.customer = customerResult.ok ? 'sent' : 'failed'
        if (!customerResult.ok) {
          console.error('[BookingAPI] Customer e-mail failed:', customerResult.error)
        }
      }
    } else if (process.env.NODE_ENV === 'production' && !webhookUrl) {
      // Warn in production if nothing is configured, but still accept the request
      console.warn(`[BookingAPI] No notification channel configured. Booking from ${payload.name} not forwarded. Call: ${payload.phone}`)
    }

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('[BookingAPI] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: `Serverfehler. Bitte buchen Sie telefonisch: ${PHONE_DISPLAY}` },
      { status: 500 }
    )
  }
}
