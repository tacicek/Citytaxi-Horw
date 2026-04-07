'use client'

/**
 * /takip — Customer live tracking page.
 * - Supabase Realtime for live driver location
 * - Optional customer GPS → distance + ETA calculation
 * - Browser notification when ETA ≤ 3 minutes
 *
 * Bug fixes applied:
 * - Map load error is isolated from tracking state (they fail independently)
 * - Pending marker queue: first location stored and replayed after map is ready
 * - Notification permission requested early (on "share location" click) not at 3-min mark
 * - Stale data warning when last update > 30 s old
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type DriverLocation } from '@/lib/supabase'
import { loadMapsScript } from '@/lib/maps-loader'
import { haversineDistance, estimateArrival } from '@/lib/distance'
import type { Coordinates } from '@/types/location'

const DRIVER_ID = 'citytaxi-horw-1'
const COMPANY_PHONE = '041 514 44 44'
const COMPANY_PHONE_HREF = 'tel:+41415144444'
const NOTIF_THRESHOLD_MIN = 3
const STALE_THRESHOLD_SEC = 30

const BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`

type TrackingState = 'loading' | 'active' | 'offline' | 'error'

const MAP_STYLE: object[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f0' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
]

export default function TakipPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const customerMarkerRef = useRef<google.maps.Marker | null>(null)

  // Pending location: stored when map is not yet ready
  const pendingDriverPos = useRef<Coordinates | null>(null)

  const [trackState, setTrackState] = useState<TrackingState>('loading')
  const [mapError, setMapError] = useState(false)
  const [driver, setDriver] = useState<DriverLocation | null>(null)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Customer location for ETA
  const [customerCoords, setCustomerCoords] = useState<Coordinates | null>(null)
  const [locationAsked, setLocationAsked] = useState(false)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)

  // 3-min notification: fired once per session
  const notifSentRef = useRef(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatLastSeen = useCallback((updatedAt: string) => {
    const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000)
    if (diff < 10) return 'gerade eben'
    if (diff < 60) return `vor ${diff} Sek.`
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
    return `vor ${Math.floor(diff / 3600)} Std.`
  }, [])

  // Refresh "last seen" label + stale flag every 5 s
  useEffect(() => {
    if (!driver?.updated_at) return
    const refresh = () => {
      setLastSeen(formatLastSeen(driver.updated_at))
      const ageSec = (Date.now() - new Date(driver.updated_at).getTime()) / 1000
      setIsStale(ageSec > STALE_THRESHOLD_SEC)
    }
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [driver?.updated_at, formatLastSeen])

  // ── Browser notification ──────────────────────────────────────────────────

  const sendBrowserNotification = useCallback((min: number) => {
    if (typeof Notification === 'undefined') return
    const send = () =>
      new Notification('🚕 Citytaxi Horw', {
        body: `Ihr Taxi kommt in ca. ${min} Minute${min !== 1 ? 'n' : ''}!`,
        icon: `${BASE_URL}/assets/favicon.ico`,
      })

    if (Notification.permission === 'granted') {
      send()
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => { if (p === 'granted') send() })
    }
  }, [])

  // ── ETA recalculation ─────────────────────────────────────────────────────

  const recalcEta = useCallback(
    (driverPos: Coordinates, customerPos: Coordinates) => {
      const km = Math.round(haversineDistance(driverPos, customerPos) * 10) / 10
      const min = estimateArrival(km)
      setDistanceKm(km)
      setEtaMin(min)

      if (min <= NOTIF_THRESHOLD_MIN && !notifSentRef.current) {
        notifSentRef.current = true
        sendBrowserNotification(min)
      }
    },
    [sendBrowserNotification]
  )

  useEffect(() => {
    if (!driver || !customerCoords) return
    recalcEta({ lat: driver.lat, lng: driver.lng }, customerCoords)
  }, [driver, customerCoords, recalcEta])

  // ── Customer GPS (permission requested early) ─────────────────────────────

  const requestCustomerLocation = useCallback(() => {
    setLocationAsked(true)

    // Request notification permission now (while user is interacting) so it's
    // ready before the 3-min threshold fires
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCustomerCoords(coords)

        const map = googleMapRef.current
        if (!map) return

        if (customerMarkerRef.current) {
          customerMarkerRef.current.setPosition(coords)
        } else {
          customerMarkerRef.current = new google.maps.Marker({
            position: coords,
            map,
            title: 'Ihr Standort',
            zIndex: 10,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
              scale: 9,
            },
          })
        }

        if (driver) {
          recalcEta({ lat: driver.lat, lng: driver.lng }, coords)
        }
      },
      () => { /* permission denied — silently ignore */ },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }, [driver, recalcEta])

  // ── Driver marker (handles pending queue) ─────────────────────────────────

  const updateDriverMarker = useCallback((lat: number, lng: number) => {
    const map = googleMapRef.current
    if (!map) {
      // Map not ready yet — store for replay after init
      pendingDriverPos.current = { lat, lng }
      return
    }
    pendingDriverPos.current = null
    const pos = { lat, lng }
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(pos)
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position: pos,
        map,
        title: 'Citytaxi Horw',
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
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
  }, [])

  // ── Google Map init (isolated from tracking state) ────────────────────────

  useEffect(() => {
    if (!mapRef.current) return
    loadMapsScript()
      .then(() => {
        if (!mapRef.current || googleMapRef.current) return
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.0136, lng: 8.3083 },
          zoom: 14,
          styles: MAP_STYLE as google.maps.MapTypeStyle[],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        googleMapRef.current = map

        // Replay any location that arrived before the map was ready
        if (pendingDriverPos.current) {
          updateDriverMarker(pendingDriverPos.current.lat, pendingDriverPos.current.lng)
        }
      })
      // Map failure is isolated — tracking data still works without the map
      .catch((err: unknown) => {
        console.error('[TaxiMap] Failed to load:', err instanceof Error ? err.message : err)
        setMapError(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supabase data + Realtime ───────────────────────────────────────────────

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', DRIVER_ID)
        .single()

      if (error || !data) { setTrackState('error'); return }

      setDriver(data as DriverLocation)
      setTrackState(data.is_active ? 'active' : 'offline')
      if (data.is_active) updateDriverMarker(data.lat, data.lng)

      channel = supabase
        .channel('driver-location-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${DRIVER_ID}` },
          (payload) => {
            const updated = payload.new as DriverLocation
            setDriver(updated)
            setIsStale(false)
            setTrackState(updated.is_active ? 'active' : 'offline')
            if (updated.is_active) {
              updateDriverMarker(updated.lat, updated.lng)
            } else if (driverMarkerRef.current) {
              driverMarkerRef.current.setMap(null)
              driverMarkerRef.current = null
            }
          }
        )
        .subscribe((_, err) => { if (err) console.error('[Takip] Realtime:', err) })
    }

    init().catch((err: unknown) => {
      console.error('[Takip] init:', err instanceof Error ? err.message : String(err))
      setTrackState('error')
    })

    return () => { channel?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── ETA display helpers ────────────────────────────────────────────────────

  const etaIsUrgent = etaMin !== null && etaMin <= NOTIF_THRESHOLD_MIN
  const etaLabel =
    etaMin === null ? null
    : etaMin < 1    ? 'gleich hier'
    : `ca. ${etaMin} Min.`

  // ── JSX ───────────────────────────────────────────────────────────────────

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
          <div className={`takip-badge${trackState === 'active' ? ' takip-badge--active' : ''}`}>
            {trackState === 'loading' && '⏳ Verbinde…'}
            {trackState === 'active' && '● Online'}
            {trackState === 'offline' && '○ Offline'}
            {trackState === 'error' && '⚠ Fehler'}
          </div>
        </div>

        {/* 3-min urgency banner */}
        {etaIsUrgent && (
          <div className="takip-urgency" role="alert">
            🚨 Ihr Taxi kommt gleich! Bitte seien Sie bereit.
          </div>
        )}

        {/* Stale data warning */}
        {isStale && trackState === 'active' && (
          <div className="takip-stale" role="status">
            ⚠ Standort wird nicht aktualisiert — möglicherweise keine Verbindung
          </div>
        )}

        {/* Map */}
        <div className="takip-map-wrap">
          <div ref={mapRef} className={`takip-map${mapError ? ' takip-map--hidden' : ''}`} />

          {mapError && (
            <div className="takip-map-placeholder">
              <span>🗺</span>
              <p>Karte konnte nicht geladen werden</p>
              <small>Standortdaten werden trotzdem empfangen</small>
            </div>
          )}

          {trackState === 'loading' && !mapError && (
            <div className="takip-map-overlay">
              <div className="takip-spinner" />
              <span>Verbinde…</span>
            </div>
          )}
          {trackState === 'offline' && (
            <div className="takip-map-overlay takip-map-overlay--offline">
              <span className="takip-offline-icon">🚕</span>
              <strong>Fahrer ist gerade offline</strong>
              <p>Ihr Taxi ist noch nicht unterwegs. Bitte warten Sie.</p>
            </div>
          )}
        </div>

        {/* ETA card */}
        {trackState === 'active' && customerCoords && distanceKm !== null && etaLabel && (
          <div className={`takip-eta${etaIsUrgent ? ' takip-eta--urgent' : ''}`}>
            <div className="takip-eta-item">
              <span className="takip-eta-val">{distanceKm} km</span>
              <span className="takip-eta-lbl">Entfernung</span>
            </div>
            <div className="takip-eta-divider" />
            <div className="takip-eta-item">
              <span className={`takip-eta-val${etaIsUrgent ? ' takip-eta-val--urgent' : ''}`}>{etaLabel}</span>
              <span className="takip-eta-lbl">Ankunft (ca.)</span>
            </div>
          </div>
        )}

        {/* Location share button */}
        {trackState === 'active' && !customerCoords && !locationAsked && (
          <div className="takip-location-ask">
            <button type="button" className="btn btn-outline takip-location-btn" onClick={requestCustomerLocation}>
              📍 Meine Position teilen — Ankunftszeit berechnen
            </button>
          </div>
        )}

        {/* Info bar */}
        <div className="takip-info">
          {trackState === 'active' && driver && (
            <>
              <div className="takip-stat">
                <strong className={isStale ? 'takip-stat-stale' : ''}>{lastSeen ?? '—'}</strong>
                <small>Letzte Aktualisierung</small>
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
          {trackState === 'offline' && (
            <p className="takip-offline-text">
              Das Fahrzeug ist noch nicht aktiv. Die Seite aktualisiert sich automatisch sobald der Fahrer online ist.
            </p>
          )}
          {trackState === 'error' && (
            <p className="takip-offline-text">
              Verbindungsfehler. Bitte rufen Sie uns direkt an: <a href={COMPANY_PHONE_HREF}>{COMPANY_PHONE}</a>
            </p>
          )}
        </div>

        {/* Footer */}
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
        .takip-badge--active { background: rgba(26,140,60,0.2); color: #6ee08b; }

        .takip-urgency {
          background: #c00;
          color: #fff;
          text-align: center;
          font-weight: 700;
          font-size: var(--text-sm);
          padding: 1rem 2rem;
          animation: urgency-pulse 1s ease-in-out infinite alternate;
        }
        @keyframes urgency-pulse {
          from { background: #c00; }
          to   { background: #e60000; }
        }

        .takip-stale {
          background: #7a5a1a;
          color: #fff8ec;
          font-size: var(--text-xs);
          font-weight: 600;
          text-align: center;
          padding: 0.6rem 2rem;
        }

        .takip-map-wrap {
          position: relative;
          flex: 1;
          min-height: 45vh;
        }
        .takip-map { width: 100%; height: 100%; min-height: 45vh; }
        .takip-map--hidden { display: none; }
        .takip-map-placeholder {
          width: 100%;
          min-height: 45vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          background: var(--bg-alt);
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
        }
        .takip-map-placeholder span { font-size: 4rem; }
        .takip-map-placeholder p { margin: 0; font-size: var(--text-sm); color: var(--text-muted); }
        .takip-map-placeholder small { font-size: var(--text-xs); color: var(--text-light); }
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
          width: 4rem; height: 4rem;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: tk-spin 0.8s linear infinite;
        }
        .takip-map-overlay span { font-size: var(--text-sm); color: var(--text-muted); }
        @keyframes tk-spin { to { transform: rotate(360deg); } }

        .takip-eta {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.8rem 2.4rem;
          background: var(--primary);
          border-top: 3px solid var(--accent);
        }
        .takip-eta--urgent {
          background: #1a3a1a;
          border-color: #1a8c3c;
          animation: eta-flash 1.5s ease-in-out infinite alternate;
        }
        @keyframes eta-flash {
          from { border-color: #1a8c3c; }
          to   { border-color: #6ee08b; }
        }
        .takip-eta-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          flex: 1;
        }
        .takip-eta-val {
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
          font-family: var(--font-heading);
        }
        .takip-eta-val--urgent { color: #6ee08b; }
        .takip-eta-lbl {
          font-size: var(--text-xs);
          color: var(--secondary-dark);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .takip-eta-divider {
          width: 1px; height: 4rem;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .takip-location-ask {
          padding: 1.2rem 2rem;
          background: var(--bg-alt);
          border-top: 1px solid var(--border);
        }
        .takip-location-btn { width: 100%; justify-content: center; font-size: var(--text-sm); }

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
        .takip-stat-stale { color: #7a5a1a !important; }
        .takip-stat small { font-size: var(--text-xs); color: var(--text-light); }
        .takip-stat--coords { display: none; }
        .takip-offline-text { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }
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
          .takip-eta-val { font-size: 3.6rem; }
        }
      `}</style>
    </>
  )
}
