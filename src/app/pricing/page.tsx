import type { Metadata } from 'next'
import pricingData from '@/data/pages/pricing.json'
import PricingTable from '@/components/sections/PricingTable'

export const metadata: Metadata = {
  title: pricingData.seo.title,
  description: pricingData.seo.description,
  alternates: { canonical: pricingData.seo.canonical },
  openGraph: pricingData.seo.og as any,
}

export default function PricingPage() {
  return (
    <>
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Transparent & Fair</span>
          <h1>{pricingData.headline}</h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--secondary-dark)', marginTop: '1.6rem' }}>{pricingData.subheadline}</p>
        </div>
      </section>
      <PricingTable />
    </>
  )
}
