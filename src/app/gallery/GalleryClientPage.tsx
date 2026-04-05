'use client'

import { useState } from 'react'
import galleryData from '@/data/pages/gallery.json'
import galleryImages from '@/data/images/gallery-images.json'

export default function GalleryClientPage() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter((img) => img.category === activeCategory)

  return (
    <>
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Unsere Fahrzeuge</span>
          <h1>{galleryData.headline}</h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--secondary-dark)', marginTop: '1.6rem' }}>
            {galleryData.subheadline}
          </p>
        </div>
      </section>

      <section className="gallery section-y">
        <div className="container">
          {/* Filter Tabs */}
          <div className="gallery__filters">
            {galleryData.categories.map((cat) => (
              <button
                key={cat.id}
                className={`gallery__filter-btn ${activeCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="gallery__grid">
            {filtered.map((img) => (
              <article key={img.id} className="gallery__item">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="gallery__img"
                  loading="lazy"
                />
                <div className="gallery__caption">{img.caption}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .gallery__filters {
          display: flex;
          gap: 1.2rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 4rem;
        }
        .gallery__filter-btn {
          padding: 0.8rem 2.4rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-pill);
          background: transparent;
          font-family: var(--font-body);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition);
        }
        .gallery__filter-btn:hover,
        .gallery__filter-btn.is-active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
        }
        .gallery__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.6rem;
        }
        .gallery__item {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 4/3;
          cursor: pointer;
        }
        .gallery__item:hover .gallery__img { transform: scale(1.08); }
        .gallery__item:hover .gallery__caption { opacity: 1; }
        .gallery__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .gallery__caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          color: var(--white);
          padding: 2rem 1.6rem 1.4rem;
          font-size: var(--text-sm);
          font-weight: 500;
          opacity: 0;
          transition: opacity var(--transition);
        }
        @media (max-width: 900px) { .gallery__grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .gallery__grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}
