import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DRIVER_ID = 'citytaxi-horw-1'

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180
  )
}

/** POST /api/driver/location — Updates driver GPS position.
 *  Requires Authorization: Bearer <DRIVER_SECRET_TOKEN> header.
 *  Uses service_role key server-side to bypass RLS.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.DRIVER_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { lat: unknown; lng: unknown; heading?: unknown; speed?: unknown; is_active?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { lat, lng, heading, speed, is_active = true } = body

  if (!isValidCoord(lat, lng)) {
    return NextResponse.json(
      { error: 'lat (−90…90) und lng (−180…180) sind erforderlich.' },
      { status: 400 }
    )
  }

  // Optional fields: heading 0-360, speed ≥ 0
  const safeHeading =
    typeof heading === 'number' && isFinite(heading) ? heading : null
  const safeSpeed =
    typeof speed === 'number' && isFinite(speed) && speed >= 0 ? speed : null
  const safeActive = is_active !== false && is_active !== 'false'

  const supabase = makeSupabase()

  const { error, data: updatedRows } = await supabase
    .from('driver_locations')
    .update({
      lat: lat as number,
      lng: lng as number,
      heading: safeHeading,
      speed: safeSpeed,
      is_active: safeActive,
      updated_at: new Date().toISOString(),
    })
    .eq('driver_id', DRIVER_ID)
    .select('id')

  if (error) {
    console.error('[Driver API] POST error:', error)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  // No rows updated means the seed row doesn't exist — shouldn't happen after migration
  if (!updatedRows || updatedRows.length === 0) {
    console.warn('[Driver API] No row updated for driver_id:', DRIVER_ID)
  }

  return NextResponse.json({ ok: true })
}

/** DELETE /api/driver/location — Sets driver offline */
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.DRIVER_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = makeSupabase()

  const { error } = await supabase
    .from('driver_locations')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('driver_id', DRIVER_ID)

  if (error) {
    console.error('[Driver API] DELETE error:', error)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
