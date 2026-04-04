'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import siteData from '@/data/site.json'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { navigation, contact } = siteData

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}
      role="banner"
    >
      <div className="container navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo" aria-label={siteData.company.name}>
          <Image
            src={navigation.logo}
            alt={`${siteData.company.name} Logo`}
            width={160}
            height={46}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__links" aria-label="Hauptnavigation">
          {navigation.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="navbar__link"
            >
              {link.label_de}
            </Link>
          ))}
        </nav>

        {/* Right: Phone + CTA */}
        <div className="navbar__actions">
          <a href={`tel:${contact.phone}`} className="navbar__phone" aria-label="Anrufen">
            <span className="navbar__phone-icon">📞</span>
            <span className="navbar__phone-num">{contact.phone_display}</span>
          </a>
          <Link href={navigation.cta.href} className="btn btn-primary navbar__cta">
            {navigation.cta.label}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menü öffnen"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile" role="dialog" aria-label="Mobile Navigation">
          <nav>
            {navigation.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label_de}
              </Link>
            ))}
            <a href={`tel:${contact.phone}`} className="navbar__mobile-link navbar__mobile-phone">
              📞 {contact.phone_display}
            </a>
            <Link
              href={navigation.cta.href}
              className="btn btn-primary"
              style={{ marginTop: '1.6rem', justifyContent: 'center' }}
              onClick={() => setMenuOpen(false)}
            >
              {navigation.cta.label}
            </Link>
          </nav>
        </div>
      )}

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: var(--z-nav);
          padding: 1.4rem 0;
          background: transparent;
          transition: background var(--transition), box-shadow var(--transition), padding var(--transition);
        }
        .navbar--scrolled {
          background: rgba(10,10,10,0.97);
          box-shadow: 0 2px 20px rgba(0,0,0,0.5);
          padding: 1rem 0;
          backdrop-filter: blur(12px);
        }
        .navbar__inner {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .navbar__logo { flex-shrink: 0; }
        .navbar__links {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex: 1;
          justify-content: center;
        }
        /* :global — Next.js Link is not scoped by styled-jsx; nav links otherwise inherit body text color and disappear on the hero. */
        :global(.navbar__link) {
          padding: 0.6rem 1.2rem;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--white);
          border-radius: var(--radius-sm);
          transition: color var(--transition);
          letter-spacing: 0.03em;
        }
        :global(.navbar__link:hover) { color: var(--accent); }
        .navbar__actions {
          display: flex;
          align-items: center;
          gap: 1.6rem;
          flex-shrink: 0;
        }
        .navbar__phone {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--secondary);
          transition: color var(--transition);
        }
        .navbar__phone:hover { color: var(--accent); }
        .navbar__phone-icon { font-size: 1.4rem; }
        .navbar__cta { padding: 1rem 2rem; font-size: 1.2rem; }
        .navbar__hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0.8rem;
          margin-left: auto;
        }
        .navbar__hamburger span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--secondary);
          transition: all var(--transition);
        }
        .navbar__hamburger.is-open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .navbar__hamburger.is-open span:nth-child(2) { opacity: 0; }
        .navbar__hamburger.is-open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        .navbar__mobile {
          background: rgba(10,10,10,0.99);
          padding: 2rem 2.4rem;
          border-top: 1px solid rgba(192,192,192,0.15);
        }
        :global(.navbar__mobile-link) {
          display: block;
          padding: 1.2rem 0;
          font-size: var(--text-base);
          color: var(--secondary-light);
          border-bottom: 1px solid rgba(192,192,192,0.1);
          transition: color var(--transition);
        }
        :global(.navbar__mobile-link:hover) { color: var(--accent); }
        .navbar__mobile-phone { font-weight: 600; }
        @media (max-width: 900px) {
          .navbar__links, .navbar__phone { display: none; }
          .navbar__hamburger { display: flex; }
          .navbar__cta { display: none; }
        }
      `}</style>
    </header>
  )
}
