/**
 * Shared Google Maps JS API script loader.
 * Loads once per page; subsequent calls return the same promise.
 * Used by AddressAutocompleteField and TaxiMap.
 */

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

let mapsScriptPromise: Promise<void> | null = null

export function loadMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps?.places) return Promise.resolve()
  if (!apiKey) return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY fehlt'))
  if (mapsScriptPromise) return mapsScriptPromise

  mapsScriptPromise = new Promise((resolve, reject) => {
    let settled = false

    const ok = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const fail = (msg: string) => {
      if (settled) return
      settled = true
      mapsScriptPromise = null
      reject(new Error(msg))
    }

    const pollPlaces = () => {
      const t = window.setInterval(() => {
        if (window.google?.maps?.places) {
          window.clearInterval(t)
          ok()
        }
      }, 50)
      window.setTimeout(() => {
        window.clearInterval(t)
        if (!settled) fail('Google Maps API timeout — Prüfen Sie die API-Key-Einschränkungen.')
      }, 20000)
    }

    const existing = document.querySelector('script[data-google-maps="1"]')
    if (existing) {
      if (window.google?.maps?.places) ok()
      else pollPlaces()
      return
    }

    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`
    s.async = true
    s.dataset.googleMaps = '1'
    s.onload = () => pollPlaces()
    s.onerror = () => fail('Google Maps Skript konnte nicht geladen werden.')
    document.head.appendChild(s)
  })

  return mapsScriptPromise
}

export { apiKey as googleMapsApiKey }
