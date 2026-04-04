'use client'

import { useState } from 'react'
import Link from 'next/link'
import bookingData from '@/data/pages/booking.json'
import siteData from '@/data/site.json'

export default function BookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { form, quick_options } = bookingData

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      await fetch(form.action_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true) // show success regardless in demo
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="booking section-y" id="booking-form">
      <div className="container">
        <div className="booking__layout">
          {/* Quick Options */}
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
                  <span className="booking__option-icon">{opt.icon}</span>
                  <div>
                    <strong className="booking__option-title">{opt.title}</strong>
                    <span className="booking__option-value">{opt.value}</span>
                    <span className="booking__option-desc">{opt.description}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${siteData.contact.whatsapp.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="booking__whatsapp"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Via WhatsApp buchen
            </a>
          </div>

          {/* Form */}
          <div className="booking__form-wrap">
            {submitted ? (
              <div className="booking__success">
                <div className="booking__success-icon">✅</div>
                <h3>{form.success_message}</h3>
                <p>Wir werden uns innerhalb von 15 Minuten bei Ihnen melden.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="booking__form" noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pickup">{form.pickup_label} *</label>
                    <input id="pickup" name="pickup" type="text" required placeholder="Abholort eingeben" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="destination">{form.destination_label} *</label>
                    <input id="destination" name="destination" type="text" required placeholder="Zielort eingeben" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">{form.date_label} *</label>
                    <input id="date" name="date" type="date" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time">{form.time_label} *</label>
                    <input id="time" name="time" type="time" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="passengers">{form.passengers_label}</label>
                    <select id="passengers" name="passengers">
                      {form.passengers_options.map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="service">{form.service_label}</label>
                    <select id="service" name="service">
                      {form.service_options.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">{form.name_label} *</label>
                    <input id="name" name="name" type="text" required placeholder="Ihr vollständiger Name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">{form.phone_label} *</label>
                    <input id="phone" name="phone" type="tel" required placeholder="+41 XX XXX XX XX" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">{form.notes_label}</label>
                  <textarea id="notes" name="notes" rows={3} placeholder="Kindersitz, Rollstuhl, Gepäck…" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? '⏳ Wird gesendet…' : `🚕 ${form.submit_label}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .booking__layout {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 6rem;
          align-items: start;
        }
        .booking__title { margin: 1.2rem 0; }
        .booking__subtitle {
          font-size: var(--text-base);
          color: var(--text-muted);
          margin-bottom: 3.2rem;
        }
        .booking__options {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
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
          background: rgba(200,169,110,0.04);
        }
        .booking__option-icon { font-size: 2.4rem; flex-shrink: 0; }
        .booking__option > div {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .booking__option-title {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--primary);
          display: block;
        }
        .booking__option-value {
          font-size: var(--text-sm);
          color: var(--accent);
          font-weight: 600;
        }
        .booking__option-desc {
          font-size: var(--text-xs);
          color: var(--text-light);
        }
        .booking__whatsapp {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.4rem 2.4rem;
          background: #25D366;
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
          box-shadow: 0 4px 16px rgba(37,211,102,0.3);
        }
        .booking__form-wrap {
          background: var(--white);
          border-radius: var(--radius-xl);
          padding: 4rem;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
        }
        .booking__form { display: flex; flex-direction: column; gap: 1.6rem; }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.6rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .form-group label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text);
          letter-spacing: 0.03em;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 1.2rem 1.6rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-family: var(--font-body);
          color: var(--text);
          background: var(--bg);
          transition: border-color var(--transition);
          appearance: none;
          -webkit-appearance: none;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.15);
        }
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
        @media (max-width: 900px) {
          .booking__layout { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .booking__form-wrap { padding: 2.4rem; }
        }
      `}</style>
    </section>
  )
}
