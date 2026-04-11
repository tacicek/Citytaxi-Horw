import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import servicesData from '@/data/pages/services.json'
import servicesImages from '@/data/images/services-images.json'
import siteData from '@/data/site.json'
import ServiceDetailClient from './ServiceDetailClient'

const BASE_URL = `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`

export function generateStaticParams() {
  return servicesData.services.map((s) => ({ slug: s.slug }))
}

function getService(slug: string) {
  return servicesData.services.find((s) => s.slug === slug) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}

  const d = service.detail
  return {
    title: d.seo.title,
    description: d.seo.description,
    alternates: { canonical: d.seo.canonical },
    openGraph: {
      title: d.seo.title,
      description: d.seo.description,
      url: d.seo.canonical,
      images: [{ url: `${BASE_URL}/assets/og-default.jpg`, width: 1200, height: 630 }],
    },
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const img = servicesImages[service.image_key as keyof typeof servicesImages]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.detail.seo.description,
    url: service.detail.seo.canonical,
    provider: {
      '@type': 'TaxiService',
      name: siteData.company.name,
      url: BASE_URL,
      telephone: siteData.contact.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: siteData.contact.address.street,
        addressLocality: siteData.contact.address.city,
        postalCode: siteData.contact.address.zip,
        addressCountry: siteData.contact.address.country,
      },
      openingHours: 'Mo-Su 00:00-24:00',
      areaServed: { '@type': 'City', name: 'Luzern' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ServiceDetailClient service={service} img={img} />
    </>
  )
}
