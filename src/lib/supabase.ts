import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY eksik.')
}

/** Browser / client-side Supabase client (uses anon key) */
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')

/** Type for the driver_locations table row */
export type DriverLocation = {
  id: string
  driver_id: string
  lat: number
  lng: number
  is_active: boolean
  heading: number | null
  speed: number | null
  updated_at: string
}
