'use client'

import homeData from '@/data/pages/home.json'

export default function Testimonials() {
  const { testimonials } = homeData

  return (
    <section className="testimonials section-y section-dark">
      <div className="container">
        <div className="testimonials__header">
          <span className="section-label">Was unsere Kunden sagen</span>
          <h2>Kundenbewertungen</h2>
          <div className="testimonials__stars" aria-label="5 von 5 Sternen">
            {'★'.repeat(5)}
            <span className="testimonials__rating-text"> 5.0 / 5.0 · Google Reviews</span>
          </div>
        </div>

        <div className="testimonials__grid">
          {testimonials.map((t, i) => (
            <article key={i} className="testimonial-card">
              <div className="testimonial-card__stars" aria-label={`${t.rating} Sterne`}>
                {'★'.repeat(t.rating)}
              </div>
              <blockquote className="testimonial-card__text">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <footer className="testimonial-card__footer">
                <div className="testimonial-card__avatar" aria-hidden="true">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <cite className="testimonial-card__name">{t.name}</cite>
                  <span className="testimonial-card__location">{t.location}</span>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .testimonials__header {
          text-align: center;
          margin-bottom: 5.6rem;
        }
        .testimonials__header h2 { color: var(--white); }
        .testimonials__stars {
          font-size: var(--text-xl);
          color: var(--accent);
          margin-top: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }
        .testimonials__rating-text {
          font-size: var(--text-sm);
          color: var(--secondary-dark);
          font-family: var(--font-body);
        }
        .testimonials__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2.4rem;
        }
        .testimonial-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(192,192,192,0.12);
          border-radius: var(--radius-lg);
          padding: 3.2rem;
          transition: border-color var(--transition), background var(--transition);
        }
        .testimonial-card:hover {
          border-color: rgba(200,169,110,0.3);
          background: rgba(200,169,110,0.04);
        }
        .testimonial-card__stars {
          font-size: var(--text-lg);
          color: var(--accent);
          margin-bottom: 1.6rem;
          letter-spacing: 0.1em;
        }
        .testimonial-card__text {
          font-family: var(--font-heading);
          font-size: var(--text-lg);
          font-style: italic;
          color: rgba(255,255,255,0.85);
          line-height: 1.7;
          margin-bottom: 2.4rem;
        }
        .testimonial-card__footer {
          display: flex;
          align-items: center;
          gap: 1.4rem;
        }
        .testimonial-card__avatar {
          width: 4.8rem;
          height: 4.8rem;
          border-radius: 50%;
          background: var(--accent);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: var(--text-xl);
          font-weight: 700;
          flex-shrink: 0;
        }
        .testimonial-card__name {
          display: block;
          font-style: normal;
          font-weight: 600;
          color: var(--white);
          font-size: var(--text-base);
        }
        .testimonial-card__location {
          font-size: var(--text-xs);
          color: var(--secondary-dark);
        }
        @media (max-width: 700px) {
          .testimonials__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
