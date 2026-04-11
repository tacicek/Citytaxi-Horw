'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ServiceDetail, ServiceImageEntry } from './types'
import siteData from '@/data/site.json'

interface Props {
  service: {
    icon: string
    image_key: string
    detail: ServiceDetail
  }
  img: ServiceImageEntry
}

export default function ServiceDetailClient({ service, img }: Props) {
  const d = service.detail

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="sd-hero">
        <div className="sd-hero__img-wrap">
          <Image
            src={img.url}
            alt={img.alt}
            fill
            sizes="100vw"
            priority
            className="sd-hero__img"
          />
          <div className="sd-hero__overlay" />
        </div>
        <div className="container sd-hero__content">
          <span className="section-label section-label--light">{d.hero_label}</span>
          <h1 className="sd-hero__title">{d.hero_title}</h1>
          <p className="sd-hero__subtitle">{d.hero_subtitle}</p>
          <div className="sd-hero__actions">
            <Link href="/booking" className="btn btn-accent">
              Jetzt buchen
            </Link>
            <a href={`tel:${siteData.contact.phone}`} className="btn btn-outline-light">
              {siteData.contact.phone_display} anrufen
            </a>
          </div>
        </div>
      </section>

      {/* ── Intro ─────────────────────────────────────────── */}
      <section className="section-y sd-intro">
        <div className="container sd-intro__inner">
          <div className="sd-intro__icon">{service.icon}</div>
          <p className="sd-intro__text">{d.intro}</p>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="section-y sd-features section-dark">
        <div className="container">
          <h2 className="sd-section-title">{d.features_title}</h2>
          <div className="sd-features__grid">
            {d.features.map((f) => (
              <div key={f.title} className="sd-feature-card">
                <span className="sd-feature-card__icon">{f.icon}</span>
                <h3 className="sd-feature-card__title">{f.title}</h3>
                <p className="sd-feature-card__text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────── */}
      <section className="section-y sd-process">
        <div className="container">
          <h2 className="sd-section-title">{d.process_title}</h2>
          <ol className="sd-process__list">
            {d.process.map((step) => (
              <li key={step.step} className="sd-process__item">
                <span className="sd-process__num">{step.step}</span>
                <div className="sd-process__body">
                  <h3 className="sd-process__step-title">{step.title}</h3>
                  <p className="sd-process__step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Airports ──────────────────────────────────────── */}
      {'airports' in d && (() => {
        const dd = d as unknown as { airports_title: string; airports: { name: string; distance: string; time: string }[] }
        return (
          <section className="section-y sd-extra section-bg">
            <div className="container">
              <h2 className="sd-section-title">{dd.airports_title}</h2>
              <div className="sd-airport-grid">
                {dd.airports.map((a) => (
                  <div key={a.name} className="sd-airport-card">
                    <p className="sd-airport-card__name">✈️ {a.name}</p>
                    <p className="sd-airport-card__info">Entfernung: <strong>{a.distance}</strong></p>
                    <p className="sd-airport-card__info">Fahrzeit: <strong>{a.time}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── Occasions ─────────────────────────────────────── */}
      {'occasions' in d && (() => {
        const dd = d as unknown as { occasions_title: string; occasions: string[] }
        return (
          <section className="section-y sd-extra section-bg">
            <div className="container">
              <h2 className="sd-section-title">{dd.occasions_title}</h2>
              <ul className="sd-occasions-list">
                {dd.occasions.map((o) => (
                  <li key={o} className="sd-occasions-item">
                    <span className="sd-check">✓</span> {o}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })()}

      {/* ── Areas ─────────────────────────────────────────── */}
      {'areas' in d && (() => {
        const dd = d as unknown as { areas_title: string; areas: string[] }
        return (
          <section className="section-y sd-extra section-bg">
            <div className="container">
              <h2 className="sd-section-title">{dd.areas_title}</h2>
              <div className="sd-areas-wrap">
                {dd.areas.map((a) => (
                  <span key={a} className="sd-area-badge">{a}</span>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="section-y sd-faq">
        <div className="container sd-faq__inner">
          <h2 className="sd-section-title">{d.faq_title}</h2>
          <dl className="sd-faq__list">
            {d.faq.map((item) => (
              <div key={item.q} className="sd-faq__item">
                <dt className="sd-faq__q">{item.q}</dt>
                <dd className="sd-faq__a">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="sd-cta section-dark">
        <div className="container sd-cta__inner">
          <h2 className="sd-cta__title">{d.cta_title}</h2>
          <p className="sd-cta__text">{d.cta_text}</p>
          <div className="sd-cta__actions">
            <Link href="/booking" className="btn btn-accent btn-lg">
              Jetzt buchen
            </Link>
            <a href={`tel:${siteData.contact.phone}`} className="btn btn-outline-light btn-lg">
              📞 {siteData.contact.phone_display}
            </a>
          </div>
          <p className="sd-cta__back">
            <Link href="/services">← Alle Dienstleistungen</Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        /* ── Hero ─────────────────────────────── */
        .sd-hero {
          position: relative;
          min-height: 60vh;
          display: flex;
          align-items: flex-end;
          padding-bottom: 6.4rem;
        }
        .sd-hero__img-wrap {
          position: absolute;
          inset: 0;
        }
        .sd-hero__img {
          object-fit: cover;
        }
        .sd-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%);
        }
        .sd-hero__content {
          position: relative;
          z-index: 1;
          padding-top: calc(var(--nav-height) + 4rem);
          color: #fff;
        }
        .section-label--light {
          background: rgba(200,169,110,0.2);
          color: var(--accent);
          border: 1px solid rgba(200,169,110,0.4);
        }
        .sd-hero__title {
          font-size: clamp(3.2rem, 5vw, 5.6rem);
          color: #fff;
          margin: 1.6rem 0 2rem;
          max-width: 72rem;
          line-height: 1.15;
        }
        .sd-hero__subtitle {
          font-size: var(--text-lg);
          color: rgba(255,255,255,0.85);
          max-width: 60rem;
          line-height: 1.7;
          margin-bottom: 3.2rem;
        }
        .sd-hero__actions {
          display: flex;
          gap: 1.6rem;
          flex-wrap: wrap;
        }
        /* ── Intro ────────────────────────────── */
        .sd-intro__inner {
          max-width: 80rem;
          margin: 0 auto;
          text-align: center;
        }
        .sd-intro__icon {
          font-size: 4.8rem;
          margin-bottom: 2.4rem;
        }
        .sd-intro__text {
          font-size: var(--text-lg);
          color: var(--text-muted);
          line-height: 1.8;
        }
        /* ── Section title ────────────────────── */
        .sd-section-title {
          text-align: center;
          color: var(--primary);
          margin-bottom: 4.8rem;
          font-size: var(--h2);
        }
        :global(.section-dark) .sd-section-title {
          color: #fff;
        }
        /* ── Features ─────────────────────────── */
        .sd-features__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.4rem;
        }
        .sd-feature-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-lg);
          padding: 2.8rem 2.4rem;
          transition: background var(--transition);
        }
        .sd-feature-card:hover {
          background: rgba(255,255,255,0.1);
        }
        .sd-feature-card__icon {
          font-size: 2.8rem;
          display: block;
          margin-bottom: 1.6rem;
        }
        .sd-feature-card__title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 0.8rem;
        }
        .sd-feature-card__text {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.75);
          line-height: 1.7;
        }
        /* ── Process ──────────────────────────── */
        .sd-process__list {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2.4rem;
          max-width: 96rem;
          margin: 0 auto;
        }
        .sd-process__item {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.8rem 2.4rem;
          box-shadow: var(--shadow-sm);
        }
        .sd-process__num {
          flex-shrink: 0;
          width: 4.8rem;
          height: 4.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: #fff;
          font-size: var(--text-lg);
          font-weight: 800;
          border-radius: 50%;
        }
        .sd-process__step-title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.6rem;
        }
        .sd-process__step-text {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.7;
        }
        /* ── Airports ─────────────────────────── */
        .sd-airport-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.4rem;
          max-width: 96rem;
          margin: 0 auto;
        }
        .sd-airport-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.4rem;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }
        .sd-airport-card__name {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 1.2rem;
        }
        .sd-airport-card__info {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: 0.4rem;
        }
        /* ── Occasions ────────────────────────── */
        .sd-occasions-list {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.2rem;
          max-width: 96rem;
          margin: 0 auto;
        }
        .sd-occasions-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.2rem 1.6rem;
          font-size: var(--text-sm);
          color: var(--text);
          box-shadow: var(--shadow-sm);
        }
        .sd-check {
          color: var(--accent);
          font-weight: 700;
          flex-shrink: 0;
        }
        /* ── Areas ────────────────────────────── */
        .sd-areas-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 1.2rem;
          justify-content: center;
          max-width: 96rem;
          margin: 0 auto;
        }
        .sd-area-badge {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10rem;
          padding: 0.6rem 1.6rem;
          font-size: var(--text-sm);
          color: var(--text);
          font-weight: 500;
          box-shadow: var(--shadow-sm);
        }
        /* ── FAQ ──────────────────────────────── */
        .sd-faq__inner {
          max-width: 76rem;
          margin: 0 auto;
        }
        .sd-faq__list {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
        }
        .sd-faq__item {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.4rem;
          box-shadow: var(--shadow-sm);
        }
        .sd-faq__q {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 1rem;
        }
        .sd-faq__a {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0;
        }
        /* ── CTA ──────────────────────────────── */
        .sd-cta {
          padding: 8rem 0;
        }
        .sd-cta__inner {
          text-align: center;
        }
        .sd-cta__title {
          font-size: var(--h2);
          color: #fff;
          margin-bottom: 1.6rem;
        }
        .sd-cta__text {
          font-size: var(--text-lg);
          color: rgba(255,255,255,0.8);
          margin-bottom: 3.2rem;
        }
        .sd-cta__actions {
          display: flex;
          gap: 1.6rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3.2rem;
        }
        .sd-cta__back a {
          color: rgba(255,255,255,0.6);
          font-size: var(--text-sm);
          transition: color var(--transition);
        }
        .sd-cta__back a:hover {
          color: var(--accent);
        }
        /* ── Responsive ───────────────────────── */
        @media (max-width: 900px) {
          .sd-features__grid { grid-template-columns: repeat(2, 1fr); }
          .sd-process__list { grid-template-columns: 1fr; }
          .sd-airport-grid { grid-template-columns: 1fr; }
          .sd-occasions-list { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .sd-hero { min-height: 70vh; }
          .sd-features__grid { grid-template-columns: 1fr; }
          .sd-occasions-list { grid-template-columns: 1fr; }
          .sd-hero__actions { flex-direction: column; }
          .sd-cta__actions { flex-direction: column; align-items: center; }
        }
      `}</style>
    </>
  )
}
