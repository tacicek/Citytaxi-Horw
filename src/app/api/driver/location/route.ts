import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DRIVER_ID = 'citytaxi-horw-1'

/** POST /api/driver/location — Updates driver GPS position.
 *  Requires Authorization: Bearer <DRIVER_SECRET_TOKEN> header.
 *  Uses service_role key server-side to bypass RLS.
 */
export async function POST(req: NextRequest) {
  // Validate driver token
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.DRIVER_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { lat: number; lng: number; heading?: number; speed?: number; is_active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { lat, lng, heading, speed, is_active = true } = body

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat und lng sind erforderlich' }, { status: 400 })
  }

  // Use service_role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { error } = await supabase
    .from('driver_locations')
    .update({ lat, lng, heading: heading ?? null, speed: speed ?? null, is_active, updated_at: new Date().toISOString() })
    .eq('driver_id', DRIVER_ID)

  if (error) {
    console.error('[Driver API]', error)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  await supabase
    .from('driver_locations')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('driver_id', DRIVER_ID)

  return NextResponse.json({ ok: true })
}
