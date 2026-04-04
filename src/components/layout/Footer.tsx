'use client'

import Link from 'next/link'
import Image from 'next/image'
import siteData from '@/data/site.json'

export default function Footer() {
  const { company, contact, navigation, social } = siteData
  const year = new Date().getFullYear()

  return (
    <footer className="footer section-dark">
      <div className="container footer__grid">
        {/* Brand */}
        <div className="footer__brand">
          <Image src={company.logo} alt={company.name} width={160} height={46} />
          <p className="footer__tagline">{company.tagline}</p>
          <div className="footer__social">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer__col">
          <h4 className="footer__heading">Navigation</h4>
          <ul className="footer__list">
            {navigation.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="footer__link">{link.label_de}</Link>
              </li>
            ))}
            <li><Link href="/booking" className="footer__link footer__link--cta">Taxi Bestellen</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div className="footer__col">
          <h4 className="footer__heading">Dienstleistungen</h4>
          <ul className="footer__list">
            <li><Link href="/services#flughafentransfer" className="footer__link">Flughafentransfer</Link></li>
            <li><Link href="/services#businessfahrten" className="footer__link">Business Fahrten</Link></li>
            <li><Link href="/services#limousinenservice" className="footer__link">Limousinenservice</Link></li>
            <li><Link href="/services#stadtfahrten" className="footer__link">Stadtfahrten</Link></li>
            <li><Link href="/services#events-und-ausfluge" className="footer__link">Events & Ausflüge</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__col">
          <h4 className="footer__heading">Kontakt</h4>
          <ul className="footer__contact-list">
            <li>
              <span>📞</span>
              <a href={`tel:${contact.phone}`} className="footer__link">{contact.phone_display}</a>
            </li>
            <li>
              <span>✉️</span>
              <a href={`mailto:${contact.email}`} className="footer__link">{contact.email}</a>
            </li>
            <li>
              <span>📍</span>
              <span>{contact.address.zip} {contact.address.city}, {contact.address.country_name}</span>
            </li>
            <li>
              <span>🕐</span>
              <span>{contact.hours.note}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} {company.name}. Alle Rechte vorbehalten.</p>
          <div className="footer__bottom-links">
            <Link href="/datenschutz" className="footer__link">Datenschutz</Link>
            <Link href="/impressum" className="footer__link">Impressum</Link>
            <Link href="/agb" className="footer__link">AGB</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          padding-top: var(--section-y-lg);
          padding-bottom: 0;
          border-top: 1px solid rgba(192,192,192,0.15);
        }
        .footer__grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          gap: 4rem;
          padding-bottom: var(--section-y-md);
        }
        .footer__tagline {
          margin-top: 1.6rem;
          font-size: var(--text-sm);
          color: var(--secondary-dark);
          line-height: 1.7;
          max-width: 28rem;
        }
        .footer__social {
          display: flex;
          gap: 1.2rem;
          margin-top: 2rem;
        }
        .footer__social a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background: rgba(192,192,192,0.1);
          color: var(--secondary);
          transition: all var(--transition);
        }
        .footer__social a:hover {
          background: var(--accent);
          color: var(--primary);
        }
        .footer__heading {
          font-family: var(--font-heading);
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--secondary-light);
          margin-bottom: 1.6rem;
        }
        .footer__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .footer__link {
          font-size: var(--text-sm);
          color: var(--secondary-dark);
          transition: color var(--transition);
        }
        .footer__link:hover { color: var(--accent); }
        .footer__link--cta { color: var(--accent); font-weight: 600; }
        .footer__contact-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .footer__contact-list li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          font-size: var(--text-sm);
          color: var(--secondary-dark);
        }
        .footer__contact-list span:first-child { font-size: 1.6rem; flex-shrink: 0; margin-top: 0.1rem; }
        .footer__bottom {
          border-top: 1px solid rgba(192,192,192,0.1);
          padding: 2rem 0;
        }
        .footer__bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--text-xs);
          color: var(--text-light);
        }
        .footer__bottom-links {
          display: flex;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .footer__grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .footer__grid { grid-template-columns: 1fr; }
          .footer__bottom-inner { flex-direction: column; gap: 1rem; text-align: center; }
        }
      `}</style>
    </footer>
  )
}
