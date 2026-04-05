import type { Metadata } from 'next'
import contactData from '@/data/pages/contact.json'
import ContactClientPage from './ContactClientPage'

export const metadata: Metadata = {
  title: contactData.seo.title,
  description: contactData.seo.description,
  keywords: 'Citytaxi Horw Kontakt, Taxi Horw Telefon, Taxi Luzern buchen, WhatsApp Taxi',
  alternates: { canonical: contactData.seo.canonical },
  openGraph: {
    type: 'website',
    title: contactData.seo.og.title,
    description: contactData.seo.og.description,
    url: contactData.seo.og.url,
    images: [{
      url: '/assets/og-default.jpg',
      width: 1200,
      height: 630,
      alt: 'Citytaxi Horw – Kontakt',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: contactData.seo.og.title,
    description: contactData.seo.og.description,
  },
}

export default function ContactPage() {
  return <ContactClientPage />
}
