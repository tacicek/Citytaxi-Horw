import type { Metadata } from 'next'
import galleryData from '@/data/pages/gallery.json'
import GalleryClientPage from './GalleryClientPage'

export const metadata: Metadata = {
  title: galleryData.seo.title,
  description: galleryData.seo.description,
  keywords: 'Citytaxi Horw Galerie, Taxi Fahrzeuge Luzern, Limousine Fotos, Taxiflotte Horw',
  alternates: { canonical: galleryData.seo.canonical },
  openGraph: {
    type: 'website',
    title: galleryData.seo.og.title,
    description: galleryData.seo.og.description,
    url: galleryData.seo.og.url,
    images: [{
      url: '/assets/og-default.jpg',
      width: 1200,
      height: 630,
      alt: 'Citytaxi Horw – Fahrzeugflotte',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: galleryData.seo.og.title,
    description: galleryData.seo.og.description,
  },
}

export default function GalleryPage() {
  return <GalleryClientPage />
}
