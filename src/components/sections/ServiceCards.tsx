'use client'

import Link from 'next/link'
import servicesData from '@/data/pages/services.json'
import servicesImages from '@/data/images/services-images.json'

interface ServiceCardsProps {
  limit?: number
  showHeader?: boolean
}

export default function ServiceCards({ limit, showHeader = true }: ServiceCardsProps) {
  const services = limit
    ? servicesData.services.slice(0, limit)
    : servicesData.services

  return (
    <section className="services section-y">
      <div className="container">
        {showHeader && (
          <div className="services__header">
            <span className="section-label">Was wir anbieten</span>
            <h2 className="services__title">{servicesData.headline}</h2>
            <p className="services__subtitle">{servicesData.subheadline}</p>
          </div>
        )}

        <div className="services__grid">
          {services.map((service) => {
            const img = servicesImages[service.image_key as keyof typeof servicesImages]
            return (
              <article key={service.id} className="service-card">
                <div className="service-card__img-wrap">
                  {img && (
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="service-card__img"
                      loading="lazy"
                    />
                  )}
                  <div className="service-card__img-overlay" />
                  <span className="service-card__icon">{service.icon}</span>
                </div>
                <div className="service-card__body">
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__desc">{service.description}</p>
                  <ul className="service-card__features">
                    {service.features.map((f) => (
                      <li key={f}>
                        <span className="service-card__check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services#${service.slug}`}
                    className="service-card__link"
                    aria-label={`Mehr über ${service.title}`}
                  >
                    Mehr erfahren →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        {limit && (
          <div className="services__more">
            <Link href="/services" className="btn btn-dark">
              Alle Dienstleistungen ansehen
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .services__header {
          text-align: center;
          margin-bottom: 5.6rem;
        }
        .services__title {
          color: var(--primary);
          margin-bottom: 1.2rem;
        }
        .services__subtitle {
          font-size: var(--text-lg);
          color: var(--text-muted);
        }
        .services__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.4rem;
        }
        .service-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          transition: transform var(--transition), box-shadow var(--transition);
          border: 1px solid var(--border);
        }
        .service-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
        }
        .service-card__img-wrap {
          position: relative;
          height: 20rem;
          overflow: hidden;
        }
        .service-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .service-card:hover .service-card__img {
          transform: scale(1.06);
        }
        .service-card__img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6));
        }
        .service-card__icon {
          position: absolute;
          bottom: 1.6rem;
          left: 2rem;
          font-size: 2.8rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        .service-card__body {
          padding: 2.4rem;
        }
        .service-card__title {
          font-size: var(--h4);
          font-family: var(--font-heading);
          color: var(--primary);
          margin-bottom: 1rem;
        }
        .service-card__desc {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 1.6rem;
        }
        .service-card__features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 2rem;
        }
        .service-card__features li {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
        .service-card__check {
          color: var(--accent);
          font-weight: 700;
          flex-shrink: 0;
        }
        .service-card__link {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
          transition: color var(--transition);
        }
        .service-card__link:hover { color: var(--accent-dark); }
        .services__more {
          text-align: center;
          margin-top: 4.8rem;
        }
        @media (max-width: 1000px) {
          .services__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .services__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
