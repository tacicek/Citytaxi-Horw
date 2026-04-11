'use client'

/**
 * /fahrer — Driver dashboard.
 * Protected by Supabase Auth (email + password via /fahrer/login).
 * Shows: pending bookings (Annehmen/Ablehnen), accepted bookings with
 * "Müşteriyi Aldım" button, and GPS START/STOP controls.
 */

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

const DRIVER_TOKEN_LS = 'ctxh_driver_token'
const INTERVAL_MS     = 5000

/** Web Audio API chime — no external file needed */
function playBell() {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1047, ctx.currentTime)           // C6
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.12)    // E6
    osc.frequency.setValueAtTime(1568, ctx.currentTime + 0.24)    // G6
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.2)
    osc.onended = () => ctx.close()
  } catch { /* ignore: AudioContext blocked */ }
}

type Screen = 'loading' | 'dashboard'

type Booking = {
  id: string
  name: string
  phone: string
  pickup: string
  destination: string
  date: string
  time: string
  service: string
  passengers: string
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up'
}

const darkLoader = (
  <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '76px' }}>
    <div style={{ width: '5.6rem', height: '5.6rem', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#C8A96E', borderRadius: '50%' }} />
  </div>
)

export default function FahrerPage() {
  return (
    <Suspense fallback={darkLoader}>
      <FahrerInner />
    </Suspense>
  )
}

function FahrerInner() {
  const router        = useRouter()
  const searchParams  = useSearchParams()

  const [session, setSession]         = useState<Session | null>(null)
  const [screen, setScreen]           = useState<Screen>('loading')
  const [pendingBooks, setPending]     = useState<Booking[]>([])
  const [acceptedBooks, setAccepted]   = useState<Booking[]>([])
  const [actionLoading, setActionLoad] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg]  = useState<string | null>(null)
  const [bellEnabled, setBell]         = useState(true)

  // GPS state
  const [gpsActive, setGpsActive]   = useState(false)
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy]     = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [gpsError, setGpsError]     = useState<string | null>(null)

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const driverToken  = useRef<string | null>(null)
  const sessionRef   = useRef<Session | null>(null)

  useEffect(() => { sessionRef.current = session }, [session])

  // Feedback message from accept/reject redirect (?msg=)
  useEffect(() => {
    const msg = searchParams.get('msg')
    if (msg) {
      setFeedbackMsg(msg)
      window.history.replaceState({}, '', '/fahrer')
    }
  }, [searchParams])

  // Auth check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/fahrer/login')
        return
      }
      setSession(data.session)

      // Also load DRIVER_SECRET_TOKEN for GPS endpoint
      const saved = localStorage.getItem(DRIVER_TOKEN_LS)
      if (saved) driverToken.current = saved

      setScreen('dashboard')
    })

    // Listen for auth state changes (e.g. token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) router.replace('/fahrer/login')
      else setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [router])

  // Load bookings when dashboard is shown
  const loadBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id,name,phone,pickup,destination,date,time,service,passengers,status')
      .in('status', ['pending', 'accepted'])
      .order('received_at', { ascending: true })
    if (!error && data) {
      const rows = data as Booking[]
      setPending(rows.filter((b) => b.status === 'pending'))
      setAccepted(rows.filter((b) => b.status === 'accepted'))
    }
  }, [])

  useEffect(() => {
    if (screen === 'dashboard') void loadBookings()
  }, [screen, loadBookings])

  // Supabase Realtime: auto-refresh when a booking is inserted or updated
  const bellRef = useRef(bellEnabled)
  useEffect(() => { bellRef.current = bellEnabled }, [bellEnabled])

  useEffect(() => {
    if (screen === 'loading') return

    const channel = supabase
      .channel('bookings-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          // New pending booking → ring bell
          if (
            payload.eventType === 'INSERT' &&
            (payload.new as { status?: string }).status === 'pending' &&
            bellRef.current
          ) {
            playBell()
          }
          // Any change → reload list
          void loadBookings()
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [screen, loadBookings])

  // gpsActive ref — needed inside event listeners without stale closures
  const gpsActiveRef = useRef(false)
  useEffect(() => { gpsActiveRef.current = gpsActive }, [gpsActive])

  // Mark offline only on actual tab/window close (not on tab-switch or new tab)
  useEffect(() => {
    const goOffline = () => {
      const t = driverToken.current
      if (!t) return
      void fetch('/api/driver/location', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
        keepalive: true,
      })
    }
    // beforeunload fires only when the page is truly closed/navigated away,
    // NOT when a new tab is opened or the user switches to another app.
    window.addEventListener('beforeunload', goOffline)
    return () => window.removeEventListener('beforeunload', goOffline)
  }, [])

  // sendLocation ref — keeps visibilitychange handler stable without stale closure
  const sendLocationRef = useRef<(() => Promise<void>) | null>(null)

  // Annehmen / Ablehnen — calls POST /api/booking/accept with Supabase JWT
  const handleBookingAction = useCallback(async (bookingId: string, action: 'accept' | 'reject') => {
    const s = sessionRef.current
    if (!s) return
    setActionLoad(bookingId)
    try {
      const res = await fetch('/api/booking/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ bookingId, action }),
      })
      const body = await res.json() as { ok: boolean; message?: string; error?: string }
      if (body.ok) {
        setFeedbackMsg(body.message ?? 'Erfolgreich.')
        await loadBookings()
      } else {
        setFeedbackMsg(body.error ?? 'Fehler. Bitte erneut versuchen.')
      }
    } catch {
      setFeedbackMsg('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setActionLoad(null)
    }
  }, [loadBookings])

  // Müşteriyi Aldım
  const handlePickup = useCallback(async (bookingId: string) => {
    const s = sessionRef.current
    if (!s) return
    setActionLoad(bookingId)
    try {
      const res = await fetch('/api/booking/pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ bookingId }),
      })
      if (res.ok) {
        setFeedbackMsg('Fahrt als abgeholt markiert. Tracking-Link wurde deaktiviert.')
        await loadBookings()
      } else {
        setFeedbackMsg('Fehler beim Aktualisieren. Bitte erneut versuchen.')
      }
    } catch {
      setFeedbackMsg('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setActionLoad(null)
    }
  }, [loadBookings])

  // GPS location send
  const sendLocation = useCallback(async () => {
    const t = driverToken.current
    if (!t) { setGpsError('Kein Fahrer-Token. Bitte Link von Büro anfordern.'); return }
    if (!navigator.geolocation) { setGpsError('GPS wird von diesem Gerät nicht unterstützt.'); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc, heading, speed } = pos.coords
        setCoords({ lat, lng })
        setAccuracy(acc)
        setGpsError(null)
        try {
          const res = await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
            body: JSON.stringify({ lat, lng, heading, speed, is_active: true }),
          })
          if (res.ok) setLastUpdate(new Date())
          else setGpsError('Verbindungsfehler — Netz prüfen.')
        } catch {
          setGpsError('Kein Internet — Standort wird lokal gehalten.')
        }
      },
      () => setGpsError('GPS-Zugriff verweigert. Einstellungen prüfen.'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }, [])

  // Keep ref in sync so visibilitychange handler always calls the latest version
  useEffect(() => { sendLocationRef.current = sendLocation }, [sendLocation])

  // visibilitychange — restart GPS interval when driver returns to this tab/app
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && gpsActiveRef.current && sendLocationRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        void sendLocationRef.current()
        intervalRef.current = setInterval(sendLocationRef.current, INTERVAL_MS)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, []) // no deps — uses refs only

  const handleGpsStart = useCallback(() => {
    setGpsActive(true)
    void sendLocation()
    intervalRef.current = setInterval(sendLocation, INTERVAL_MS)
  }, [sendLocation])

  const handleGpsStop = useCallback(async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setGpsActive(false)
    setLastUpdate(null)
    setCoords(null)
    const t = driverToken.current
    if (t) {
      await fetch('/api/driver/location', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {})
    }
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/fahrer/login')
  }

  function formatDate(date: string, time: string): string {
    try {
      const d = new Date(date)
      return `${d.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' })} – ${time} Uhr`
    } catch { return `${date} ${time}` }
  }

  return (
    <>
      {/* ── GPS active banner — fixed below navbar, single line ── */}
      {gpsActive && (
        <div className="fp-gps-banner">
          <span className="fp-gps-dot" aria-hidden="true" />
          <span className="fp-gps-label">GPS aktiv</span>
          {lastUpdate && (
            <span className="fp-gps-time">
              {lastUpdate.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {accuracy !== null && (
            <span className="fp-gps-acc">±{Math.round(accuracy)} m</span>
          )}
          <button type="button" className="fp-stop-btn-inline" onClick={handleGpsStop}>
            ⏹ STOP
          </button>
        </div>
      )}

      <div className={`fp-page${gpsActive ? ' fp-page--gps' : ''}`}>

        {screen === 'loading' && (
          <div className="fp-center"><div className="fp-spinner" /></div>
        )}

        {/* ── Dashboard ── */}
        {screen === 'dashboard' && (
          <div className="fp-dashboard">

            {/* Header */}
            <div className="fp-header">
              <div className="fp-header-left">
                <span className="fp-header-icon">🚕</span>
                <div>
                  <h1 className="fp-header-title">Citytaxi Horw</h1>
                  <p className="fp-header-email">{session?.user.email}</p>
                </div>
              </div>
              <div className="fp-header-right">
                <button
                  type="button"
                  className={`fp-bell-btn${bellEnabled ? ' fp-bell-btn--on' : ''}`}
                  onClick={() => setBell((v) => !v)}
                  title={bellEnabled ? 'Benachrichtigungston an' : 'Benachrichtigungston aus'}
                >
                  {bellEnabled ? '🔔' : '🔕'}
                </button>
                <button type="button" className="fp-signout-btn" onClick={handleSignOut}>Abmelden</button>
              </div>
            </div>

            {/* Feedback message */}
            {feedbackMsg && (
              <div className="fp-msg-banner">
                <span>{feedbackMsg}</span>
                <button type="button" className="fp-msg-close" onClick={() => setFeedbackMsg(null)}>✕</button>
              </div>
            )}

            {/* GPS section — START when idle, status when active */}
            <div className="fp-section fp-section--gps">
              {gpsActive ? (
                <div className="fp-gps-active-row">
                  <div>
                    <p className="fp-gps-idle-title">GPS Tracking läuft</p>
                    {gpsError
                      ? <p className="fp-error" style={{marginTop:'0.6rem'}}>{gpsError}</p>
                      : <p className="fp-gps-idle-hint">Standort wird alle {INTERVAL_MS / 1000} Sek. übertragen</p>
                    }
                  </div>
                  <button type="button" className="fp-stop-btn-inline" onClick={handleGpsStop}>
                    ⏹ STOP
                  </button>
                </div>
              ) : (
                <div className="fp-gps-idle-row">
                  <div>
                    <p className="fp-gps-idle-title">GPS Tracking</p>
                    <p className="fp-gps-idle-hint">Tippen Sie auf START wenn Sie losfahren</p>
                    {gpsError && <p className="fp-error" style={{marginTop:'0.6rem'}}>{gpsError}</p>}
                  </div>
                  <button type="button" className="fp-start-btn-inline" onClick={handleGpsStart}>
                    ▶ START
                  </button>
                </div>
              )}
            </div>

            {/* Accepted bookings — Müşteriyi Aldım */}
            <div className="fp-section">
              <div className="fp-section-header">
                <h2 className="fp-section-title">
                  Bestätigte Fahrten
                  {acceptedBooks.length > 0 && <span className="fp-badge fp-badge--green">{acceptedBooks.length}</span>}
                </h2>
                <button type="button" className="fp-refresh-btn" onClick={loadBookings} title="Aktualisieren">↻</button>
              </div>
              {acceptedBooks.length === 0 ? (
                <p className="fp-empty">Keine bestätigten Fahrten</p>
              ) : (
                <ul className="fp-list">
                  {acceptedBooks.map((b) => (
                    <li key={b.id} className="fp-item fp-item--accepted">
                      <div className="fp-item-top">
                        <strong className="fp-item-name">{b.name}</strong>
                        <span className="fp-item-time">{formatDate(b.date, b.time)}</span>
                      </div>
                      <div className="fp-item-route">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.pickup)}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fp-item-addr fp-item-addr--nav"
                          title="Navigation zum Abholort starten"
                        >
                          📍 {b.pickup} <span className="fp-nav-icon">↗</span>
                        </a>
                        <span className="fp-item-arrow">→</span>
                        <span className="fp-item-addr">🏁 {b.destination}</span>
                      </div>
                      <div className="fp-item-meta">
                        <span>{b.service}</span><span>·</span>
                        <span>{b.passengers} Pers.</span><span>·</span>
                        <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="fp-phone-link">📞 {b.phone}</a>
                      </div>
                      <button
                        type="button"
                        className="fp-pickup-btn"
                        disabled={actionLoading === b.id}
                        onClick={() => handlePickup(b.id)}
                      >
                        {actionLoading === b.id ? 'Bitte warten…' : '✅ Fahrgast abgeholt'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pending bookings — Annehmen / Ablehnen */}
            <div className="fp-section">
              <div className="fp-section-header">
                <h2 className="fp-section-title">
                  Neue Anfragen
                  {pendingBooks.length > 0 && <span className="fp-badge">{pendingBooks.length}</span>}
                </h2>
                <button type="button" className="fp-refresh-btn" onClick={loadBookings} title="Aktualisieren">↻</button>
              </div>
              {pendingBooks.length === 0 ? (
                <p className="fp-empty">Keine offenen Anfragen</p>
              ) : (
                <ul className="fp-list">
                  {pendingBooks.map((b) => (
                    <li key={b.id} className="fp-item">
                      <div className="fp-item-top">
                        <strong className="fp-item-name">{b.name}</strong>
                        <span className="fp-item-time">{formatDate(b.date, b.time)}</span>
                      </div>
                      <div className="fp-item-route">
                        <span className="fp-item-addr">📍 {b.pickup}</span>
                        <span className="fp-item-arrow">→</span>
                        <span className="fp-item-addr">🏁 {b.destination}</span>
                      </div>
                      <div className="fp-item-meta">
                        <span>{b.service}</span><span>·</span>
                        <span>{b.passengers} Pers.</span><span>·</span>
                        <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="fp-phone-link">📞 {b.phone}</a>
                      </div>
                      <div className="fp-item-actions">
                        <button
                          type="button"
                          className="fp-accept-btn"
                          disabled={actionLoading === b.id}
                          onClick={() => void handleBookingAction(b.id, 'accept')}
                        >
                          {actionLoading === b.id ? '…' : '✅ Annehmen'}
                        </button>
                        <button
                          type="button"
                          className="fp-reject-btn"
                          disabled={actionLoading === b.id}
                          onClick={() => void handleBookingAction(b.id, 'reject')}
                        >
                          {actionLoading === b.id ? '…' : '❌ Ablehnen'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>

      <style jsx>{`
        .fp-page {
          min-height: 100dvh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--nav-height) 0 4rem;
        }
        .fp-page--gps {
          /* extra room for the fixed GPS banner (4rem height) */
          padding-top: calc(var(--nav-height) + 4rem);
        }
        .fp-center {
          display: flex; align-items: center; justify-content: center;
          min-height: 100dvh; width: 100%;
        }
        .fp-spinner {
          width: 5.6rem; height: 5.6rem;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #C8A96E;
          border-radius: 50%;
          animation: fp-spin 0.8s linear infinite;
        }
        @keyframes fp-spin { to { transform: rotate(360deg); } }

        /* ── GPS active banner — fixed below navbar, single row ── */
        .fp-gps-banner {
          position: fixed;
          top: var(--nav-height);
          left: 0; right: 0;
          z-index: 200;
          background: #0d2b17;
          border-bottom: 2px solid #1a8c3c;
          padding: 0 2.4rem;
          height: 4rem;
          display: flex; align-items: center;
          gap: 1.2rem;
          overflow: hidden;
        }
        .fp-gps-banner .fp-stop-btn-inline {
          margin-left: auto;
        }
        .fp-gps-banner-left { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; }
        .fp-gps-dot {
          width: 10px; height: 10px; border-radius: 50%; background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,0.5);
          animation: fp-gps-blink 1.4s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes fp-gps-blink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        .fp-gps-label { font-size: 1.4rem; font-weight: 700; color: #22c55e; }
        .fp-gps-time  { font-size: 1.25rem; color: #888; }
        .fp-gps-acc   { font-size: 1.2rem; color: #555; }
        .fp-gps-err   { font-size: 1.2rem; color: #f87171; }
        .fp-stop-btn-inline {
          background: #c00; color: #fff; border: none; border-radius: 0.8rem;
          font-size: 1.3rem; font-weight: 800; padding: 0.7rem 1.8rem;
          cursor: pointer; white-space: nowrap;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.05em;
        }
        .fp-stop-btn-inline:active { background: #900; transform: scale(0.96); }

        /* ── GPS section in dashboard ── */
        .fp-section--gps {}
        .fp-gps-idle-row,
        .fp-gps-active-row {
          display: flex; align-items: center; justify-content: space-between; gap: 1.6rem;
        }
        .fp-gps-idle-title { font-size: 1.5rem; font-weight: 700; color: #C8A96E; margin: 0 0 0.4rem; }
        .fp-gps-idle-hint  { font-size: 1.35rem; color: #555; margin: 0; }
        .fp-start-btn-inline {
          background: #1a8c3c; color: #fff; border: none; border-radius: 0.8rem;
          font-size: 1.4rem; font-weight: 800; padding: 1rem 2.4rem;
          cursor: pointer; white-space: nowrap; letter-spacing: 0.05em;
          box-shadow: 0 0 0 0 rgba(26,140,60,0.5);
          animation: fp-idle-pulse 2.5s ease-in-out infinite;
          transition: background 0.15s, transform 0.1s;
        }
        .fp-start-btn-inline:active { transform: scale(0.96); background: #156b2e; }
        @keyframes fp-idle-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,140,60,0.4); }
          50%       { box-shadow: 0 0 0 10px rgba(26,140,60,0); }
        }

        /* ── Dashboard layout ── */
        .fp-dashboard {
          width: 100%; max-width: 52rem;
          display: flex; flex-direction: column; gap: 2rem; padding: 2rem;
        }

        /* Header */
        .fp-header {
          display: flex; align-items: center; justify-content: space-between;
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 1.6rem;
          padding: 1.6rem 2rem; gap: 1rem;
        }
        .fp-header-left { display: flex; align-items: center; gap: 1.2rem; }
        .fp-header-icon { font-size: 3.2rem; line-height: 1; }
        .fp-header-title { font-size: 1.8rem; font-weight: 800; color: #C8A96E; margin: 0; font-family: var(--font-heading); }
        .fp-header-email { font-size: 1.2rem; color: #555; margin: 0; }
        .fp-header-right { display: flex; align-items: center; gap: 0.8rem; }
        .fp-bell-btn {
          background: #2a2a2a; border: 1px solid #333; border-radius: 0.8rem;
          font-size: 2rem; padding: 0.6rem 1rem; cursor: pointer;
          line-height: 1; transition: background 0.15s;
          opacity: 0.5;
        }
        .fp-bell-btn--on { opacity: 1; }
        .fp-bell-btn:hover { background: #222; }
        .fp-signout-btn {
          background: #2a2a2a; border: 1px solid #333; border-radius: 0.8rem;
          color: #888; font-size: 1.3rem; padding: 0.8rem 1.4rem;
          cursor: pointer; white-space: nowrap;
          transition: color 0.15s, background 0.15s;
        }
        .fp-signout-btn:hover { color: #f87171; background: #1f1f1f; }

        /* Feedback banner */
        .fp-msg-banner {
          background: #1a3a1a; border: 1px solid #1a8c3c; border-radius: 1.2rem;
          padding: 1.2rem 1.6rem; color: #4ade80; font-size: 1.4rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .fp-msg-close {
          background: none; border: none; color: #4ade80;
          font-size: 1.6rem; cursor: pointer; padding: 0; line-height: 1;
        }

        /* Sections */
        .fp-section {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 1.6rem; padding: 2rem 2.4rem;
        }
        .fp-section-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.6rem;
        }
        .fp-section-title {
          font-size: 1.6rem; font-weight: 700; color: #C8A96E; margin: 0;
          display: flex; align-items: center; gap: 0.8rem;
        }
        .fp-badge {
          background: #C8A96E; color: #0a0a0a; font-size: 1.2rem; font-weight: 800;
          border-radius: 999px; padding: 0.1rem 0.7rem; line-height: 1.8;
        }
        .fp-badge--green { background: #16a34a; color: #fff; }
        .fp-refresh-btn {
          background: #2a2a2a; border: 1px solid #333; border-radius: 0.8rem;
          color: #888; font-size: 1.8rem; cursor: pointer;
          padding: 0.2rem 0.8rem; line-height: 1;
          transition: color 0.15s, background 0.15s;
        }
        .fp-refresh-btn:hover { color: #C8A96E; background: #222; }

        .fp-empty { text-align: center; color: #555; font-size: 1.4rem; padding: 1.6rem 0; margin: 0; }
        .fp-error {
          font-size: 1.3rem; color: #f87171;
          background: rgba(248,113,113,0.1); border-radius: 0.8rem;
          padding: 0.8rem 1.4rem; margin: 0; width: 100%;
        }

        /* Booking list items */
        .fp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.6rem; }
        .fp-item {
          background: #111; border: 1px solid #2a2a2a; border-radius: 1.2rem;
          padding: 1.6rem; display: flex; flex-direction: column; gap: 0.8rem;
        }
        .fp-item--accepted { border-color: #1a8c3c; }
        .fp-item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.8rem; }
        .fp-item-name { font-size: 1.6rem; font-weight: 700; color: #fff; }
        .fp-item-time { font-size: 1.3rem; color: #C8A96E; font-weight: 600; white-space: nowrap; }
        .fp-item-route { display: flex; flex-direction: column; gap: 0.4rem; }
        .fp-item-arrow { color: #555; font-size: 1.3rem; padding-left: 0.4rem; }
        .fp-item-addr  { font-size: 1.4rem; color: #ccc; line-height: 1.4; }
        .fp-item-addr--nav {
          color: #C8A96E; text-decoration: none;
          display: inline-flex; align-items: baseline; gap: 0.4rem;
          border-bottom: 1px dashed rgba(200,169,110,0.4);
          transition: color 0.15s, border-color 0.15s;
        }
        .fp-item-addr--nav:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
        .fp-nav-icon { font-size: 1.2rem; opacity: 0.7; }
        .fp-item-meta {
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 1.3rem; color: #666; flex-wrap: wrap;
        }
        .fp-phone-link { color: #C8A96E; text-decoration: none; }
        .fp-phone-link:hover { text-decoration: underline; }

        /* Müşteriyi Aldım button */
        .fp-pickup-btn {
          width: 100%; padding: 1.2rem; border-radius: 0.8rem;
          background: #16a34a; color: #fff; font-size: 1.5rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .fp-pickup-btn:hover:not(:disabled) { opacity: 0.85; }
        .fp-pickup-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Annehmen / Ablehnen buttons */
        .fp-item-actions { display: flex; gap: 1rem; }
        .fp-accept-btn, .fp-reject-btn {
          flex: 1; padding: 1rem 0; border-radius: 0.8rem;
          font-size: 1.4rem; font-weight: 700; border: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .fp-accept-btn:disabled, .fp-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fp-accept-btn { background: #16a34a; color: #fff; }
        .fp-accept-btn:hover:not(:disabled) { background: #15803d; }
        .fp-reject-btn { background: #2a2a2a; color: #f87171; border: 1px solid #dc2626; }
        .fp-reject-btn:hover:not(:disabled) { background: #1f1f1f; }

        @media (max-width: 420px) {
          .fp-item-top { flex-direction: column; gap: 0.3rem; }
          .fp-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  )
}
