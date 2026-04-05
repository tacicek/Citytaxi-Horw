import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import blogData from '@/data/pages/blog.json'
import blogImages from '@/data/images/blog-images.json'

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'
const BASE = `https://${DOMAIN}`

type BlogPost = (typeof blogData.posts)[number] & { body?: string[] }

function getPost(slug: string): BlogPost | undefined {
  return blogData.posts.find((p) => p.slug === slug) as BlogPost | undefined
}

export function generateStaticParams() {
  return blogData.posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const url = `${BASE}/blog/${post.slug}`
  return {
    title: `${post.title} | Citytaxi Horw`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const img = blogImages[post.image_key as keyof typeof blogImages]
  const paragraphs =
    post.body && post.body.length > 0 ? post.body : [post.excerpt]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Citytaxi Horw' },
    publisher: { '@type': 'Organization', name: 'Citytaxi Horw' },
    image: img?.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/blog/${post.slug}` },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article>
        <section className="page-hero section-dark">
          <div
            className="container"
            style={{
              textAlign: 'center',
              paddingTop: 'calc(var(--nav-height) + var(--section-y-md))',
              paddingBottom: 'var(--section-y-md)',
            }}
          >
            <p style={{ marginBottom: '1rem' }}>
              <Link
                href="/blog"
                style={{
                  color: 'var(--accent)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                ← Zurück zum Blog
              </Link>
            </p>
            <span className="section-label">{post.category}</span>
            <h1 style={{ maxWidth: '52rem', margin: '0 auto' }}>{post.title}</h1>
            <p
              style={{
                marginTop: '1.6rem',
                color: 'var(--secondary-dark)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('de-CH', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <span> · </span>
              <span>{post.read_time} Lesezeit</span>
            </p>
          </div>
        </section>

        <section className="section-y">
          <div className="container" style={{ maxWidth: '72rem' }}>
            {img ? (
              <img
                src={img.url}
                alt={img.alt}
                className="about-img__photo"
                style={{ marginBottom: '3.2rem' }}
                loading="eager"
              />
            ) : null}
            <div className="about-text" style={{ maxWidth: '65ch' }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: '1.6rem', lineHeight: 1.75 }}>
                  {p}
                </p>
              ))}
            </div>
            <div style={{ marginTop: '3.2rem' }}>
              <Link href="/booking" className="btn btn-primary">
                Taxi buchen
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  )
}
