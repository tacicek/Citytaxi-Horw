'use client'

import Link from 'next/link'
import pricingData from '@/data/pages/pricing.json'

export default function PricingTable() {
  return (
    <section className="pricing section-y">
      <div className="container">
        <div className="pricing__header">
          <span className="section-label">Unsere Tarife</span>
          <h2 className="pricing__title">{pricingData.headline}</h2>
          <p className="pricing__subtitle">{pricingData.subheadline}</p>
        </div>

        {/* Tariff Cards */}
        <div className="pricing__grid">
          {pricingData.tariffs.map((tariff) => (
            <article
              key={tariff.id}
              className={`pricing-card ${tariff.featured ? 'pricing-card--featured' : ''}`}
            >
              {tariff.featured && (
                <div className="pricing-card__badge">Beliebt</div>
              )}
              <div className="pricing-card__icon">{tariff.icon}</div>
              <h3 className="pricing-card__name">{tariff.name}</h3>
              <div className="pricing-card__price">
                <span className="pricing-card__base">{tariff.base_fare}</span>
                <span className="pricing-card__unit">Grundtarif</span>
              </div>
              <div className="pricing-card__km">{tariff.per_km}</div>
              <ul className="pricing-card__features">
                {tariff.features.map((f) => (
                  <li key={f}>
                    <span className="pricing-card__check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pricing-card__min">
                Mindestpreis: <strong>{tariff.min_fare}</strong>
              </div>
              <Link href="/booking" className={`btn ${tariff.featured ? 'btn-primary' : 'btn-dark'} pricing-card__cta`}>
                Jetzt Buchen
              </Link>
            </article>
          ))}
        </div>

        {/* Fixed Prices */}
        <div className="pricing__fixed">
          <h3 className="pricing__fixed-title">Festpreise (Auswahl)</h3>
          <div className="pricing__fixed-grid">
            {pricingData.fixed_prices.map((fp) => (
              <div key={fp.route} className="pricing__fixed-item">
                <span className="pricing__fixed-route">{fp.route}</span>
                <span className="pricing__fixed-price">{fp.price}</span>
              </div>
            ))}
          </div>
          <p className="pricing__note">{pricingData.note}</p>
        </div>

        {/* Extras */}
        <div className="pricing__extras">
          <h4 className="pricing__extras-title">Zuschläge & Extras</h4>
          <div className="pricing__extras-grid">
            {pricingData.extras.map((e) => (
              <div key={e.label} className="pricing__extra-item">
                <span>{e.label}</span>
                <strong>{e.price}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing__header {
          text-align: center;
          margin-bottom: 5.6rem;
        }
        .pricing__title { margin-bottom: 1.2rem; }
        .pricing__subtitle {
          font-size: var(--text-lg);
          color: var(--text-muted);
        }
        .pricing__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.4rem;
          margin-bottom: 6.4rem;
        }
        .pricing-card {
          position: relative;
          background: var(--white);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 3.2rem;
          display: flex;
          flex-direction: column;
          transition: all var(--transition);
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .pricing-card--featured {
          background: var(--primary);
          border-color: var(--accent);
          color: var(--white);
          transform: scale(1.02);
        }
        .pricing-card--featured:hover { transform: scale(1.02) translateY(-4px); }
        .pricing-card__badge {
          position: absolute;
          top: -1.4rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent);
          color: var(--primary);
          padding: 0.4rem 1.6rem;
          border-radius: var(--radius-pill);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .pricing-card__icon { font-size: 3.2rem; margin-bottom: 1.2rem; }
        .pricing-card__name {
          font-family: var(--font-heading);
          font-size: var(--h4);
          margin-bottom: 1.6rem;
        }
        .pricing-card--featured .pricing-card__name { color: var(--white); }
        .pricing-card__price {
          display: flex;
          align-items: baseline;
          gap: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .pricing-card__base {
          font-size: var(--h3);
          font-weight: 700;
          color: var(--accent);
          font-family: var(--font-heading);
        }
        .pricing-card__unit {
          font-size: var(--text-xs);
          color: var(--text-light);
          text-transform: uppercase;
        }
        .pricing-card--featured .pricing-card__unit { color: var(--secondary-dark); }
        .pricing-card__km {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: 2.4rem;
        }
        .pricing-card--featured .pricing-card__km { color: var(--secondary-dark); }
        .pricing-card__features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          flex: 1;
          margin-bottom: 2.4rem;
        }
        .pricing-card__features li {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .pricing-card--featured .pricing-card__features li { color: rgba(255,255,255,0.8); }
        .pricing-card__check {
          color: var(--accent);
          font-weight: 700;
          flex-shrink: 0;
        }
        .pricing-card__min {
          font-size: var(--text-xs);
          color: var(--text-light);
          margin-bottom: 2rem;
        }
        .pricing-card--featured .pricing-card__min { color: var(--secondary-dark); }
        .pricing-card__cta { width: 100%; justify-content: center; }

        /* Fixed Prices */
        .pricing__fixed {
          background: var(--bg-alt);
          border-radius: var(--radius-lg);
          padding: 3.2rem 4rem;
          margin-bottom: 3.2rem;
        }
        .pricing__fixed-title {
          font-family: var(--font-heading);
          font-size: var(--h4);
          margin-bottom: 2.4rem;
          color: var(--primary);
        }
        .pricing__fixed-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
        }
        .pricing__fixed-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 1.6rem;
          background: var(--white);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .pricing__fixed-route { font-size: var(--text-sm); color: var(--text); }
        .pricing__fixed-price {
          font-weight: 700;
          color: var(--accent);
          font-size: var(--text-base);
        }
        .pricing__note {
          margin-top: 1.6rem;
          font-size: var(--text-xs);
          color: var(--text-light);
        }

        /* Extras */
        .pricing__extras {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.4rem 3.2rem;
        }
        .pricing__extras-title {
          font-family: var(--font-heading);
          font-size: var(--h4);
          margin-bottom: 1.6rem;
          color: var(--primary);
        }
        .pricing__extras-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .pricing__extra-item {
          display: flex;
          justify-content: space-between;
          padding: 0.8rem 0;
          border-bottom: 1px solid var(--border);
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .pricing__extra-item strong { color: var(--primary); }

        @media (max-width: 900px) {
          .pricing__grid { grid-template-columns: 1fr; }
          .pricing-card--featured { transform: none; }
          .pricing__fixed-grid { grid-template-columns: 1fr; }
          .pricing__extras-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
