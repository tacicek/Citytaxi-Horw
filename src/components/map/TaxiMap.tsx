'use client'

import { useEffect, useRef } from 'react'
import { loadMapsScript } from '@/lib/maps-loader'
import type { Coordinates, NearbyDriver } from '@/types/location'

/** Minimal clean map style — no POI clutter, no transit layer */
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ebebeb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d4d4d4' }] },
]

type Props = {
  userLocation: Coordinates
  drivers?: NearbyDriver[]
  className?: string
}

/**
 * Google Maps component using the native JS API (no @react-google-maps/api).
 * Renders user location as blue dot and nearby drivers as gold markers.
 * Fits bounds to show all markers automatically.
 */
export default function TaxiMap({ userLocation, drivers = [], className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadMapsScript()
      .then(() => {
        if (cancelled || !containerRef.current) return

        const map = new google.maps.Map(containerRef.current, {
          center: userLocation,
          zoom: 13,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        })
        mapRef.current = map
      })
      .catch((err: unknown) => {
        console.error('[TaxiMap]', err instanceof Error ? err.message : err)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — map initialises once

  // Update markers whenever location or drivers change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const bounds = new google.maps.LatLngBounds()

    // User location — blue pulsing dot
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map,
      title: 'Ihr Standort',
      zIndex: 10,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 10,
      },
    })
    markersRef.current.push(userMarker)
    bounds.extend(userLocation)

    // Driver markers — gold taxi icon
    drivers.forEach((driver) => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:system-ui,sans-serif;padding:4px 2px;">
            <strong style="color:#0a0a0a;">${driver.name}</strong><br/>
            <span style="color:#555;font-size:13px;">~${driver.distanceKm} km · ${driver.estimatedArrivalMin} Min.</span><br/>
            <span style="font-size:12px;color:${driver.isAvailable ? '#1a8c3c' : '#888'};">
              ${driver.isAvailable ? '✓ Verfügbar' : '✗ Besetzt'}
            </span>
          </div>`,
      })

      const marker = new google.maps.Marker({
        position: driver.coordinates,
        map,
        title: driver.name,
        zIndex: driver.isAvailable ? 5 : 1,
        icon: {
          path: 'M -1,-1.5 L 1,-1.5 L 1.5,0 L 0.8,1.5 L -0.8,1.5 L -1.5,0 Z',
          fillColor: driver.isAvailable ? '#C8A96E' : '#aaaaaa',
          fillOpacity: 1,
          strokeColor: '#0a0a0a',
          strokeWeight: 1.5,
          scale: 10,
        },
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      markersRef.current.push(marker)
      bounds.extend(driver.coordinates)
    })

    // Fit all markers in view
    if (drivers.length > 0) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 })
    } else {
      map.setCenter(userLocation)
      map.setZoom(15)
    }
  }, [userLocation, drivers])

  return (
    <>
      <div ref={containerRef} className={`taxi-map${className ? ` ${className}` : ''}`} aria-label="Karte mit Ihrem Standort und verfügbaren Taxis" />
      <style jsx>{`
        .taxi-map {
          width: 100%;
          height: 46rem;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }
        @media (max-width: 600px) {
          .taxi-map { height: 32rem; border-radius: var(--radius-lg); }
        }
      `}</style>
    </>
  )
}
