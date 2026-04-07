'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import bookingData from '@/data/pages/booking.json'
import pricingData from '@/data/pages/pricing.json'
import siteData from '@/data/site.json'
import AddressAutocompleteField from '@/components/ui/AddressAutocompleteField'

// Fare range — edit in src/data/pages/pricing.json → estimate_range
const FARE_LOW = pricingData.estimate_range.low
const FARE_HIGH = pricingData.estimate_range.high
const SURCHARGES = pricingData.estimate_range.surcharges

function calcFare(fare: { base: number; per_km: number; min: number }, km: number): number {
  return Math.max(fare.min, fare.base + km * fare.per_km)
}

type Surcharge = (typeof SURCHARGES)[number]

/** Returns the most specific applicable surcharge for a given date/time string. */
function getApplicableSurcharge(dateStr: string, timeStr: string): Surcharge | null {
  if (!timeStr) return null
  const hour = parseInt(timeStr.split(':')[0], 10)
  const weekday = dateStr ? new Date(dateStr + 'T12:00').getDay() : -1

  const isNight = (h: number, from: number, to: number) =>
    from > to ? h >= from || h < to : h >= from && h < to

  // Find all matching surcharges and pick the one with the highest factor
  const matches = SURCHARGES.filter((s) => {
    const nightMatch =
      s.time_from !== undefined && s.time_to !== undefined
        ? isNight(hour, s.time_from, s.time_to)
        : true
    const dayMatch = s.weekday !== undefined ? weekday === s.weekday : true
    return nightMatch && dayMatch
  })

  if (matches.length === 0) return null
  return matches.reduce((best, cur) => (cur.factor > best.factor ? cur : best))
}

type RawDistance = { km: number; durationMin: number }

type Estimate = {
  km: number
  durationMin: number
  priceMin: number
  priceMax: number
  surcharge: Surcharge | null
}

