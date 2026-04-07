'use client'

import { useEffect, useRef } from 'react'

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

let mapsScriptPromise: Promise<void> | null = null

function loadMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps?.places) return Promise.resolve()
  if (!apiKey) return Promise.reject(new Error('No Google Maps API key'))
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
        if (!settled) fail('Maps API timeout')
      }, 20000)
    }

    const existing = document.querySelector('script[data-google-maps="1"]')
    if (existing) {
      if (window.google?.maps?.places) ok()
      else pollPlaces()
      return
    }

    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&v=weekly`
    s.async = true
    s.dataset.googleMaps = '1'
    s.onload = () => pollPlaces()
    s.onerror = () => fail('Maps script failed')
    document.head.appendChild(s)
  })
  return mapsScriptPromise
}

type Props = {
  id: string
  name: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
}

/**
 * Google Places Autocomplete when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set; otherwise a normal text input.
 * Restrict the key in Google Cloud (HTTP referrers + Places API / Maps JavaScript API only).
 */
export default function AddressAutocompleteField({
  id,
  name,
  required,
  placeholder,
  autoComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[AddressAutocomplete] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY fehlt — Adressvorschläge deaktiviert.'
        )
      }
      return
    }
    if (!inputRef.current) return

    let cancelled = false
    let ac: google.maps.places.Autocomplete | null = null

    loadMapsScript()
      .then(() => {
        if (cancelled || !inputRef.current) return
        // Kein types: ['address'] — in CH oft zu wenig Treffer während der Eingabe
        ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: ['ch', 'li'] },
          fields: ['formatted_address', 'name', 'geometry'],
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(46.9, 7.9),
            new google.maps.LatLng(47.2, 8.6)
          ),
          strictBounds: false,
        })
        ac.addListener('place_changed', () => {
          try {
            const place = ac?.getPlace()
            const addr = place?.formatted_address || place?.name
            if (addr && inputRef.current) inputRef.current.value = addr
          } catch {
            /* Google API darf nie den React-Tree mit werfen */
          }
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[AddressAutocomplete] Google Maps konnte nicht geladen werden:',
            err instanceof Error ? err.message : err,
            '| Prüfen: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local, Dev-Server neu starten, in Google Cloud: Maps JavaScript API + Places API aktiv, HTTP-Referrer http://localhost:3000/* und http://127.0.0.1:3000/*'
          )
        }
      })

    return () => {
      cancelled = true
      try {
        if (ac && typeof google !== 'undefined') {
          google.maps.event.clearInstanceListeners(ac)
        }
      } catch {
        /* ignore */
      }
    }
  }, [])

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      required={required}
      placeholder={placeholder}
      autoComplete={apiKey ? 'off' : autoComplete}
    />
  )
}
