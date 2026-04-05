import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
