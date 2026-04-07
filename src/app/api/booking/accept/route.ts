import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { BookingPayload } from '@/lib/booking-notifications'
import {
  notifyBookingCustomerTracking,
  notifyBookingDispatch,
} from '@/lib/booking-notifications'

const SITE_BASE_URL = `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`

function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * GET /api/booking/accept?id=BOOKING_ID&t=DRIVER_TOKEN[&action=reject]
 * Called when the driver clicks Annehmen or Ablehnen in the notification email.
 * Validates token, updates booking status, sends tracking email to customer if accepted.
 * Redirects driver to /fahrer on completion.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const bookingId = searchParams.get('id')
  const token     = searchParams.get('t')
  const action    = searchParams.get('action') ?? 'accept'

  // Token validation
  const expectedToken = process.env.DRIVER_SECRET_TOKEN
  if (!expectedToken || !token || token !== expectedToken) {
    return new NextResponse('Kein Zugang.', { status: 401 })
  }

  if (!bookingId) {
    return new NextResponse('Buchungs-ID fehlt.', { status: 400 })
  }

  const supabase = makeSupabase()
  if (!supabase) {
    return new NextResponse('Datenbank nicht konfiguriert.', { status: 500 })
  }

  // Fetch booking
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    console.error('[BookingAccept] Booking not found:', bookingId, fetchError?.message)
    return new NextResponse('Buchung nicht gefunden.', { status: 404 })
  }

  const newStatus = action === 'reject' ? 'rejected' : 'accepted'

  // Guard: already processed
  if (booking.status !== 'pending') {
    const msg = booking.status === 'accepted'
      ? 'Diese Fahrt wurde bereits bestätigt.'
      : 'Diese Fahrt wurde bereits abgelehnt.'
    return redirectToFahrer(`${msg} Weiterleitung zur Fahrer-Seite…`)
  }

  // Update status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[BookingAccept] Update error:', updateError.message)
    return new NextResponse('Datenbankfehler beim Aktualisieren.', { status: 500 })
  }

  // Rebuild BookingPayload from DB row
  const payload: BookingPayload = {
    pickup:       booking.pickup,
    destination:  booking.destination,
    date:         booking.date,
    time:         booking.time,
    passengers:   booking.passengers,
    service:      booking.service,
    returnTrip:   booking.return_trip ?? false,
    name:         booking.name,
    phone:        booking.phone,
    email:        booking.email ?? undefined,
    flightNumber: booking.flight_number ?? undefined,
    luggage:      booking.luggage ?? undefined,
    notes:        booking.notes ?? undefined,
    receivedAt:   booking.received_at,
  }

  if (newStatus === 'accepted') {
    // Send tracking email to customer (token is tied to this bookingId)
    if (payload.email) {
      const result = await notifyBookingCustomerTracking(payload, bookingId)
      if (!result.ok) {
        console.error('[BookingAccept] Tracking e-mail failed:', result.error)
      }
    }

    // Send updated dispatch notification to driver (so email thread is complete)
    const dispatchTo = process.env.BOOKING_EMAIL_DISPATCH?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    if (dispatchTo.length > 0) {
      // Re-use dispatch builder; "Annehmen" already clicked, just inform
      void notifyBookingDispatch(
        { ...payload, notes: `[BESTÄTIGT] ${payload.notes ?? ''}`.trim() },
        bookingId
      )
    }

    return redirectToFahrer('Fahrt bestätigt. Tracking-Link wurde an den Kunden gesendet.')
  } else {
    // rejected — optionally notify customer (no tracking link)
    return redirectToFahrer('Fahrt abgelehnt.')
  }
}

function redirectToFahrer(message: string) {
  const url = new URL('/fahrer', SITE_BASE_URL)
  url.searchParams.set('msg', message)
  return NextResponse.redirect(url.toString())
}
