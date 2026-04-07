import type { MetadataRoute } from 'next'

const BASE = `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/booking`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/live`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/standort`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Blog posts
    {
      url: `${BASE}/blog/flughafentransfer-tipps`,
      lastModified: new Date('2024-03-15'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE}/blog/luzern-highlights`,
      lastModified: new Date('2024-02-20'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE}/blog/businessfahrt-richtig-buchen`,
      lastModified: new Date('2024-01-10'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
