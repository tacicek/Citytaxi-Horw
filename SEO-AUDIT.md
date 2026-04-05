# SEO Content Audit
## https://citytaxihorw.ch/ (Startseite / Homepage)
### Date: 2026-04-05

---

## SEO Health Score: 54/100

**Why this score:** The codebase shows solid on-page and structured-data preparation for a local taxi service, but **the live domain currently serves a Plesk default placeholder**, not the Next.js site. Until the real site is deployed and indexable, organic visibility is effectively zero. The score reflects that gap plus a few on-page and trust-signal improvements.

**Automated script:** `scripts/analyze_page.py` is not present in this repository; this audit combines a live URL fetch (2026-04-05) with review of `src/app/page.tsx`, `src/data/pages/home.json`, `src/app/layout.tsx`, `src/app/sitemap.ts`, and `src/app/robots.ts`.

---

## On-Page SEO Checklist

### Title Tag
- **Status:** Pass (for intended production HTML)
- **Current:** `Taxi Horw Luzern – 24/7 Taxi & Limousine | Citytaxi Horw`
- **Recommended:** Keep; optional micro-tweak for SERP testing: `Taxi Horw & Luzern – 24/7 buchen | Citytaxi Horw` (only if CTR tests show benefit).
- **Issues:**
  - Live URL does not return this title (Plesk default page).
  - Length is within a typical safe range (~50–60 characters); primary terms appear early; brand at the end.

### Meta Description
- **Status:** Pass / Needs Work
- **Current:** `Citytaxi Horw – Zuverlässiger Taxi- & Limousinenservice in Horw und Luzern. Flughafentransfer Zürich, Business & Stadtfahrten. ☎ 041 440 80 80`
- **Recommended:** Shorten slightly if previews truncate on mobile; keep phone CTA: `Taxi Horw & Luzern: Flughafen Zürich, Business, 24/7. Jetzt anrufen: 041 440 80 80 – Citytaxi Horw.`
- **Issues:** Strong local + service cues; verify rendered length in SERP preview tools. Emoji/symbol may display inconsistently across snippets.

### Heading Hierarchy
- **H1:** Single H1 in `Hero`: brand-focused (`Citytaxi Horw` + subheadline) — good structurally.
- **SEO nuance:** Title targets **“Taxi Horw / Luzern”**; H1 is mostly **brand name**. Related for users, but **primary money keywords are stronger in the title than in the H1**. Consider an H1 that still reads naturally, e.g. leading line “Taxi in Horw & Luzern” and second line brand/tagline — without keyword stuffing.
- **H2+:** Feature grid, services, testimonials, booking — logical sections; ensure subheads on the page include variants like “Flughafentransfer Luzern”, “Businessfahrten” where it matches visible copy.

### Image Optimization
- **Hero:** `picture` + WebP paths in `home-images.json`; descriptive `alt` for hero images — **Pass**.
- **Risk:** Confirm all referenced assets (`/assets/hero_desktop.webp`, OG paths) exist in production builds; broken images hurt UX and can affect engagement signals.
- **External:** Unsplash image for Luzern — ensure `alt` stays descriptive; lazy-load if below the fold.

### Internal Linking
- **Status:** Needs Work
- **Evidence:** Primary nav (`site.json`) links Startseite, Dienstleistungen, Über uns, Kontakt + CTA Booking. **Sitemap lists** `/gallery`, `/blog`, and blog posts — **these are weakly linked from the main nav**, which can limit crawl paths and user discovery.
- **Recommendation:** Add “Galerie” and “Blog” (or “Tipps”) to footer or secondary nav; link from homepage body to 1–2 pillar posts (e.g. Flughafentransfer).

### URL Structure
- **Status:** Pass
- **URL:** `https://citytaxihorw.ch/` — short, lowercase, clean, brand-appropriate.

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Experience | Present | Local focus (Horw, Luzern, Zürich airport), service-specific copy, testimonials with locations. |
| Expertise | Present | Clear service list, payment methods, 24/7 positioning; could add years-in-business or fleet detail on About. |
| Authoritativeness | Weak | `sameAs` in schema points to Facebook/Instagram; `site.json` has empty `facebook` / `instagram` strings — **align JSON-LD with real, verified profiles** or remove until live. |
| Trustworthiness | Present / Needs Work | Phone, email, address in data; **no dedicated Impressum/Datenschutz pages** called out in this audit scope — for CH sites, legal pages strongly support trust and compliance. |

---

## Keyword Analysis

- **Primary keyword:** Taxi Horw (with Luzern / Flughafentransfer as strong secondary).
- **Search intent:** Mixed **transactional + local navigational** — users want to book or call a taxi; the page matches with CTAs, phone, booking links.
- **Keyword placement:**
  - Title: strong.
  - H1: brand-heavy; **improve keyword alignment** (see above).
  - First visible copy: hero description mentions Horw, Luzern, Flughafentransfers — good.
  - Meta description: good coverage.
  - URL: brand domain; acceptable for local brand queries.
- **Secondary keywords to weave naturally:** Flughafentransfer Zürich, Taxi Luzern, Taxiservice 24/7, Limousine Luzern, Kriens, Emmen, Businessfahrt, Zentralschweiz.

---

## Technical SEO

### Live site (critical)
- **Fetched 2026-04-05:** `https://citytaxihorw.ch/` returns **“Default PLESK Page”** — **Fail** for indexing, canonicals, and user trust. **Deploy the Next app** to this host or point DNS to the correct deployment.

