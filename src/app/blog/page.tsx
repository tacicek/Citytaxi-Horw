import type { Metadata } from 'next'
import Link from 'next/link'
import blogData from '@/data/pages/blog.json'
import blogImages from '@/data/images/blog-images.json'

export const metadata: Metadata = {
  title: blogData.seo.title,
  description: blogData.seo.description,
  alternates: { canonical: blogData.seo.canonical },
  openGraph: blogData.seo.og as any,
}

export default function BlogPage() {
  return (
    <>
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Tipps & News</span>
          <h1>{blogData.headline}</h1>
        </div>
      </section>

      <section className="section-y">
        <div className="container">
          <div className="blog__grid">
            {blogData.posts.map((post) => {
              const img = blogImages[post.image_key as keyof typeof blogImages]
              return (
                <article key={post.slug} className="blog-card">
                  <div className="blog-card__img-wrap">
                    {img && (
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="blog-card__img"
                        loading="lazy"
                      />
                    )}
                    <span className="blog-card__category">{post.category}</span>
                  </div>
                  <div className="blog-card__body">
                    <div className="blog-card__meta">
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </time>
                      <span>·</span>
                      <span>{post.read_time} Lesezeit</span>
                    </div>
                    <h2 className="blog-card__title">{post.title}</h2>
                    <p className="blog-card__excerpt">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="blog-card__link">
                      Weiterlesen →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

    </>
  )
}
