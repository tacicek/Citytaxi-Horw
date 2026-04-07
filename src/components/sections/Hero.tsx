'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import homeData from '@/data/pages/home.json'
import bookingData from '@/data/pages/booking.json'
import homeImages from '@/data/images/home-images.json'
import siteData from '@/data/site.json'

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifState = { dispatch: string; customer: string } | null

export default function Hero() {
  const { hero } = homeData
  const { form }  = bookingData

  const [minDate, setMinDate]                 = useState('')
  const [isAirportTransfer, setIsAirport]     = useState(false)
  const [returnTrip, setReturnTrip]           = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [submitted, setSubmitted]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [notif, setNotif]                     = useState<NotifState>(null)
  const [hadEmail, setHadEmail]               = useState(false)

  useEffect(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setMinDate(t.toISOString().slice(0, 10))
  }, [])

  function safeMsg(raw: unknown): string {
    if (typeof raw === 'string' && raw.trim()) return raw
    if (raw instanceof Error) return raw.message
    return form.error_generic
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formEl  = e.currentTarget
    const formData = new FormData(formEl)
    const data    = Object.fromEntries(formData.entries())
    setHadEmail(Boolean(String(data.email || '').trim()))

    try {
      const res = await fetch('/api/booking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      let json: { success?: boolean; error?: unknown; notifications?: { dispatch: string; customer: string } } = {}
      try { json = await res.json() } catch { json = {} }

      if (!res.ok || !json.success) {
        setError(safeMsg(json.error))
        return
      }
      setNotif(json.notifications ?? null)
      setSubmitted(true)
      formEl.reset()
      setIsAirport(false)
      setReturnTrip(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : form.error_network)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="hero" aria-label="Hero">
      {/* Background */}
      <div className="hero__bg">
        <picture>
          <source media="(max-width: 768px)" srcSet={homeImages.hero_bg_mobile.url} />
          <img src={homeImages.hero_bg.url} alt={homeImages.hero_bg.alt} className="hero__bg-img" />
        </picture>
        <div className="hero__overlay" />
      </div>

      <div className="container hero__layout">

        {/* ── Left: brand content ── */}
        <div className="hero__brand">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            {hero.badge}
          </div>

          <h1 className="hero__headline">
            {hero.headline}
            <span className="hero__headline-sub">{hero.subheadline}</span>
          </h1>

          <p className="hero__desc">{hero.description}</p>

          <a href={`tel:${hero.phone}`} className="hero__phone" aria-label="Jetzt anrufen">
            <span className="hero__phone-icon">📞</span>
            <div>
              <span className="hero__phone-label">Jetzt anrufen</span>
              <span className="hero__phone-num">{hero.phone_display}</span>
            </div>
          </a>

          {/* Trust badges */}
          <div className="hero__trust">
            <span>✅ 24/7 verfügbar</span>
            <span>✈️ Flughafen-Transfer</span>
            <span>💳 Alle Zahlungsmittel</span>
          </div>
        </div>

        {/* ── Right: booking form ── */}
        <div className="hero__form-panel">
          {submitted ? (
            <div className="hero__success">
              <div className="hero__success-icon">✅</div>
              <h3>{form.success_message}</h3>
              <p>{form.success_detail}</p>
              {hadEmail && notif?.customer === 'sent' && (
                <p className="hero__success-note">{form.success_email_note}</p>
              )}
              {hadEmail && notif?.customer === 'failed' && (
                <p className="hero__success-note hero__success-note--warn">{form.success_email_partial}</p>
              )}
              <button
                type="button"
                className="hero__form-btn"
                onClick={() => { setSubmitted(false); setNotif(null); setHadEmail(false) }}
              >
                Weitere Anfrage stellen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="hero__form" noValidate aria-label="Taxi bestellen">
              <div className="hero__form-title">🚕 Jetzt Taxi bestellen</div>

              {/* Honeypot */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hero__hp" />

              {error && (
                <div className="hero__alert" role="alert">⚠️ {error}</div>
              )}

              {/* Route */}
              <div className="hf-section">
                <div className="hf-row">
                  <div className="hf-group">
                    <label htmlFor="hf-pickup">{form.pickup_label} *</label>
                    <input id="hf-pickup" name="pickup" type="text" required
                      placeholder="Abholadresse eingeben" autoComplete="street-address" />
                  </div>
                  <div className="hf-group">
                    <label htmlFor="hf-dest">{form.destination_label} *</label>
                    <input id="hf-dest" name="destination" type="text" required
                      placeholder="Zieladresse eingeben" autoComplete="off" />
                  </div>
                </div>

                <label className="hf-check-label">
                  <input type="checkbox" name="returnTrip" value="on"
                    checked={returnTrip} onChange={(e) => setReturnTrip(e.target.checked)} />
                  {form.return_trip_label}
                </label>
              </div>

              {/* Date & Time */}
              <div className="hf-row">
                <div className="hf-group">
                  <label htmlFor="hf-date">{form.date_label} *</label>
                  <input id="hf-date" name="date" type="date" required
                    min={minDate || undefined} />
                </div>
                <div className="hf-group">
                  <label htmlFor="hf-time">{form.time_label} *</label>
                  <input id="hf-time" name="time" type="time" required />
                </div>
              </div>

              {/* Fahrtdetails */}
              <div className="hf-row">
                <div className="hf-group">
                  <label htmlFor="hf-pax">{form.passengers_label}</label>
                  <select id="hf-pax" name="passengers" defaultValue="1">
                    {form.passengers_options.map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                    ))}
                  </select>
                </div>
                <div className="hf-group">
                  <label htmlFor="hf-luggage">{form.luggage_label}</label>
                  <select id="hf-luggage" name="luggage" defaultValue="">
                    <option value="">—</option>
                    {form.luggage_options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="hf-check-label">
                <input type="checkbox" name="airportTransfer" value="on"
                  checked={isAirportTransfer} onChange={(e) => setIsAirport(e.target.checked)} />
                {form.airport_transfer_label}
              </label>

              {isAirportTransfer && (
                <div className="hf-group">
                  <label htmlFor="hf-flight">{form.flight_label}</label>
                  <input id="hf-flight" name="flightNumber" type="text"
                    autoComplete="off" placeholder={form.flight_placeholder} />
                </div>
              )}

              {/* Contact */}
              <div className="hf-section">
                <div className="hf-row">
                  <div className="hf-group">
                    <label htmlFor="hf-name">{form.name_label} *</label>
                    <input id="hf-name" name="name" type="text" required
                      autoComplete="name" placeholder="Vor- und Nachname" />
                  </div>
                  <div className="hf-group">
                    <label htmlFor="hf-phone">{form.phone_label} *</label>
                    <input id="hf-phone" name="phone" type="tel" required
                      autoComplete="tel" inputMode="tel" placeholder="+41 XX XXX XX XX" />
                  </div>
                </div>

                <div className="hf-group">
                  <label htmlFor="hf-email">{form.email_label}</label>
                  <input id="hf-email" name="email" type="email"
                    autoComplete="email" placeholder={form.email_placeholder} />
                  <span className="hf-hint">{form.email_hint}</span>
                </div>

                <div className="hf-group">
                  <label htmlFor="hf-notes">{form.notes_label}</label>
                  <textarea id="hf-notes" name="notes" rows={2}
                    placeholder={form.notes_placeholder} />
                </div>
              </div>

              {/* Consent */}
              <label className="hf-consent-label">
                <input type="checkbox" name="consent" required value="on" />
                <span>
                  {form.consent_label}{' '}
                  <Link href="/datenschutz" className="hf-consent-link">{form.consent_link_text}</Link>
                </span>
              </label>

              <button type="submit" className="hero__form-btn" disabled={loading}>
                {loading
                  ? <><span className="hf-spinner" aria-hidden="true" /> Wird gesendet…</>
                  : <>🚕 {form.submit_label}</>
                }
              </button>

              <p className="hf-disclaimer">
                Kostenlos &amp; unverbindlich · {siteData.contact.phone}
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-hidden="true"><span /></div>

      <style jsx>{`
        /* ── Layout ── */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: var(--nav-height);
          overflow: hidden;
        }
        .hero__bg { position: absolute; inset: 0; z-index: 0; }
        .hero__bg picture { display: block; width: 100%; height: 100%; }
        .hero__bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.70) 50%, rgba(0,0,0,0.50) 100%);
        }
        .hero__layout {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
          padding-block: var(--section-y-md);
          width: 100%;
          max-width: 1280px;
        }

        /* ── Brand side ── */
        .hero__brand { display: flex; flex-direction: column; }
        .hero__badge {
          display: inline-flex; align-items: center; gap: 0.8rem;
          background: rgba(200,169,110,0.15); border: 1px solid rgba(200,169,110,0.4);
          color: var(--accent); padding: 0.6rem 1.6rem; border-radius: var(--radius-pill);
          font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 2.4rem; align-self: flex-start;
        }
        .hero__badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .hero__headline {
          font-family: var(--font-heading); font-size: var(--h1-hero); font-weight: 700;
          color: var(--white); line-height: 1.1; margin-bottom: 0.4rem;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .hero__headline-sub {
          font-size: var(--h3); font-weight: 400; color: var(--secondary); letter-spacing: 0.08em;
        }
        .hero__desc {
          font-size: var(--text-lg); color: rgba(255,255,255,0.75);
          margin-block: 2rem; max-width: 42rem; line-height: 1.7;
        }
        .hero__phone {
          display: inline-flex; align-items: center; gap: 1.2rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(192,192,192,0.2);
          padding: 1.2rem 2rem; border-radius: var(--radius-lg);
          transition: all var(--transition); backdrop-filter: blur(8px);
          margin-bottom: 2.4rem; align-self: flex-start;
        }
        .hero__phone:hover { background: rgba(200,169,110,0.15); border-color: var(--accent); }
        .hero__phone-icon { font-size: 2.4rem; }
        .hero__phone > div { display: flex; flex-direction: column; }
        .hero__phone-label { font-size: var(--text-xs); color: var(--secondary-dark); text-transform: uppercase; letter-spacing: 0.08em; }
        .hero__phone-num { font-size: var(--text-xl); font-weight: 700; color: var(--white); letter-spacing: 0.04em; }
        .hero__trust {
          display: flex; flex-wrap: wrap; gap: 1rem;
          font-size: 1.3rem; color: rgba(255,255,255,0.55);
        }
        .hero__trust span { display: flex; align-items: center; gap: 0.4rem; }

        /* ── Form panel ── */
        .hero__form-panel {
          background: rgba(10,10,10,0.82);
          border: 1px solid rgba(200,169,110,0.2);
          border-radius: var(--radius-xl);
          backdrop-filter: blur(16px);
          padding: 2.8rem 2.4rem;
          max-height: calc(100vh - var(--nav-height) - 4rem);
          overflow-y: auto;
        }
        .hero__form-panel::-webkit-scrollbar { width: 4px; }
        .hero__form-panel::-webkit-scrollbar-thumb { background: rgba(200,169,110,0.3); border-radius: 2px; }

        .hero__form-title {
          font-size: var(--text-lg); font-weight: 700; color: var(--white);
          margin-bottom: 2rem; padding-bottom: 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .hero__hp { display: none !important; }

        .hero__alert {
          background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.4);
          color: #fca5a5; padding: 1rem 1.4rem; border-radius: var(--radius-md);
          font-size: var(--text-sm); margin-bottom: 1.6rem;
        }

        /* ── Form fields ── */
        .hf-section { margin-bottom: 0; }
        .hf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; margin-bottom: 1.2rem; }
        .hf-group {
          display: flex; flex-direction: column; gap: 0.5rem;
          margin-bottom: 1.2rem;
        }
        .hf-row .hf-group { margin-bottom: 0; }

        .hf-group label,
        .hero__form label {
          font-size: 1.2rem; font-weight: 600; color: rgba(255,255,255,0.6);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .hf-group input,
        .hf-group select,
        .hf-group textarea {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: var(--radius-md);
          color: var(--white);
          font-size: var(--text-sm);
          padding: 1rem 1.2rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
        }
        .hf-group input::placeholder,
        .hf-group textarea::placeholder { color: rgba(255,255,255,0.25); }
        .hf-group input:focus,
        .hf-group select:focus,
        .hf-group textarea:focus {
          border-color: var(--accent);
          background: rgba(200,169,110,0.08);
        }
        .hf-group select option { background: #1a1a1a; color: #fff; }
        .hf-group input[type="date"]::-webkit-calendar-picker-indicator,
        .hf-group input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }

        .hf-check-label {
          display: flex; align-items: center; gap: 0.8rem;
          font-size: var(--text-sm); color: rgba(255,255,255,0.65);
          cursor: pointer; margin-bottom: 1.2rem;
        }
        .hf-check-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
        .hf-hint { font-size: 1.15rem; color: rgba(255,255,255,0.35); }

        .hf-consent-label {
          display: flex; align-items: flex-start; gap: 0.8rem;
          font-size: 1.2rem; color: rgba(255,255,255,0.5);
          cursor: pointer; margin-bottom: 1.6rem; line-height: 1.5;
        }
        .hf-consent-label input { width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; accent-color: var(--accent); }
        .hf-consent-link { color: var(--accent); text-decoration: underline; }

        /* Submit button */
        .hero__form-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.8rem;
          background: var(--accent); color: #0a0a0a;
          border: none; border-radius: var(--radius-md);
          font-size: var(--text-base); font-weight: 800;
          padding: 1.4rem 2rem;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          margin-bottom: 1.2rem;
        }
        .hero__form-btn:hover:not(:disabled) { opacity: 0.9; }
        .hero__form-btn:active:not(:disabled) { transform: scale(0.98); }
        .hero__form-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .hf-spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(10,10,10,0.3); border-top-color: #0a0a0a;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hf-disclaimer {
          text-align: center; font-size: 1.2rem; color: rgba(255,255,255,0.3); margin: 0;
        }

        /* ── Success state ── */
        .hero__success {
          text-align: center; padding: 2rem 0;
          display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
        }
        .hero__success-icon { font-size: 4.8rem; }
        .hero__success h3 { font-size: var(--text-xl); color: var(--white); margin: 0; }
        .hero__success p { font-size: var(--text-sm); color: rgba(255,255,255,0.6); margin: 0; line-height: 1.6; }
        .hero__success-note { font-size: 1.3rem; color: rgba(200,169,110,0.8); }
        .hero__success-note--warn { color: rgba(251,191,36,0.8); }

        /* ── Scroll indicator ── */
        .hero__scroll {
          position: absolute; bottom: 3.2rem; left: 50%; transform: translateX(-50%); z-index: 1;
        }
        .hero__scroll span {
          display: block; width: 2px; height: 40px;
          background: linear-gradient(to bottom, var(--accent), transparent);
          margin: 0 auto; animation: scrollAnim 2s ease infinite;
        }
        @keyframes scrollAnim {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .hero__layout { grid-template-columns: 1fr; gap: 3rem; }
          .hero__brand { order: 1; }
          .hero__form-panel { order: 2; max-height: none; }
          .hero__headline { font-size: var(--h2); }
        }
        @media (max-width: 600px) {
          .hf-row { grid-template-columns: 1fr; }
          .hero__bg-img { object-position: center center; }
          .hero__form-panel { padding: 2rem 1.6rem; }
        }
      `}</style>
    </section>
  )
}
