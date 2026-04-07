import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/tracking/validate?t=TOKEN&exp=TIMESTAMP&bid=BOOKING_ID
 * Validates a booking-tied tracking link.
 * 1. HMAC(bookingId:exp, TRACKING_SECRET) must match token
 * 2. exp must be in the future
 * 3. booking.status must be 'accepted' (not picked_up/rejected/completed)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token  = searchParams.get('t')
  const expStr = searchParams.get('exp')
  const bid    = searchParams.get('bid')

  if (!token || !expStr || !bid) {
    return NextResponse.json({ valid: false, reason: 'missing_params' }, { status: 400 })
  }

  const secret = process.env.TRACKING_SECRET
  if (!secret) {
    console.error('[tracking/validate] TRACKING_SECRET not set')
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 })
  }

  const exp = parseInt(expStr, 10)
  if (!isFinite(exp)) {
    return NextResponse.json({ valid: false, reason: 'invalid_exp' }, { status: 400 })
  }

  // Expiry check
  if (Date.now() > exp) {
    return NextResponse.json({ valid: false, reason: 'expired' }, { status: 401 })
  }

  // HMAC verification — token = HMAC(bookingId:exp, secret)
  const expected = createHmac('sha256', secret).update(`${bid}:${expStr}`).digest('hex')
  let hmacValid = false
  try {
    hmacValid = timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    hmacValid = false
  }

  if (!hmacValid) {
    return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 401 })
  }

  // DB check — booking must still be in 'accepted' status
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    // If Supabase not configured, fall back to HMAC-only validation
    console.warn('[tracking/validate] Supabase not configured — skipping status check')
    return NextResponse.json({ valid: true })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bid)
    .single()

  if (error || !data) {
    console.error('[tracking/validate] DB lookup failed:', error?.message)
    return NextResponse.json({ valid: false, reason: 'booking_not_found' }, { status: 401 })
  }

  if (data.status !== 'accepted') {
    return NextResponse.json({ valid: false, reason: 'picked_up' }, { status: 401 })
  }

  return NextResponse.json({ valid: true })
}
