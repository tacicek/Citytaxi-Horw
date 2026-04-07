'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import bookingData from '@/data/pages/booking.json'
import pricingData from '@/data/pages/pricing.json'
import AddressAutocompleteField from '@/components/ui/AddressAutocompleteField'

// ─── Price helpers ────────────────────────────────────────────────────────────
const FARE_LOW   = pricingData.estimate_range.low
const FARE_HIGH  = pricingData.estimate_range.high
const SURCHARGES = pricingData.estimate_range.surcharges

function calcFare(fare: { base: number; per_km: number; min: number }, km: number) {
  return Math.max(fare.min, fare.base + km * fare.per_km)
}

type Surcharge = (typeof SURCHARGES)[number]

function getApplicableSurcharge(dateStr: string, timeStr: string): Surcharge | null {
  if (!timeStr) return null
  const hour    = parseInt(timeStr.split(':')[0], 10)
  const weekday = dateStr ? new Date(dateStr + 'T12:00').getDay() : -1
  const isNight = (h: number, from: number, to: number) =>
    from > to ? h >= from || h < to : h >= from && h < to
  const matches = SURCHARGES.filter((s) => {
    const nightMatch = s.time_from !== undefined && s.time_to !== undefined
      ? isNight(hour, s.time_from, s.time_to) : true
    const dayMatch = s.weekday !== undefined ? weekday === s.weekday : true
    return nightMatch && dayMatch
  })
  if (!matches.length) return null
  return matches.reduce((best, cur) => cur.factor > best.factor ? cur : best)
}

type RawDistance = { km: number; durationMin: number }
type Estimate    = RawDistance & { priceMin: number; priceMax: number; surcharge: Surcharge | null }
type NotifState  = { dispatch: string; customer: string } | null

