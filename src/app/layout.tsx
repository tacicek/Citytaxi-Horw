import type { Metadata } from 'next'
import siteData from '@/data/site.json'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`),
  title: {
    template: `%s | ${siteData.company.name}`,
    default: siteData.company.name,
  },
  description: siteData.seo_defaults.default_description,
  openGraph: {
    siteName: siteData.company.name,
    locale: siteData.seo_defaults.locale,
    images: [{ url: siteData.seo_defaults.default_og_image }],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: siteData.company.favicon,
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