export default function BookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minDate, setMinDate] = useState('')
  const [isAirportTransfer, setIsAirportTransfer] = useState(false)
  const [returnTrip, setReturnTrip] = useState(false)
  const [notif, setNotif] = useState<{
    dispatch: string
    customer: string
  } | null>(null)
  const [hadCustomerEmail, setHadCustomerEmail] = useState(false)
  const searchParams = useSearchParams()
  const [pickupAddr, setPickupAddr] = useState(() => searchParams.get('pickup') ?? '')
  const [destAddr, setDestAddr]     = useState(() => searchParams.get('destination') ?? '')
  const [rawDistance, setRawDistance] = useState<RawDistance | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [bookingTime, setBookingTime] = useState(() => searchParams.get('time') ?? '')
  const [bookingDate, setBookingDate] = useState(() => searchParams.get('date') ?? '')

  const { form, quick_options } = bookingData

  useEffect(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setMinDate(t.toISOString().slice(0, 10))
  }, [])

  // Recompute displayed price whenever raw distance OR time/date changes — no extra API call
  const estimate = useMemo<Estimate | null>(() => {
    if (!rawDistance) return null
    const surcharge = getApplicableSurcharge(bookingDate, bookingTime)
    const factor = surcharge?.factor ?? 1
    return {
      ...rawDistance,
      priceMin: Math.round(calcFare(FARE_LOW, rawDistance.km) * factor),
      priceMax: Math.round(calcFare(FARE_HIGH, rawDistance.km) * factor),
      surcharge,
    }
  }, [rawDistance, bookingTime, bookingDate])

  // Distance Matrix API — only fires when addresses change
  useEffect(() => {
    if (!pickupAddr || !destAddr) {
      setRawDistance(null)
      return
    }
    if (typeof window === 'undefined') return

    let cancelled = false
    setEstimating(true)

    const run = () => {
      if (cancelled) return
      if (typeof google === 'undefined' || !google.maps?.DistanceMatrixService) {
        setEstimating(false)
        setRawDistance(null)
        return
      }
      const svc = new google.maps.DistanceMatrixService()
      svc.getDistanceMatrix(
        {
          origins: [pickupAddr],
          destinations: [destAddr],
          travelMode: google.maps.TravelMode.DRIVING,
          region: 'ch',
        },
        (response, status) => {
          if (cancelled) return
          setEstimating(false)
          if (status !== 'OK' || !response) { setRawDistance(null); return }
          const el = response.rows[0]?.elements[0]
          if (!el || el.status !== 'OK') { setRawDistance(null); return }
          const km = el.distance.value / 1000
          const durationMin = Math.ceil(el.duration.value / 60)
          setRawDistance({
            km: Math.round(km * 10) / 10,
            durationMin,
          })
        }
      )
    }

    // Wait briefly for Google Maps script to be available if needed
    if (typeof google !== 'undefined' && google.maps?.DistanceMatrixService) {
      run()
    } else {
      const t = window.setTimeout(run, 1500)
      return () => { cancelled = true; window.clearTimeout(t) }
    }

    return () => { cancelled = true }
  }, [pickupAddr, destAddr])

  function safeApiErrorMessage(raw: unknown): string {
    if (typeof raw === 'string' && raw.trim()) return raw
    if (raw instanceof Error && raw.message) return raw.message
    return form.error_generic
  }

  async function submitBookingForm(formEl: HTMLFormElement) {
    setLoading(true)
    setError(null)
    const formData = new FormData(formEl)
    const data = Object.fromEntries(formData.entries())

    const emailVal = String(data.email || '').trim()
    setHadCustomerEmail(emailVal.length > 0)

    try {
      const res = await fetch(form.action_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      let json: {
        success?: boolean
        error?: unknown
        notifications?: { dispatch: string; customer: string }
      } = {}
      try { json = await res.json() } catch { json = {} }

      if (!res.ok || !json.success) {
        setError(safeApiErrorMessage(json.error))
        return
      }

      setNotif(json.notifications ?? null)
      setSubmitted(true)
      try { formEl.reset() } catch { /* ignore */ }
      setIsAirportTransfer(false)
      setReturnTrip(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : form.error_network)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void submitBookingForm(e.currentTarget)
  }

  return (
    <section className="booking section-y" id="booking-form">
      <div className="container">
        <div className="booking__layout">

          {/* Left column — quick contact */}
          <div className="booking__quick">
            <span className="section-label">Schnellbuchung</span>
            <h2 className="booking__title">{bookingData.headline}</h2>
            <p className="booking__subtitle">{bookingData.subheadline}</p>

            <div className="booking__options">
              {quick_options.map((opt) => (
                <a
                  key={opt.title}
                  href={opt.href}
                  className="booking__option"
                  {...(opt.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="booking__option-icon" aria-hidden="true">{opt.icon}</span>
                  <div>
                    <strong className="booking__option-title">{opt.title}</strong>
                    <span className="booking__option-value">{opt.value}</span>
                    <span className="booking__option-desc">{opt.description}</span>
                  </div>
                </a>
              ))}
            </div>

            <a
              href={`https://wa.me/${siteData.contact.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="booking__whatsapp"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Via WhatsApp buchen
            </a>
          </div>

          {/* Right column — booking form */}
          <div className="booking__form-wrap">
            {submitted ? (
              <div className="booking__success" role="status">
                <div className="booking__success-icon" aria-hidden="true">✅</div>
                <h3>{form.success_message}</h3>
                <p>{form.success_detail}</p>
                {hadCustomerEmail && notif?.customer === 'sent' ? (
                  <p className="booking__success-extra">{form.success_email_note}</p>
                ) : null}
                {hadCustomerEmail && notif?.customer === 'failed' ? (
                  <p className="booking__success-extra booking__success-extra--warn">{form.success_email_partial}</p>
                ) : null}
                <button
                  type="button"
                  className="btn btn-outline booking__reset"
                  onClick={() => { setSubmitted(false); setNotif(null); setHadCustomerEmail(false) }}
                >
                  Weitere Anfrage stellen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="booking__form" noValidate>
                {/* Honeypot — hidden from real users */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="booking__hp" aria-hidden="true" />

                {error ? (
                  <div className="booking__alert" role="alert">
                    <span aria-hidden="true">⚠️</span> {error}
                  </div>
                ) : null}

                {/* Section 1: Route */}
                <div className="form-section">
                  <div className="form-section__title">
                    <span aria-hidden="true">📍</span> Route
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickup">{form.pickup_label} *</label>
                      <AddressAutocompleteField
                        id="pickup"
                        name="pickup"
                        required
                        autoComplete="street-address"
                        placeholder="Strasse, Ort oder PLZ"
                        onPlaceSelect={setPickupAddr}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="destination">{form.destination_label} *</label>
                      <AddressAutocompleteField
                        id="destination"
                        name="destination"
                        required
                        autoComplete="off"
                        placeholder="Zielort eingeben"
                        onPlaceSelect={setDestAddr}
                      />
                    </div>
                  </div>

                  {/* Distance & price estimate */}
                  {estimating ? (
                    <div className="booking__estimate booking__estimate--loading">
                      <span className="booking__estimate-spinner" aria-hidden="true" />
                      Strecke wird berechnet…
                    </div>
                  ) : estimate ? (
                    <div className="booking__estimate" role="status" aria-live="polite">
                      <div className="booking__estimate-stats">
                        <span className="booking__estimate-stat">
                          <strong>{estimate.km} km</strong>
                          <small>Fahrstrecke</small>
                        </span>
                        <span className="booking__estimate-divider" aria-hidden="true" />
                        <span className="booking__estimate-stat">
                          <strong>ca. {estimate.durationMin} Min.</strong>
                          <small>Fahrzeit</small>
                        </span>
                        <span className="booking__estimate-divider" aria-hidden="true" />
                        <span className="booking__estimate-stat booking__estimate-stat--price">
                          <strong>ca. CHF {estimate.priceMin}–{estimate.priceMax}</strong>
                          <small>Preisschätzung</small>
                        </span>
                      </div>
                      {estimate.surcharge ? (
                        <p className="booking__estimate-surcharge">
                          +{Math.round((estimate.surcharge.factor - 1) * 100)}% {estimate.surcharge.label}
                        </p>
                      ) : null}
                      <p className="booking__estimate-note">
                        {pricingData.estimate_range.note}
                      </p>
                    </div>
                  ) : null}

                  <div className="form-group form-group--checkbox">
                    <label className="booking__check-label">
                      <input
                        type="checkbox"
                        name="returnTrip"
                        value="on"
                        checked={returnTrip}
                        onChange={(e) => setReturnTrip(e.target.checked)}
                      />
                      {form.return_trip_label}
                    </label>
                  </div>
                </div>

                {/* Section 2: Date & Time */}
                <div className="form-section">
                  <div className="form-section__title">
                    <span aria-hidden="true">🗓</span> Datum & Zeit
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">{form.date_label} *</label>
                      <input
                        id="date" name="date" type="date" required
                        min={minDate || undefined}
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="time">{form.time_label} *</label>
                      <input
                        id="time" name="time" type="time" required
                        onChange={(e) => setBookingTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Fahrt */}
                <div className="form-section">
                  <div className="form-section__title">
                    <span aria-hidden="true">🚕</span> Fahrtdetails
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="passengers">{form.passengers_label}</label>
                      <select id="passengers" name="passengers" defaultValue="1">
                        {form.passengers_options.map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Person' : 'Personen'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="luggage">{form.luggage_label}</label>
                      <select id="luggage" name="luggage" defaultValue="">
                        <option value="">—</option>
                        {form.luggage_options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group form-group--checkbox">
                    <label className="booking__check-label">
                      <input
                        type="checkbox"
                        name="airportTransfer"
                        value="on"
                        checked={isAirportTransfer}
                        onChange={(e) => setIsAirportTransfer(e.target.checked)}
                      />
                      {form.airport_transfer_label}
                    </label>
                  </div>

                  {isAirportTransfer ? (
                    <div className="form-group">
                      <label htmlFor="flightNumber">{form.flight_label}</label>
                      <input
                        id="flightNumber"
                        name="flightNumber"
                        type="text"
                        autoComplete="off"
                        placeholder={form.flight_placeholder}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Section 4: Kontakt */}
                <div className="form-section">
                  <div className="form-section__title">
                    <span aria-hidden="true">👤</span> Ihre Kontaktdaten
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">{form.name_label} *</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Vor- und Nachname"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">{form.phone_label} *</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+41 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">{form.email_label}</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={form.email_placeholder}
                    />
                    <span className="form-hint">{form.email_hint}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">{form.notes_label}</label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder={form.notes_placeholder}
                    />
                  </div>
                </div>

                {/* Consent */}
                <div className="form-group form-group--consent">
                  <label className="booking__consent-label">
                    <input type="checkbox" name="consent" required value="on" />
                    <span>
                      {form.consent_label}{' '}
                      <Link href="/datenschutz">{form.consent_link_text}</Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary booking__submit"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="booking__spinner" aria-hidden="true" /> Wird gesendet…</>
                  ) : (
                    <>🚕 {form.submit_label}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .booking__layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 6rem;
          align-items: start;
        }

        /* ── Left column ── */
        .booking__title { margin: 1.2rem 0; }
        .booking__subtitle {
          font-size: var(--text-base);
          color: var(--text-muted);
          margin-bottom: 3.2rem;
        }
        .booking__options {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          margin-bottom: 2.4rem;
        }
        .booking__option {
          display: flex;
          align-items: flex-start;
          gap: 1.6rem;
          padding: 1.6rem 2rem;
          background: var(--bg-alt);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          transition: all var(--transition);
        }
        .booking__option:hover {
          border-color: var(--accent);
          background: rgba(200, 169, 110, 0.04);
          transform: translateX(4px);
        }
        .booking__option-icon { font-size: 2.2rem; flex-shrink: 0; }
        .booking__option > div { display: flex; flex-direction: column; gap: 0.2rem; }
        .booking__option-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--primary);
        }
        .booking__option-value { font-size: var(--text-sm); color: var(--accent); font-weight: 600; }
        .booking__option-desc { font-size: var(--text-xs); color: var(--text-light); }
        .booking__whatsapp {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.4rem 2.4rem;
          background: #25d366;
          color: white;
          border-radius: var(--radius-pill);
          font-weight: 600;
          font-size: var(--text-sm);
          transition: all var(--transition);
          justify-content: center;
        }
        .booking__whatsapp:hover {
          background: #1da851;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
        }

        /* ── Form card ── */
        .booking__form-wrap {
          background: var(--white);
          border-radius: var(--radius-xl);
          padding: 4rem;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
        }
        .booking__form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Honeypot */
        .booking__hp {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        /* Error alert */
        .booking__alert {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          padding: 1.2rem 1.6rem;
          border-radius: var(--radius-md);
          background: rgba(180, 40, 40, 0.07);
          border: 1px solid rgba(180, 40, 40, 0.2);
          color: #7a1a1a;
          font-size: var(--text-sm);
          margin-bottom: 2rem;
        }

        /* Form sections */
        .form-section {
          border: none;
          padding: 0;
          margin: 0 0 2.4rem;
        }
        .form-section__title {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding-bottom: 1.2rem;
          margin-bottom: 1.6rem;
          border-bottom: 2px solid var(--border);
          width: 100%;
        }

        /* Form layout */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.6rem;
          margin-bottom: 1.6rem;
        }
        .form-row:last-child { margin-bottom: 0; }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.6rem;
        }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text);
        }
        .form-hint {
          font-size: var(--text-xs);
          color: var(--text-light);
        }

        /* Input styles — :global to reach AddressAutocompleteField */
        .form-group :global(input:not([type='checkbox'])),
        .form-group :global(select),
        .form-group :global(textarea) {
          width: 100%;
          box-sizing: border-box;
          padding: 1.1rem 1.4rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-family: var(--font-body);
          color: var(--text);
          background: var(--bg);
          transition: border-color var(--transition), box-shadow var(--transition);
          appearance: none;
          -webkit-appearance: none;
        }
        .form-group :global(input:not([type='checkbox'])):focus,
        .form-group :global(select):focus,
        .form-group :global(textarea):focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.15);
        }
        .form-group :global(select) {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.2rem center;
          padding-right: 3.6rem;
        }

        /* Distance & price estimate card */
        .booking__estimate {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.4rem 1.8rem;
          background: linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(200,169,110,0.04) 100%);
          border: 1.5px solid rgba(200,169,110,0.35);
          border-radius: var(--radius-md);
          margin-bottom: 1.6rem;
        }
        .booking__estimate--loading {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: var(--text-sm);
          color: var(--text-light);
        }
        .booking__estimate-spinner {
          display: inline-block;
          width: 1.4rem;
          height: 1.4rem;
          border: 2px solid rgba(200,169,110,0.3);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        .booking__estimate-stats {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .booking__estimate-stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
          text-align: center;
        }
        .booking__estimate-stat strong {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--primary);
        }
        .booking__estimate-stat--price strong {
          color: var(--accent-dark);
        }
        .booking__estimate-stat small {
          font-size: var(--text-xs);
          color: var(--text-light);
          font-weight: 400;
        }
        .booking__estimate-divider {
          width: 1px;
          height: 3.2rem;
          background: rgba(200,169,110,0.3);
          flex-shrink: 0;
        }
        .booking__estimate-surcharge {
          text-align: center;
          font-size: var(--text-xs);
          font-weight: 600;
          color: #7a4a00;
          background: rgba(200,120,0,0.1);
          border-radius: var(--radius-sm);
          padding: 0.3rem 0.8rem;
          margin: 0 auto;
          width: fit-content;
        }
        .booking__estimate-note {
          font-size: var(--text-xs);
          color: var(--text-light);
          text-align: center;
          margin: 0;
        }

        /* Return trip checkbox */
        .form-group--checkbox { margin-top: 0.4rem; margin-bottom: 0; }
        .booking__check-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text);
          user-select: none;
        }
        .booking__check-label input[type='checkbox'] {
          width: 1.8rem;
          height: 1.8rem;
          flex-shrink: 0;
          accent-color: var(--accent);
          cursor: pointer;
        }

        /* Consent */
        .form-group--consent { margin-top: 0.4rem; margin-bottom: 2rem; }
        .booking__consent-label {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          font-weight: 500;
          cursor: pointer;
          font-size: var(--text-sm);
          line-height: 1.5;
        }
        .booking__consent-label input[type='checkbox'] {
          margin-top: 0.25rem;
          width: 1.8rem;
          height: 1.8rem;
          flex-shrink: 0;
          accent-color: var(--accent);
        }
        .booking__consent-label :global(a) {
          color: var(--accent);
          text-decoration: underline;
          font-weight: 600;
        }

        /* Submit */
        .booking__submit {
          width: 100%;
          justify-content: center;
          gap: 0.8rem;
          font-size: var(--text-base);
          padding: 1.4rem 2.4rem;
        }
        .booking__spinner {
          display: inline-block;
          width: 1.6rem;
          height: 1.6rem;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success state */
        .booking__success {
          text-align: center;
          padding: 4rem 2rem;
        }
        .booking__success-icon { font-size: 5rem; margin-bottom: 1.6rem; }
        .booking__success h3 {
          font-family: var(--font-heading);
          font-size: var(--h4);
          color: var(--primary);
          margin-bottom: 1.2rem;
        }
        .booking__success p {
          font-size: var(--text-base);
          color: var(--text-muted);
          max-width: 38rem;
          margin: 0 auto;
        }
        .booking__success-extra {
          margin-top: 1.2rem;
          font-size: var(--text-sm);
          color: var(--text-muted);
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }
        .booking__success-extra--warn { color: #8b5a00; }
        .booking__reset { margin-top: 2.4rem; }

        /* Responsive */
        @media (max-width: 1024px) {
          .booking__layout { grid-template-columns: 1fr; gap: 4rem; }
        }
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr; }
          .booking__form-wrap { padding: 2.4rem 2rem; }
        }
      `}</style>
    </section>
  )
}
