import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/booking/pickup
 * Body: { bookingId: string }
 * Authorization: Bearer <supabase_access_token>
 *
 * Marks a booking as picked_up. This immediately invalidates the customer's
 * tracking link (validate endpoint checks booking.status === 'accepted').
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Server nicht konfiguriert.' }, { status: 500 })
  }

  // Verify driver identity via Supabase JWT
  const authHeader = req.headers.get('Authorization') ?? ''
  const accessToken = authHeader.replace(/^Bearer\s+/i, '')
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: 'Kein Token.' }, { status: 401 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Nicht autorisiert.' }, { status: 401 })
  }

  // Parse body
  let bookingId: string | undefined
  try {
    const body = await req.json() as { bookingId?: string }
    bookingId = body.bookingId
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!bookingId) {
    return NextResponse.json({ ok: false, error: 'bookingId fehlt.' }, { status: 400 })
  }

  // Update booking status to picked_up
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('status', 'accepted') // guard: only accepted bookings can be picked up

  if (updateError) {
    console.error('[BookingPickup] Update error:', updateError.message)
    return NextResponse.json({ ok: false, error: 'Datenbankfehler.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