export default function HeroBookingForm() {
  const { form } = bookingData

  const [minDate, setMinDate]             = useState('')
  const [pickupAddr, setPickupAddr]       = useState('')
  const [destAddr, setDestAddr]           = useState('')
  const [bookingDate, setBookingDate]     = useState('')
  const [bookingTime, setBookingTime]     = useState('')
  const [isAirportTransfer, setIsAirport] = useState(false)
  const [returnTrip, setReturnTrip]       = useState(false)
  const [rawDistance, setRawDistance]     = useState<RawDistance | null>(null)
  const [estimating, setEstimating]       = useState(false)
  const [loading, setLoading]             = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [notif, setNotif]                 = useState<NotifState>(null)
  const [hadEmail, setHadEmail]           = useState(false)

  useEffect(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    setMinDate(t.toISOString().slice(0, 10))
  }, [])

  const estimate = useMemo<Estimate | null>(() => {
    if (!rawDistance) return null
    const surcharge = getApplicableSurcharge(bookingDate, bookingTime)
    const factor    = surcharge?.factor ?? 1
    return {
      ...rawDistance,
      priceMin: Math.round(calcFare(FARE_LOW,  rawDistance.km) * factor),
      priceMax: Math.round(calcFare(FARE_HIGH, rawDistance.km) * factor),
      surcharge,
    }
  }, [rawDistance, bookingDate, bookingTime])

  useEffect(() => {
    if (!pickupAddr || !destAddr) { setRawDistance(null); return }
    if (typeof window === 'undefined') return
    let cancelled = false
    setEstimating(true)
    const run = () => {
      if (cancelled) return
      if (typeof google === 'undefined' || !google.maps?.DistanceMatrixService) {
        setEstimating(false); setRawDistance(null); return
      }
      new google.maps.DistanceMatrixService().getDistanceMatrix(
        { origins: [pickupAddr], destinations: [destAddr],
          travelMode: google.maps.TravelMode.DRIVING, region: 'ch' },
        (res, status) => {
          if (cancelled) return
          setEstimating(false)
          if (status !== 'OK' || !res) { setRawDistance(null); return }
          const el = res.rows[0]?.elements[0]
          if (!el || el.status !== 'OK') { setRawDistance(null); return }
          setRawDistance({
            km: Math.round(el.distance.value / 100) / 10,
            durationMin: Math.ceil(el.duration.value / 60),
          })
        }
      )
    }
    if (typeof google !== 'undefined' && google.maps?.DistanceMatrixService) run()
    else { const t = window.setTimeout(run, 1500); return () => { cancelled = true; window.clearTimeout(t) } }
    return () => { cancelled = true }
  }, [pickupAddr, destAddr])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError(null)
    const formEl = e.currentTarget
    const data   = Object.fromEntries(new FormData(formEl).entries())
    setHadEmail(Boolean(String(data.email || '').trim()))
    try {
      const res = await fetch('/api/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      let json: { success?: boolean; error?: unknown; notifications?: { dispatch: string; customer: string } } = {}
      try { json = await res.json() } catch { json = {} }
      if (!res.ok || !json.success) {
        setError(typeof json.error === 'string' ? json.error : form.error_generic)
        return
      }
      setNotif(json.notifications ?? null)
      setSubmitted(true)
      formEl.reset()
      setIsAirport(false); setReturnTrip(false)
      setRawDistance(null); setPickupAddr(''); setDestAddr('')
    } catch (err) {
      setError(err instanceof Error ? err.message : form.error_network)
    } finally { setLoading(false) }
  }

  return (
    <section className="hbf" id="booking-form">
      <div className="container">
        <div className="hbf__header">
          <span className="section-label">Schnell &amp; Einfach</span>
          <h2>Jetzt Taxi bestellen</h2>
        </div>

        {submitted ? (
          <div className="hbf__success">
            <span className="hbf__success-icon">✅</span>
            <div>
              <strong>{form.success_message}</strong>
              <span>{form.success_detail}</span>
              {hadEmail && notif?.customer === 'sent' && (
                <span className="hbf__success-email">{form.success_email_note}</span>
              )}
            </div>
            <button type="button" className="hbf__reset"
              onClick={() => { setSubmitted(false); setNotif(null); setHadEmail(false) }}>
              Neue Anfrage
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hbf__hp" />

            {error && <div className="hbf__alert" role="alert">⚠️ {error}</div>}

            {/* Distance / price estimate */}
            {estimating && (
              <div className="hbf__estimate hbf__estimate--loading">
                <span className="hbf__spinner" /> Strecke wird berechnet…
              </div>
            )}
            {!estimating && estimate && (
              <div className="hbf__estimate" role="status" aria-live="polite">
                <span><strong>{estimate.km} km</strong> · ca. {estimate.durationMin} Min.</span>
                <span className="hbf__estimate-price">ca. CHF {estimate.priceMin}–{estimate.priceMax}</span>
                {estimate.surcharge && (
                  <span className="hbf__estimate-surcharge">
                    +{Math.round((estimate.surcharge.factor - 1) * 100)}% {estimate.surcharge.label}
                  </span>
                )}
                <span className="hbf__estimate-note">{pricingData.estimate_range.note}</span>
              </div>
            )}

            {/* Row 1 — Route */}
            <div className="hbf-row hbf-row--route">
              <div className="hbf-field">
                <label htmlFor="hf-pickup">📍 {form.pickup_label} *</label>
                <AddressAutocompleteField
                  id="hf-pickup" name="pickup" required
                  placeholder="Abholadresse, Ort oder PLZ"
                  autoComplete="street-address"
                  onPlaceSelect={setPickupAddr}
                />
              </div>
              <div className="hbf-field">
                <label htmlFor="hf-dest">🏁 {form.destination_label} *</label>
                <AddressAutocompleteField
                  id="hf-dest" name="destination" required
                  placeholder="Zieladresse eingeben"
                  autoComplete="off"
                  onPlaceSelect={setDestAddr}
                />
              </div>
              <div className="hbf-field hbf-field--sm">
                <label htmlFor="hf-date">🗓 {form.date_label} *</label>
                <input id="hf-date" name="date" type="date" required
                  min={minDate || undefined}
                  onChange={(e) => setBookingDate(e.target.value)} />
              </div>
              <div className="hbf-field hbf-field--xs">
                <label htmlFor="hf-time">🕐 {form.time_label} *</label>
                <input id="hf-time" name="time" type="time" required
                  onChange={(e) => setBookingTime(e.target.value)} />
              </div>
            </div>

            {/* Row 2 — Details */}
            <div className="hbf-row hbf-row--details">
              <div className="hbf-field hbf-field--xs">
                <label htmlFor="hf-pax">👤 {form.passengers_label}</label>
                <select id="hf-pax" name="passengers" defaultValue="1">
                  {form.passengers_options.map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                  ))}
                </select>
              </div>
              <div className="hbf-field hbf-field--sm">
                <label htmlFor="hf-luggage">🧳 {form.luggage_label}</label>
                <select id="hf-luggage" name="luggage" defaultValue="">
                  <option value="">—</option>
                  {form.luggage_options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="hbf-checks">
                <label className="hbf-check">
                  <input type="checkbox" name="airportTransfer" value="on"
                    checked={isAirportTransfer} onChange={(e) => setIsAirport(e.target.checked)} />
                  ✈️ {form.airport_transfer_label}
                </label>
                <label className="hbf-check">
                  <input type="checkbox" name="returnTrip" value="on"
                    checked={returnTrip} onChange={(e) => setReturnTrip(e.target.checked)} />
                  🔄 {form.return_trip_label}
                </label>
              </div>
              {isAirportTransfer && (
                <div className="hbf-field hbf-field--sm">
                  <label htmlFor="hf-flight">{form.flight_label}</label>
                  <input id="hf-flight" name="flightNumber" type="text"
                    autoComplete="off" placeholder={form.flight_placeholder} />
                </div>
              )}
            </div>

            {/* Row 3 — Contact */}
            <div className="hbf-row hbf-row--contact">
              <div className="hbf-field">
                <label htmlFor="hf-name">👤 {form.name_label} *</label>
                <input id="hf-name" name="name" type="text" required
                  autoComplete="name" placeholder="Vor- und Nachname" />
              </div>
              <div className="hbf-field">
                <label htmlFor="hf-phone">📞 {form.phone_label} *</label>
                <input id="hf-phone" name="phone" type="tel" required
                  autoComplete="tel" inputMode="tel" placeholder="+41 XX XXX XX XX" />
              </div>
              <div className="hbf-field">
                <label htmlFor="hf-email">✉️ {form.email_label}</label>
                <input id="hf-email" name="email" type="email"
                  autoComplete="email" placeholder={form.email_placeholder} />
              </div>
              <div className="hbf-field">
                <label htmlFor="hf-notes">💬 {form.notes_label}</label>
                <input id="hf-notes" name="notes" type="text"
                  placeholder={form.notes_placeholder} />
              </div>
            </div>

            {/* Footer — consent + submit */}
            <div className="hbf-row hbf-row--footer">
              <label className="hbf-consent">
                <input type="checkbox" name="consent" required value="on" />
                <span>
                  {form.consent_label}{' '}
                  <Link href="/datenschutz" className="hbf-consent-link">{form.consent_link_text}</Link>
                </span>
              </label>
              <button type="submit" className="hbf-submit" disabled={loading}>
                {loading
                  ? <><span className="hbf-spin" aria-hidden="true" /> Wird gesendet…</>
                  : <>🚕 {form.submit_label}</>
                }
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .hbf {
          background: var(--bg-dark, #0e0e0e);
          padding: 5.6rem 0 6.4rem;
          border-top: 1px solid rgba(200,169,110,0.12);
        }
        .hbf__header { text-align: center; margin-bottom: 4rem; }
        .hbf__header h2 { color: var(--white); margin-top: 1rem; }

        /* Honeypot */
        .hbf__hp { display: none !important; }

        /* Alert */
        .hbf__alert {
          background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.35);
          color: #fca5a5; padding: 1rem 1.4rem; border-radius: var(--radius-md);
          font-size: var(--text-sm); margin-bottom: 2rem;
        }

        /* Estimate banner */
        .hbf__estimate {
          display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
          background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.25);
          border-radius: var(--radius-md); padding: 1.2rem 1.8rem;
          font-size: var(--text-sm); color: rgba(255,255,255,0.75);
          margin-bottom: 2rem;
        }
        .hbf__estimate--loading { color: rgba(255,255,255,0.4); }
        .hbf__estimate-price  { font-weight: 700; color: var(--accent); font-size: var(--text-base); }
        .hbf__estimate-surcharge { font-size: 1.2rem; color: var(--accent); opacity: 0.8; }
        .hbf__estimate-note { font-size: 1.15rem; color: rgba(255,255,255,0.35); margin-left: auto; }
        .hbf__spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.15); border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Grid rows */
        .hbf-row { display: grid; gap: 1.6rem; margin-bottom: 1.6rem; align-items: end; }
        .hbf-row--route   { grid-template-columns: 1fr 1fr 18rem 13rem; }
        .hbf-row--details { grid-template-columns: 12rem 20rem 1fr; align-items: center; }
        .hbf-row--contact { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .hbf-row--footer  { grid-template-columns: 1fr auto; align-items: center; margin-bottom: 0; }

        /* Fields */
        .hbf-field { display: flex; flex-direction: column; gap: 0.6rem; min-width: 0; }
        .hbf-field label {
          font-size: 1.2rem; font-weight: 600; color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
        }
        .hbf-field :global(input),
        .hbf-field input,
        .hbf-field select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: var(--radius-md);
          color: #fff; font-size: var(--text-sm);
          padding: 1.05rem 1.3rem;
          outline: none; width: 100%;
          transition: border-color 0.2s, background 0.2s;
        }
        .hbf-field :global(input):focus,
        .hbf-field input:focus,
        .hbf-field select:focus {
          border-color: var(--accent);
          background: rgba(200,169,110,0.07);
        }
        .hbf-field :global(input)::placeholder,
        .hbf-field input::placeholder { color: rgba(255,255,255,0.22); }
        .hbf-field select option { background: #1a1a1a; color: #fff; }
        .hbf-field input[type="date"]::-webkit-calendar-picker-indicator,
        .hbf-field input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1); opacity: 0.45; cursor: pointer;
        }

        /* Checkboxes */
        .hbf-checks { display: flex; flex-direction: column; gap: 1rem; padding-bottom: 0.15rem; }
        .hbf-check {
          display: flex; align-items: center; gap: 0.9rem;
          font-size: var(--text-sm); color: rgba(255,255,255,0.65);
          cursor: pointer; white-space: nowrap;
        }
        .hbf-check input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; flex-shrink: 0; }

        /* Consent */
        .hbf-consent {
          display: flex; align-items: flex-start; gap: 0.8rem;
          font-size: 1.25rem; color: rgba(255,255,255,0.4);
          cursor: pointer; line-height: 1.6;
        }
        .hbf-consent input { width: 15px; height: 15px; flex-shrink: 0; margin-top: 3px; accent-color: var(--accent); }
        .hbf-consent-link { color: var(--accent); text-decoration: underline; }

        /* Submit */
        .hbf-submit {
          display: flex; align-items: center; gap: 0.9rem;
          background: var(--accent); color: #0a0a0a;
          border: none; border-radius: var(--radius-md);
          font-size: var(--text-base); font-weight: 800;
          padding: 1.2rem 3.6rem; cursor: pointer; white-space: nowrap;
          transition: opacity 0.15s, transform 0.1s;
        }
        .hbf-submit:hover:not(:disabled) { opacity: 0.88; }
        .hbf-submit:active:not(:disabled) { transform: scale(0.97); }
        .hbf-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .hbf-spin {
          display: inline-block; width: 15px; height: 15px;
          border: 2px solid rgba(10,10,10,0.25); border-top-color: #0a0a0a;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        /* Success */
        .hbf__success {
          display: flex; align-items: center; gap: 2.4rem; flex-wrap: wrap;
          background: rgba(22,163,74,0.10); border: 1px solid rgba(22,163,74,0.25);
          border-radius: var(--radius-lg); padding: 2.4rem 2.8rem;
        }
        .hbf__success-icon { font-size: 3.6rem; flex-shrink: 0; }
        .hbf__success > div { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .hbf__success strong { font-size: var(--text-lg); color: var(--white); }
        .hbf__success span   { font-size: var(--text-sm); color: rgba(255,255,255,0.55); line-height: 1.6; }
        .hbf__success-email  { color: rgba(200,169,110,0.85) !important; font-size: 1.3rem !important; }
        .hbf__reset {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14);
          color: var(--white); border-radius: var(--radius-md);
          padding: 0.9rem 2rem; font-size: var(--text-sm); cursor: pointer;
          transition: background 0.2s; white-space: nowrap;
        }
        .hbf__reset:hover { background: rgba(255,255,255,0.12); }

        /* Responsive */
        @media (max-width: 1100px) {
          .hbf-row--route   { grid-template-columns: 1fr 1fr 15rem 11rem; }
          .hbf-row--contact { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 860px) {
          .hbf-row--route   { grid-template-columns: 1fr 1fr; }
          .hbf-row--details { grid-template-columns: 1fr 1fr; }
          .hbf-row--footer  { grid-template-columns: 1fr; gap: 1.4rem; }
          .hbf-submit       { justify-content: center; }
        }
        @media (max-width: 560px) {
          .hbf-row--route,
          .hbf-row--contact,
          .hbf-row--details { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
