/**
 * ContactClientPage — tüm interaktif içerik buraya (useState vb.)
 * layout.tsx yerine bu dosya 'use client' direktifi alır.
 */
'use client'

import { useState } from 'react'
import siteData from '@/data/site.json'
import contactData from '@/data/pages/contact.json'

export default function ContactClientPage() {
  const [sent, setSent] = useState(false)
  const { form, map_embed } = contactData
  const { contact } = siteData

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Wir sind für Sie da</span>
          <h1>{contactData.headline}</h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--secondary-dark)', marginTop: '1.6rem' }}>
            {contactData.subheadline}
          </p>
        </div>
      </section>

      <section className="section-y">
        <div className="container contact-layout">
          {/* Info */}
          <div className="contact-info">
            <div className="contact-card">
              <span className="contact-card__icon">📞</span>
              <div>
                <strong>Festnetz</strong>
                <a href={`tel:${contact.phone}`}>{contact.phone_display}</a>
              </div>
            </div>
            <div className="contact-card">
              <span className="contact-card__icon">📱</span>
              <div>
                <strong>Handy</strong>
                <a href={`tel:${contact.mobile}`}>{contact.mobile_display}</a>
              </div>
            </div>
            <div className="contact-card">
              <span className="contact-card__icon">💬</span>
              <div>
                <strong>WhatsApp</strong>
                <a href={`https://wa.me/${contact.whatsapp.replace(/\s+/g,'')}`} target="_blank" rel="noopener noreferrer">
                  Jetzt schreiben
                </a>
              </div>
            </div>
            <div className="contact-card">
              <span className="contact-card__icon">✉️</span>
              <div>
                <strong>E-Mail</strong>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
            <div className="contact-card">
              <span className="contact-card__icon">📍</span>
              <div>
                <strong>Standort</strong>
                <span>{contact.address.street}, {contact.address.zip} {contact.address.city}</span>
              </div>
            </div>
            <div className="contact-card">
              <span className="contact-card__icon">🕐</span>
              <div>
                <strong>Öffnungszeiten</strong>
                <span>{contact.hours.note}</span>
              </div>
            </div>

            {/* Map */}
            <div className="contact-map">
              <iframe
                src={map_embed}
                width="100%"
                height="280"
                style={{ border: 0, borderRadius: 'var(--radius-lg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Standort Citytaxi Horw"
              />
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-wrap">
            {sent ? (
              <div className="contact-success">
                <div style={{ fontSize: '4rem', marginBottom: '1.6rem' }}>✅</div>
                <h3>{form.success_message}</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <h3 className="contact-form__title">Nachricht senden</h3>
                <div className="form-group">
                  <label htmlFor="c-name">{form.name_label} *</label>
                  <input id="c-name" name="name" type="text" required placeholder="Ihr Name" />
                </div>
                <div className="form-group">
                  <label htmlFor="c-email">{form.email_label} *</label>
                  <input id="c-email" name="email" type="email" required placeholder="ihre@email.ch" />
                </div>
                <div className="form-group">
                  <label htmlFor="c-phone">{form.phone_label}</label>
                  <input id="c-phone" name="phone" type="tel" placeholder="+41 XX XXX XX XX" />
                </div>
                <div className="form-group">
                  <label htmlFor="c-message">{form.message_label} *</label>
                  <textarea id="c-message" name="message" rows={5} required placeholder="Ihre Nachricht…" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {form.submit_label}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 6rem;
          align-items: start;
        }
        .contact-info { display: flex; flex-direction: column; gap: 1.6rem; }
        .contact-card {
          display: flex;
          align-items: flex-start;
          gap: 1.4rem;
          padding: 1.6rem;
          background: var(--bg-alt);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .contact-card__icon { font-size: 2rem; flex-shrink: 0; }
        .contact-card > div {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .contact-card strong {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--primary);
        }
        .contact-card a, .contact-card span {
          font-size: var(--text-sm);
          color: var(--text-muted);
          transition: color var(--transition);
        }
        .contact-card a:hover { color: var(--accent); }
        .contact-map { border-radius: var(--radius-lg); overflow: hidden; }
        .contact-form-wrap {
          background: var(--white);
          border-radius: var(--radius-xl);
          padding: 4rem;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
        }
        .contact-form { display: flex; flex-direction: column; gap: 1.6rem; }
        .contact-form__title {
          font-family: var(--font-heading);
          font-size: var(--h4);
          color: var(--primary);
          margin-bottom: 0.8rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .form-group label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text);
        }
        .form-group input,
        .form-group textarea {
          padding: 1.2rem 1.6rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-family: var(--font-body);
          color: var(--text);
          transition: border-color var(--transition);
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.15);
        }
        .contact-success {
          text-align: center;
          padding: 4rem 2rem;
        }
        .contact-success h3 {
          font-family: var(--font-heading);
          font-size: var(--h4);
          color: var(--primary);
        }
        @media (max-width: 900px) {
          .contact-layout { grid-template-columns: 1fr; }
          .contact-form-wrap { padding: 2.4rem; }
        }
      `}</style>
    </>
  )
}
