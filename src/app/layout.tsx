import type { Metadata } from 'next'
import siteData from '@/data/site.json'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import '@/styles/globals.css'

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'
const BASE_URL = `https://${DOMAIN}`

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: `%s | ${siteData.company.name}`,
    default: `${siteData.company.name} – Taxi & Limousine Luzern`,
  },
  description: siteData.seo_defaults.default_description,
  keywords: [
    'Taxi Horw', 'Taxi Luzern', 'Taxiservice Horw', 'Flughafentransfer Luzern',
    'Taxi Zentralschweiz', 'Limousinenservice Luzern', 'Business Taxi Luzern',
    'Taxi 24/7', 'Citytaxi Horw', 'Taxi buchen Luzern'
  ],
  authors: [{ name: siteData.company.name, url: BASE_URL }],
  creator: siteData.company.name,
  publisher: siteData.company.name,
  alternates: {
    languages: { 'de-CH': BASE_URL },
  },
  openGraph: {
    type: 'website',
    siteName: siteData.company.name,
    locale: siteData.seo_defaults.locale,
    url: BASE_URL,
    title: `${siteData.company.name} – Taxi & Limousine Luzern`,
    description: siteData.seo_defaults.default_description,
    images: [{
      url: siteData.seo_defaults.default_og_image,
      width: 1200,
      height: 630,
      alt: `${siteData.company.name} – Taxi & Limousine`,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteData.company.name} – Taxi & Limousine Luzern`,
    description: siteData.seo_defaults.default_description,
    images: [siteData.seo_defaults.default_og_image],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [
      { url: siteData.company.favicon, type: 'image/x-icon' },
    ],
    apple: '/assets/apple-touch-icon.png',
  },
  other: {
    'geo.region': 'CH-LU',
    'geo.placename': 'Horw, Luzern',
    'geo.position': '47.0136;8.3083',
    'ICBM': '47.0136, 8.3083',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  )
}
