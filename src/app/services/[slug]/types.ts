export interface ServiceDetail {
  seo: { title: string; description: string; canonical: string }
  hero_label: string
  hero_title: string
  hero_subtitle: string
  intro: string
  features_title: string
  features: { icon: string; title: string; text: string }[]
  process_title: string
  process: { step: string; title: string; text: string }[]
  faq_title: string
  faq: { q: string; a: string }[]
  cta_title: string
  cta_text: string
}

export interface ServiceImageEntry {
  url: string
  alt: string
}
