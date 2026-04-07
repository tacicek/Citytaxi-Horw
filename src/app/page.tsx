import type { Metadata } from 'next'
import homeData from '@/data/pages/home.json'
import Hero from '@/components/sections/Hero'
import FeatureGrid from '@/components/sections/FeatureGrid'
import ServiceCards from '@/components/sections/ServiceCards'
import Testimonials from '@/components/sections/Testimonials'

export const metadata: Metadata = {
  title: homeData.seo.title,
  description: homeData.seo.description,
  alternates: { canonical: homeData.seo.canonical },
  openGraph: homeData.seo.og as any,
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeData.seo.schema) }}
      />
      <Hero />
      <FeatureGrid />
      <ServiceCards limit={3} showHeader={true} />
      <Testimonials />
    </>
  )
}
