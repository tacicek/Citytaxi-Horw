import type { Metadata } from 'next'
import aboutData from '@/data/pages/about.json'
import homeImages from '@/data/images/home-images.json'
import Link from 'next/link'

export const metadata: Metadata = {
  title: aboutData.seo.title,
  description: aboutData.seo.description,
  alternates: { canonical: aboutData.seo.canonical },
  openGraph: aboutData.seo.og as any,
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Unsere Geschichte</span>
          <h1>{aboutData.headline}</h1>
        </div>
      </section>

      {/* Intro */}
      <section className="section-y">
        <div className="container about-layout">
          <div className="about-text">
            <span className="section-label">Wer wir sind</span>
            <h2>Ihr vertrauensvoller Fahrpartner seit über 10 Jahren</h2>
            <p>{aboutData.intro}</p>
            <Link href="/booking" className="btn btn-primary" style={{ marginTop: '2.4rem', display: 'inline-flex' }}>
              Taxi Bestellen
            </Link>
          </div>
          <div className="about-img">
            <img
              src={homeImages.luzern_city.url}
              alt={homeImages.luzern_city.alt}
              className="about-img__photo"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats section-dark section-y">
        <div className="container stats__grid">
          {aboutData.stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-item__number">{stat.number}</span>
              <span className="stat-item__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section-y">
        <div className="container">
          <div className="values__header">
            <span className="section-label">Was uns ausmacht</span>
            <h2>Unsere Werte</h2>
          </div>
          <div className="values__grid">
            {aboutData.values.map((value) => (
              <div key={value.title} className="value-card">
                <span className="value-card__icon">{value.icon}</span>
                <h3 className="value-card__title">{value.title}</h3>
                <p className="value-card__desc">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
