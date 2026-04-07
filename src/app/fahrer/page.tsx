'use client'

/**
 * /fahrer — Driver-only page.
 * Token is passed once via URL param (?t=TOKEN) and saved to localStorage.
 * On subsequent visits the driver only sees a big START button — no token entry needed.
 */

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const LS_KEY = 'ctxh_driver_token'
const INTERVAL_MS = 5000

type Screen = 'loading' | 'start' | 'active' | 'invalid'

export default function FahrerPage() {
  return (
    <Suspense>
      <FahrerInner />
    </Suspense>
  )
}

function FahrerInner() {
  const searchParams = useSearchParams()
  const [screen, setScreen] = useState<Screen>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // On mount: check URL param → save to localStorage → or read from localStorage
  useEffect(() => {
    const urlToken = searchParams.get('t')
    if (urlToken) {
      localStorage.setItem(LS_KEY, urlToken)
      setToken(urlToken)
      setScreen('start')
      // Clean token from URL without reload
      window.history.replaceState({}, '', '/fahrer')
      return
    }
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      setToken(saved)
      setScreen('start')
    } else {
      setScreen('invalid')
    }
  }, [searchParams])

  const sendLocation = useCallback(async (driverToken: string) => {
    if (!navigator.geolocation) {
      setGpsError('GPS wird von diesem Gerät nicht unterstützt.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc, heading, speed } = pos.coords
        setCoords({ lat, lng })
        setAccuracy(acc)
        setGpsError(null)
        try {
          const res = await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
            body: JSON.stringify({ lat, lng, heading, speed, is_active: true }),
          })
          if (res.ok) {
            setLastUpdate(new Date())
          } else {
            setGpsError('Verbindungsfehler — bitte Netz prüfen.')
          }
        } catch {
          setGpsError('Kein Internet — Standort wird lokal gehalten.')
        }
      },
      () => setGpsError('GPS-Zugriff verweigert. Bitte Einstellungen prüfen.'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }, [])

  const handleStart = useCallback(() => {
    if (!token) return
    setScreen('active')
    sendLocation(token)
    intervalRef.current = setInterval(() => sendLocation(token), INTERVAL_MS)
  }, [token, sendLocation])

  const handleStop = useCallback(async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setScreen('start')
    setLastUpdate(null)
    setCoords(null)
    if (token) {
      await fetch('/api/driver/location', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  }, [token])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <>
      <div className="f-page">

        {screen === 'loading' && (
          <div className="f-center">
            <div className="f-spinner" />
          </div>
        )}

        {screen === 'invalid' && (
          <div className="f-card">
            <span className="f-big-icon">⚠️</span>
            <h2>Kein Zugang</h2>
            <p>Bitte öffnen Sie den Link, den Sie von Citytaxi Horw erhalten haben.</p>
            <a href="tel:+41415144444" className="btn btn-primary f-fullbtn">📞 Büro anrufen</a>
          </div>
        )}

        {screen === 'start' && (
          <div className="f-card">
            <span className="f-big-icon">🚕</span>
            <h1 className="f-title">Citytaxi Horw</h1>
            <p className="f-sub">Tippen Sie auf START wenn Sie losfahren</p>
            <button type="button" className="f-start-btn" onClick={handleStart}>
              START
            </button>
            <p className="f-hint">Lassen Sie diese Seite während der Fahrt geöffnet</p>
          </div>
        )}

        {screen === 'active' && (
          <div className="f-card f-card--active">
            <div className="f-pulse-ring" aria-hidden="true" />
            <span className="f-big-icon">🚕</span>
            <h2 className="f-title">Fahrt läuft</h2>
            <p className="f-sub">Standort wird übertragen</p>

            <div className="f-stats">
              <div className="f-stat">
                <strong>{lastUpdate ? lastUpdate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</strong>
                <small>Letzte Aktualisierung</small>
              </div>
              <div className="f-stat">
                <strong>{accuracy !== null ? `±${Math.round(accuracy)} m` : '—'}</strong>
                <small>GPS-Genauigkeit</small>
              </div>
            </div>

            {gpsError && <p className="f-error">{gpsError}</p>}

            <button type="button" className="f-stop-btn" onClick={handleStop}>
              STOP
            </button>
          </div>
        )}

      </div>

      <style jsx>{`
        .f-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          padding: 2rem;
        }
        .f-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .f-spinner {
          width: 5.6rem;
          height: 5.6rem;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #C8A96E;
          border-radius: 50%;
          animation: f-spin 0.8s linear infinite;
        }
        @keyframes f-spin { to { transform: rotate(360deg); } }

        .f-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 2.4rem;
          padding: 4rem 3.2rem;
          width: 100%;
          max-width: 38rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .f-card--active { border-color: #1a8c3c; }

        .f-big-icon { font-size: 5.6rem; line-height: 1; }

        .f-title {
          font-size: 2.8rem;
          font-weight: 800;
          color: #C8A96E;
          margin: 0;
          font-family: var(--font-heading);
        }
        .f-sub {
          font-size: 1.5rem;
          color: #888;
          margin: 0;
        }
        .f-hint {
          font-size: 1.3rem;
          color: #555;
          margin: 0;
          font-style: italic;
        }
        .f-error {
          font-size: 1.3rem;
          color: #f87171;
          background: rgba(248,113,113,0.1);
          border-radius: 0.8rem;
          padding: 0.8rem 1.4rem;
          margin: 0;
          width: 100%;
        }

        /* Big START button */
        .f-start-btn {
          width: 18rem;
          height: 18rem;
          border-radius: 50%;
          background: #1a8c3c;
          color: #fff;
          font-size: 3.2rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 0 0 rgba(26,140,60,0.5);
          animation: f-idle-pulse 2.5s ease-in-out infinite;
          transition: transform 0.12s, background 0.15s;
          margin: 1.2rem 0;
        }
        .f-start-btn:active { transform: scale(0.94); background: #156b2e; }
        @keyframes f-idle-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,140,60,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(26,140,60,0); }
        }

        /* Big STOP button */
        .f-stop-btn {
          width: 14rem;
          height: 14rem;
          border-radius: 50%;
          background: #c00;
          color: #fff;
          font-size: 2.4rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          border: none;
          cursor: pointer;
          transition: transform 0.12s, background 0.15s;
          margin: 0.8rem 0;
        }
        .f-stop-btn:active { transform: scale(0.94); background: #900; }

        /* Animated pulse ring for active state */
        .f-pulse-ring {
          position: absolute;
          top: -4rem;
          left: 50%;
          transform: translateX(-50%);
          width: 8rem;
          height: 8rem;
          border-radius: 50%;
          background: rgba(26,140,60,0.15);
          animation: f-ring 2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes f-ring {
          0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
          100% { transform: translateX(-50%) scale(4); opacity: 0; }
        }

        .f-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
          width: 100%;
          background: #111;
          border-radius: 1.2rem;
          padding: 1.6rem;
        }
        .f-stat { display: flex; flex-direction: column; gap: 0.3rem; }
        .f-stat strong { font-size: 1.5rem; font-weight: 700; color: #fff; }
        .f-stat small { font-size: 1.1rem; color: #555; }

        .f-fullbtn { width: 100%; justify-content: center; }

        /* Prevent screen dimming hint */
        @media (max-width: 400px) {
          .f-start-btn { width: 15rem; height: 15rem; font-size: 2.8rem; }
        }
      `}</style>
    </>
  )
}
