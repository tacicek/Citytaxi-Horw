import type { Metadata } from 'next'
import servicesData from '@/data/pages/services.json'
import ServiceCards from '@/components/sections/ServiceCards'

export const metadata: Metadata = {
  title: servicesData.seo.title,
  description: servicesData.seo.description,
  alternates: { canonical: servicesData.seo.canonical },
  openGraph: servicesData.seo.og as any,
}

export default function ServicesPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md))' }}>
          <span className="section-label">Was wir anbieten</span>
          <h1>{servicesData.headline}</h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--secondary-dark)', marginTop: '1.6rem' }}>{servicesData.subheadline}</p>
        </div>
      </section>

      <ServiceCards showHeader={false} />
    </>
  )
}