### Robots.txt (`src/app/robots.ts`)
- Allows `/`, disallows `/api/` and `/_next/`.
- **Note:** Blocking `/_next/` is common but can be controversial for crawlers that request assets; with SSR/SSG, main HTML usually suffices — monitor Search Console for “blocked resource” warnings.

### XML Sitemap (`src/app/sitemap.ts`)
- **Pass** structurally: homepage, core pages, blog URLs with priorities.
- After go-live: submit in Google Search Console; ensure `lastModified` reflects real updates (avoid everything “now” if content is static for months).

### Canonicals
- Homepage sets `alternates.canonical` to `https://citytaxihorw.ch/` in page metadata — good **once** the site is live.
- Root layout also defines `alternates.canonical` to `BASE_URL` — verify merged metadata per page does not confuse non-home routes (Next typically merges; spot-check `/services`, `/contact`).

### Page speed / Core Web Vitals
- **Not measured** in this audit (no production build URL). Hero full-viewport image: ensure compression, `fetchpriority` for LCP image if needed, and stable dimensions to limit CLS.

### Mobile
- Next.js + responsive patterns expected; confirm viewport via rendered HTML after deploy.

---

## Content Gap Analysis

| Missing Topic | Volume potential | Competition | Content type | Priority |
|---------------|------------------|-------------|--------------|----------|
| Pinned FAQ (Preise, Stornierung, Flughafen Treffpunkt) | Med | Med | Homepage FAQ + FAQ schema | 1 |
| Stadtteile / Fahrgebiet (Kriens, Meggen, etc.) | Med | Med | Landing or services subsection | 2 |
| Flughafen Zürich feste Richtpreise / Ablauf | High | High | Blog + service deep-link | 3 |
| Firmenkunden / Rechnung | Low–Med | Med | Services + optional PDF | 4 |

---

## Featured Snippet Opportunities

- Add an **H2** such as “Wie buche ich ein Taxi in Horw?” with a **40–60 word** direct answer, then bullet steps (phone, WhatsApp, booking form).
- **List snippet:** “Was kostet ein Flughafentransfer?” — short bullet factors (Distanz, Uhrzeit, Gepäck) if you avoid unverifiable fixed prices.

---

## Schema Markup

| Type | Status | Notes |
|------|--------|--------|
| TaxiService (JSON-LD on homepage) | Present | Good fit for business type; address/geo/hours present. |
| AggregateRating | **Risk** | Schema includes **5.0 / 47 reviews**; Google expects ratings to reflect **verifiable, on-page review content**. Testimonials exist but are not marked up as individual `Review` items. **Validate** in [Rich Results Test](https://search.google.com/test/rich-results); remove or adjust if not eligible. |
| LocalBusiness / subtypes | Optional | Could add `LocalBusiness` or more specific subtype if aligned with Google guidelines. |
| Organization | Partial | Company data in graph; ensure consistency sitewide. |
| BreadcrumbList | Missing | Add if you implement visible breadcrumbs on inner pages. |

---

## Internal Linking Opportunities

1. **Homepage → Blog:** Link “Flughafentransfer-Tipps” from the Flughafen feature card or hero-adjacent text.
2. **Nav/Footer:** Add Gallery + Blog for pages already in the sitemap.
3. **Services ↔ Booking:** Ensure every service section has a persistent “Jetzt buchen” path (button + text link).

---

## Core Web Vitals

- **Assessment:** Not measured on production (site not live on domain).
- **Revenue impact (reference):** Faster LCP and lower CLS correlate with lower bounce and better conversion — especially important for mobile taxi searches.

---

## Content Strategy Recommendations

1. **Cadence:** 1–2 localized posts/month (Flughafen, Events Luzern, Business) if resources allow.
2. **Updates:** Refresh opening hours, phone, and service list in JSON and schema together.
3. **Social proof:** If using `AggregateRating`, mirror eligibility with visible reviews (or link to Google Business profile).

---

## Prioritized Recommendations

### Critical (Fix Immediately)
1. **Deploy the real Next.js site** to `citytaxihorw.ch` (or update DNS/hosting). Until then, no meaningful SEO for this domain.
2. **Fix OG/image asset consistency** — `site.json` references `default_og_image: /assets/og-image.jpg`; homepage OG uses `/assets/og-default.jpg`. Ensure **one canonical OG file** exists and matches metadata to avoid 404s in social previews.

### High Priority (This Month)
1. **Align H1 with target queries** while keeping the brand (e.g. include “Taxi Horw” or “Taxi in Horw & Luzern” in the visible H1).
2. **Resolve schema `sameAs` and social fields** — populate real URLs in `site.json` or remove from structured data to avoid misleading signals.
3. **Review `AggregateRating` eligibility** and adjust schema to Google’s review guidelines.

### Medium Priority (This Quarter)
1. **Strengthen internal links** to `/blog` and `/gallery` from global navigation or footer.
2. **Add FAQ block + FAQPage schema** for high-intent local questions.
3. **Legal/trust pages** (Impressum, Datenschutz) if not already planned — supports E-E-A-T and CH expectations.

### Low Priority (When Resources Allow)
1. SERP A/B tests on title/description wording (CTR).
2. BreadcrumbList on deeper pages.
3. Core Web Vitals measurement post-launch and LCP optimization on hero.

---

*End of audit.*
