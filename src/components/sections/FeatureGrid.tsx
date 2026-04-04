'use client'

import homeData from '@/data/pages/home.json'

export default function FeatureGrid() {
  const { features } = homeData

  return (
    <section className="features section-y section-dark">
      <div className="container">
        <div className="features__grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-item">
              <div className="feature-item__icon">{feature.icon}</div>
              <h3 className="feature-item__title">{feature.title}</h3>
              <p className="feature-item__desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .features__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3.2rem;
        }
        .feature-item {
          text-align: center;
          padding: 3.2rem 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(192,192,192,0.1);
          transition: all var(--transition);
        }
        .feature-item:hover {
          border-color: rgba(200,169,110,0.3);
          background: rgba(200,169,110,0.04);
        }
        .feature-item__icon {
          font-size: 4rem;
          margin-bottom: 1.6rem;
          display: block;
        }
        .feature-item__title {
          font-family: var(--font-heading);
          font-size: var(--text-xl);
          font-weight: 600;
          color: var(--white);
          margin-bottom: 1rem;
        }
        .feature-item__desc {
          font-size: var(--text-sm);
          color: var(--secondary-dark);
          line-height: 1.7;
        }
        @media (max-width: 900px) {
          .features__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .features__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
