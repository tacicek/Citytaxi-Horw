'use client'

/**
 * /takip — Customer live tracking page.
 * Subscribes to Supabase Realtime for live driver location updates.
 * Shows driver on Google Maps with auto-centering.
 */

import { useEffect, useRef, useState } from 'react'
import { supabase, type DriverLocation } from '@/lib/supabase'
import { loadMapsScript } from '@/lib/maps-loader'

const DRIVER_ID = 'citytaxi-horw-1'
const COMPANY_PHONE = '041 514 44 44'
const COMPANY_PHONE_HREF = 'tel:+41415144444'

type TrackingState = 'loading' | 'active' | 'offline' | 'error'

/** Minimal clean map style */
const MAP_STYLE: object[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
]

export default function TakipPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  const [state, setState] = useState<TrackingState>('loading')
  const [driver, setDriver] = useState<DriverLocation | null>(null)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  // Format "last updated X seconds ago"
  const formatLastSeen = (updatedAt: string) => {
    const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000)
    if (diff < 10) return 'gerade eben'
    if (diff < 60) return `vor ${diff} Sek.`
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
    return `vor ${Math.floor(diff / 3600)} Std.`
  }

  // Update last-seen label every 5s
  useEffect(() => {
    if (!driver?.updated_at) return
    const t = setInterval(() => setLastSeen(formatLastSeen(driver.updated_at)), 5000)
    setLastSeen(formatLastSeen(driver.updated_at))
    return () => clearInterval(t)
  }, [driver?.updated_at])

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return
    loadMapsScript()
      .then(() => {
        if (!mapRef.current || googleMapRef.current) return
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 47.0136, lng: 8.3083 },
          zoom: 14,
          styles: MAP_STYLE as google.maps.MapTypeStyle[],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
      })
      .catch(() => setState('error'))
  }, [])

  // Update marker position
  const updateMarker = (lat: number, lng: number) => {
    const map = googleMapRef.current
    if (!map) return
    const pos = { lat, lng }
    if (markerRef.current) {
      markerRef.current.setPosition(pos)
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map,
        title: 'Citytaxi Horw',
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="#C8A96E" stroke="#0A0A0A" stroke-width="2"/>
              <text x="24" y="31" text-anchor="middle" font-size="22">🚕</text>
            </svg>`),
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 24),
        },
      })
    }
    map.panTo(pos)
  }

  // Fetch initial driver data + subscribe to Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', DRIVER_ID)
        .single()

      if (error || !data) {
        setState('error')
        return
      }

      setDriver(data as DriverLocation)
      setState(data.is_active ? 'active' : 'offline')

      if (data.is_active) {
        updateMarker(data.lat, data.lng)
      }

      // Subscribe to realtime changes
      channel = supabase
        .channel('driver-location-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'driver_locations',
            filter: `driver_id=eq.${DRIVER_ID}`,
          },
          (payload) => {
            const updated = payload.new as DriverLocation
            setDriver(updated)
            setState(updated.is_active ? 'active' : 'offline')
            if (updated.is_active) {
              updateMarker(updated.lat, updated.lng)
            } else if (markerRef.current) {
              markerRef.current.setMap(null)
              markerRef.current = null
            }
          }
        )
        .subscribe()
    }

    init()

    return () => {
      channel?.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="takip-page">
        {/* Header */}
        <div className="takip-header">
          <span className="takip-logo">🚕</span>
          <div>
            <h1>Citytaxi Horw</h1>
            <p>Live-Standort</p>
          </div>
          <div className={`takip-badge${state === 'active' ? ' takip-badge--active' : ''}`}>
            {state === 'loading' && '⏳ Verbinde…'}
            {state === 'active' && '● Online'}
            {state === 'offline' && '○ Offline'}
            {state === 'error' && '⚠ Fehler'}
          </div>
        </div>

        {/* Map */}
        <div className="takip-map-wrap">
          <div ref={mapRef} className="takip-map" />
          {state === 'loading' && (
            <div className="takip-map-overlay">
              <div className="takip-spinner" />
              <span>Karte wird geladen…</span>
            </div>
          )}
          {state === 'offline' && (
            <div className="takip-map-overlay takip-map-overlay--offline">
              <span className="takip-offline-icon">🚕</span>
              <strong>Fahrer ist gerade offline</strong>
              <p>Ihr Taxi ist noch nicht unterwegs. Bitte warten Sie.</p>
            </div>
          )}
        </div>

        {/* Info bar */}
        <div className="takip-info">
          {state === 'active' && driver && (
            <>
              <div className="takip-stat">
                <strong>Unterwegs</strong>
                <small>{lastSeen ?? '—'}</small>
              </div>
              {driver.speed !== null && (
                <div className="takip-stat">
                  <strong>{Math.round((driver.speed ?? 0) * 3.6)} km/h</strong>
                  <small>Geschwindigkeit</small>
                </div>
              )}
              <div className="takip-stat takip-stat--coords">
                <strong>{driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</strong>
                <small>Koordinaten</small>
              </div>
            </>
          )}
          {state === 'offline' && (
            <p className="takip-offline-text">
              Das Fahrzeug ist noch nicht aktiv. Die Seite aktualisiert sich automatisch sobald der Fahrer online ist.
            </p>
          )}
          {state === 'error' && (
            <p className="takip-offline-text">
              Verbindungsfehler. Bitte rufen Sie uns direkt an: <a href={COMPANY_PHONE_HREF}>{COMPANY_PHONE}</a>
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="takip-footer">
          <a href={COMPANY_PHONE_HREF} className="btn btn-primary takip-call-btn">
            📞 {COMPANY_PHONE} anrufen
          </a>
          <a href="/booking" className="btn btn-outline">
            Neue Buchung
          </a>
        </div>
      </div>

      <style jsx>{`
        .takip-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg-alt);
        }

        .takip-header {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.6rem 2rem;
          background: var(--primary);
          color: var(--white);
        }
        .takip-logo { font-size: 3.2rem; flex-shrink: 0; }
        .takip-header h1 {
          font-family: var(--font-heading);
          font-size: var(--text-lg);
          color: var(--accent);
          margin: 0;
        }
        .takip-header p { margin: 0; font-size: var(--text-xs); color: var(--secondary-dark); }
        .takip-badge {
          margin-left: auto;
          font-size: var(--text-xs);
          font-weight: 600;
          padding: 0.4rem 1rem;
          border-radius: var(--radius-pill);
          background: rgba(255,255,255,0.1);
          color: var(--secondary-dark);
          white-space: nowrap;
        }
        .takip-badge--active {
          background: rgba(26,140,60,0.2);
          color: #6ee08b;
        }

        .takip-map-wrap {
          position: relative;
          flex: 1;
          min-height: 50vh;
        }
        .takip-map { width: 100%; height: 100%; min-height: 50vh; }
        .takip-map-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          text-align: center;
          padding: 2.4rem;
        }
        .takip-map-overlay--offline { background: rgba(248,248,248,0.95); }
        .takip-offline-icon { font-size: 4rem; }
        .takip-map-overlay strong { font-size: var(--text-base); color: var(--primary); }
        .takip-map-overlay p { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }

        .takip-spinner {
          width: 4rem;
          height: 4rem;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: tk-spin 0.8s linear infinite;
        }
        .takip-map-overlay span { font-size: var(--text-sm); color: var(--text-muted); }
        @keyframes tk-spin { to { transform: rotate(360deg); } }

        .takip-info {
          display: flex;
          gap: 2rem;
          padding: 1.6rem 2rem;
          background: var(--white);
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .takip-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .takip-stat strong { font-size: var(--text-sm); font-weight: 700; color: var(--primary); }
        .takip-stat small { font-size: var(--text-xs); color: var(--text-light); }
        .takip-stat--coords { display: none; }
        .takip-offline-text {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
        }
        .takip-offline-text a { color: var(--accent); font-weight: 600; }

        .takip-footer {
          display: flex;
          gap: 1.2rem;
          padding: 1.6rem 2rem;
          background: var(--white);
          border-top: 1px solid var(--border);
        }
        .takip-call-btn { flex: 1; justify-content: center; }

        @media (min-width: 600px) {
          .takip-stat--coords { display: flex; }
        }
      `}</style>
    </>
  )
}
