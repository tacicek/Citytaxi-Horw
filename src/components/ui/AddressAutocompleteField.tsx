'use client'

import { useEffect, useRef } from 'react'
import { loadMapsScript, googleMapsApiKey as apiKey } from '@/lib/maps-loader'

type Props = {
  id: string
  name: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  /** Called when user selects an address from the dropdown. Receives the final address string. */
  onPlaceSelect?: (address: string) => void
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
  onPlaceSelect,
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
            if (!inputRef.current) return
            const place = ac?.getPlace()

            // Google Autocomplete already fills the input with the selected text.
            // Only override if formatted_address contains real address detail (has comma).
            // Avoids overwriting with country-only strings like "Switzerland".
            const formatted = place?.formatted_address ?? ''
            const placeName = place?.name ?? ''
            const current = inputRef.current.value

            let finalAddress = current
            if (formatted.includes(',')) {
              finalAddress = formatted
              inputRef.current.value = formatted
            } else if (placeName.length > 3 && placeName !== 'Switzerland' && placeName !== 'Liechtenstein') {
              finalAddress = placeName
              inputRef.current.value = placeName
            }

            // Notify parent so it can trigger distance estimation
            if (onPlaceSelect && finalAddress) {
              onPlaceSelect(finalAddress)
            }
          } catch {
            /* prevent Google API errors from breaking the React tree */
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
