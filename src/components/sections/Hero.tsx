'use client'

import homeData from '@/data/pages/home.json'
import homeImages from '@/data/images/home-images.json'

export default function Hero() {
  const { hero } = homeData

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

      <div className="container hero__content">
        {/* Badge */}
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          {hero.badge}
        </div>

        {/* Headline */}
        <h1 className="hero__headline">
          {hero.headline}
          <span className="hero__headline-sub">{hero.subheadline}</span>
        </h1>

        <p className="hero__desc">{hero.description}</p>

        {/* Phone */}
        <a href={`tel:${hero.phone}`} className="hero__phone" aria-label="Jetzt anrufen">
          <span className="hero__phone-icon">📞</span>
          <div>
            <span className="hero__phone-label">Jetzt anrufen</span>
            <span className="hero__phone-num">{hero.phone_display}</span>
          </div>
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>

      <style jsx>{`
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
          background: linear-gradient(
            135deg,
            rgba(0,0,0,0.85) 0%,
            rgba(0,0,0,0.60) 50%,
            rgba(0,0,0,0.45) 100%
          );
        }
        .hero__content {
          position: relative; z-index: 1;
          padding-block: var(--section-y-lg);
          max-width: 72rem;
        }
        .hero__badge {
          display: inline-flex; align-items: center; gap: 0.8rem;
          background: rgba(200,169,110,0.15); border: 1px solid rgba(200,169,110,0.4);
          color: var(--accent); padding: 0.6rem 1.6rem; border-radius: var(--radius-pill);
          font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 2.4rem;
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
          margin-block: 2.4rem; max-width: 52rem;
        }
        .hero__phone {
          display: inline-flex; align-items: center; gap: 1.2rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(192,192,192,0.2);
          padding: 1.2rem 2rem; border-radius: var(--radius-lg);
          transition: all var(--transition); backdrop-filter: blur(8px);
        }
        .hero__phone:hover { background: rgba(200,169,110,0.15); border-color: var(--accent); }
        .hero__phone-icon { font-size: 2.4rem; }
        .hero__phone > div { display: flex; flex-direction: column; }
        .hero__phone-label {
          font-size: var(--text-xs); color: var(--secondary-dark);
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .hero__phone-num { font-size: var(--text-xl); font-weight: 700; color: var(--white); letter-spacing: 0.04em; }
        .hero__scroll {
          position: absolute; bottom: 3.2rem; left: 50%; transform: translateX(-50%); z-index: 1;
        }
        .hero__scroll span {
          display: block; width: 2px; height: 40px;
          background: linear-gradient(to bottom, var(--accent), transparent);
          margin: 0 auto; animation: scrollAnim 2s ease infinite;
        }
        @keyframes scrollAnim {
          0%  { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100%{ transform: scaleY(0); transform-origin: bottom; }
        }
        @media (max-width: 768px) { .hero__bg-img { object-position: center center; } }
        @media (max-width: 600px) { .hero__desc { font-size: var(--text-base); } }
      `}</style>
    </section>
  )
}
