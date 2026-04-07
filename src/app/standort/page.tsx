'use client'

/**
 * /standort — Customer GPS location page.
 * Shows the user's location on a map and lists nearby available taxis.
 * HTTPS required on iOS Safari for Geolocation API.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useGeolocation } from '@/hooks/useGeolocation'
import LocationPermission from '@/components/location/LocationPermission'
import { MOCK_DRIVERS } from '@/lib/mock-drivers'
import { haversineDistance, estimateArrival, sortByDistance } from '@/lib/distance'
import type { NearbyDriver } from '@/types/location'

// Dynamically import the map to avoid SSR issues
const TaxiMap = dynamic(() => import('@/components/map/TaxiMap'), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
})

export default function StandortPage() {
  const {
    coordinates,
    accuracy,
    error,
    isLoading,
    permissionStatus,
    requestLocation,
  } = useGeolocation()

  const [showDebug, setShowDebug] = useState(false)

  // Auto-request location if permission is already granted
  useEffect(() => {
    if (permissionStatus === 'granted' && !coordinates) {
      requestLocation()
    }
  }, [permissionStatus, coordinates, requestLocation])

  // Compute drivers sorted by distance from user
  const nearbyDrivers = useMemo<NearbyDriver[]>(() => {
    if (!coordinates) return []
    return sortByDistance(coordinates, MOCK_DRIVERS).map((d) => {
      const km = Math.round(haversineDistance(coordinates, d.coordinates) * 10) / 10
      return { ...d, distanceKm: km, estimatedArrivalMin: estimateArrival(km) }
    })
  }, [coordinates])

  const availableDrivers = nearbyDrivers.filter((d) => d.isAvailable)

  const handleFindNearestTaxi = useCallback(() => {
    if (!coordinates) return
    // TODO: connect to real dispatch API
    console.log('[StandortPage] Suche nächstes Taxi bei:', coordinates)
    console.log('[StandortPage] Nächster verfügbarer Fahrer:', availableDrivers[0] ?? 'keiner')
    if (availableDrivers[0]) {
      alert(
        `Nächstes Taxi: ${availableDrivers[0].name}\n` +
        `Entfernung: ${availableDrivers[0].distanceKm} km\n` +
        `Ankunft: ca. ${availableDrivers[0].estimatedArrivalMin} Minuten`
      )
    }
  }, [coordinates, availableDrivers])

  const showMap = Boolean(coordinates)
  const showPermissionScreen = !coordinates && !isLoading

  return (
    <>
      <section className="standort-hero section-dark">
        <div className="container standort-hero__inner">
          <span className="section-label">Live-Standort</span>
          <h1>Taxi in Ihrer Nähe</h1>
          <p className="standort-hero__sub">
            Teilen Sie Ihren Standort und finden Sie das nächste verfügbare Citytaxi Horw.
          </p>
        </div>
      </section>

      <section className="standort-body section-y">
        <div className="container">
          {showPermissionScreen && (
            <LocationPermission
              status={permissionStatus}
              isLoading={isLoading}
              onRequest={requestLocation}
            />
          )}

          {isLoading && !coordinates && (
            <div className="standort-loading">
              <div className="standort-spinner" aria-hidden="true" />
              <p>Standort wird ermittelt…</p>
            </div>
          )}

          {error && (
            <div className="standort-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {showMap && coordinates && (
            <div className="standort-content">
              {/* Map */}
              <TaxiMap userLocation={coordinates} drivers={nearbyDrivers} />

              {/* Info bar */}
              <div className="standort-info-bar">
                <div className="standort-stat">
                  <strong>{availableDrivers.length}</strong>
                  <small>Fahrzeuge verfügbar</small>
                </div>
                {availableDrivers[0] && (
                  <div className="standort-stat">
                    <strong>ca. {availableDrivers[0].estimatedArrivalMin} Min.</strong>
                    <small>Nächstes Taxi</small>
                  </div>
                )}
                {accuracy !== null && (
                  <div className="standort-stat">
                    <strong>±{Math.round(accuracy)} m</strong>
                    <small>GPS-Genauigkeit</small>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="standort-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFindNearestTaxi}
                  disabled={availableDrivers.length === 0}
                >
                  🚕 En Yakın Taksiyi Bul
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={requestLocation}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Wird aktualisiert…' : '🔄 Konumumu Güncelle'}
                </button>
              </div>

              {/* Driver list */}
              {nearbyDrivers.length > 0 && (
                <ul className="standort-drivers">
                  {nearbyDrivers.map((d) => (
                    <li key={d.id} className={`standort-driver${d.isAvailable ? '' : ' standort-driver--busy'}`}>
                      <span className="standort-driver__icon" aria-hidden="true">🚕</span>
                      <div className="standort-driver__info">
                        <strong>{d.name}</strong>
                        <span>{d.distanceKm} km · ca. {d.estimatedArrivalMin} Min.</span>
                      </div>
                      <span className={`standort-driver__status${d.isAvailable ? '' : ' standort-driver__status--busy'}`}>
                        {d.isAvailable ? 'Verfügbar' : 'Besetzt'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Debug info */}
              <button
                type="button"
                className="standort-debug-toggle"
                onClick={() => setShowDebug((v) => !v)}
              >
                {showDebug ? '▲ Debug ausblenden' : '▼ Debug anzeigen'}
              </button>
              {showDebug && (
                <pre className="standort-debug">
                  {JSON.stringify({ coordinates, accuracy }, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .standort-hero {
          padding-top: calc(var(--nav-height) + var(--section-y-md));
          padding-bottom: var(--section-y-md);
        }
        .standort-hero__inner { text-align: center; }
        .standort-hero__sub {
          font-size: var(--text-lg);
          color: var(--secondary-dark);
          margin-top: 1.6rem;
        }

        .standort-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6rem;
          padding: 6rem 0;
          color: var(--text-muted);
          font-size: var(--text-base);
        }
        .standort-spinner {
          width: 4.8rem;
          height: 4.8rem;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: st-spin 0.8s linear infinite;
        }
        @keyframes st-spin { to { transform: rotate(360deg); } }

        .standort-error {
          padding: 1.6rem 2rem;
          background: rgba(180,40,40,0.07);
          border: 1px solid rgba(180,40,40,0.2);
          border-radius: var(--radius-md);
          color: #7a1a1a;
          font-size: var(--text-sm);
          margin-bottom: 2.4rem;
        }

        .standort-content {
          display: flex;
          flex-direction: column;
          gap: 2.4rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        /* Skeleton shown while TaxiMap loads */
        :global(.map-skeleton) {
          width: 100%;
          height: 46rem;
          border-radius: var(--radius-xl);
          background: linear-gradient(90deg, var(--bg-alt) 25%, var(--border) 50%, var(--bg-alt) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        .standort-info-bar {
          display: flex;
          gap: 2.4rem;
          padding: 2rem 2.4rem;
          background: var(--bg-alt);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }
        .standort-stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .standort-stat strong {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--primary);
        }
        .standort-stat small {
          font-size: var(--text-xs);
          color: var(--text-light);
        }

        .standort-actions {
          display: flex;
          gap: 1.6rem;
          flex-wrap: wrap;
        }

        .standort-drivers {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .standort-driver {
          display: flex;
          align-items: center;
          gap: 1.6rem;
          padding: 1.4rem 1.8rem;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: border-color var(--transition);
        }
        .standort-driver:hover { border-color: var(--accent); }
        .standort-driver--busy { opacity: 0.55; }
        .standort-driver__icon { font-size: 2rem; flex-shrink: 0; }
        .standort-driver__info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }
        .standort-driver__info strong { font-size: var(--text-sm); font-weight: 600; }
        .standort-driver__info span { font-size: var(--text-xs); color: var(--text-light); }
        .standort-driver__status {
          font-size: var(--text-xs);
          font-weight: 600;
          color: #1a8c3c;
          background: rgba(26,140,60,0.1);
          padding: 0.3rem 0.8rem;
          border-radius: var(--radius-pill);
        }
        .standort-driver__status--busy {
          color: var(--text-light);
          background: var(--bg-alt);
        }

        .standort-debug-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: var(--text-xs);
          color: var(--text-light);
          text-decoration: underline;
          padding: 0;
          align-self: flex-start;
        }
        .standort-debug {
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.6rem;
          font-size: 1.2rem;
          color: var(--text-muted);
          overflow-x: auto;
        }

        @media (max-width: 600px) {
          .standort-info-bar { flex-direction: column; gap: 1.2rem; }
          .standort-actions { flex-direction: column; }
          .standort-actions :global(.btn) { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  )
}
