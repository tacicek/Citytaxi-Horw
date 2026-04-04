# Citytaxi Horw – Website

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Playfair Display
**Domain:** citytaxihorw.ch
**Sprache:** Deutsch / Englisch

---

## Schnellstart

```bash
npm install
cp .env.example .env.local
# → .env.local Datei ausfüllen
npm run dev
# → http://localhost:3000
```

---

## Inhalt aktualisieren (JSON-Dateien)

### Telefon / Email / Adresse
→ `data/site.json` → Abschnitt `contact`

### Logo ersetzen
→ `public/assets/logo.svg` durch echte Logo-Datei ersetzen
→ Gleiches Dateiformat (SVG/PNG) und gleicher Pfad beibehalten

### Navigation anpassen
→ `data/site.json` → Abschnitt `navigation.links`

### Preise aktualisieren
→ `data/pages/pricing.json` → `tariffs[]` und `fixed_prices[]`

### Dienstleistungen anpassen
→ `data/pages/services.json` → `services[]`
→ Neuen Service hinzufügen: neues Objekt in `services[]` Array einfügen

### Kundenbewertungen
→ `data/pages/home.json` → `testimonials[]`

### Blog-Beiträge
→ `data/pages/blog.json` → `posts[]`

### Bilder ändern
→ `data/images/home-images.json` — Startseiten-Bilder
→ `data/images/gallery-images.json` — Fahrzeug-Galerie
→ `data/images/services-images.json` — Dienstleistungsbilder
→ Einfach die `url`-Felder mit eigenen Bild-URLs ersetzen

### SEO (Titel / Beschreibung) pro Seite
→ `data/pages/[seite].json` → Abschnitt `seo`

---

## WhatsApp Telefonnummer setzen

In `data/site.json`:
```json
"contact": {
  "phone": "+41 41 XXX XX XX",
  "whatsapp": "+41 41 XXX XX XX"
}
```

---

## Docker / Coolify Deployment

```bash
# Lokal testen
docker compose up --build

# Coolify
# 1. Coolify Dashboard → New Resource → Docker Compose
# 2. Git Repo verbinden (GitHub / GitLab) oder ZIP hochladen
# 3. Environment Variables aus .env.example befüllen
# 4. Domain hinzufügen → SSL automatisch (Let's Encrypt via Traefik)
# 5. Deploy starten
```

---

## Verzeichnisstruktur

```
citytaxihorw/
├── data/
│   ├── site.json              ← Firma, Kontakt, Navigation, SEO-Defaults
│   ├── pages/
│   │   ├── home.json          ← Startseite: Hero, Features, Testimonials
│   │   ├── about.json         ← Über uns: Werte, Team, Stats
│   │   ├── services.json      ← Alle Dienstleistungen
│   │   ├── pricing.json       ← Preise & Tarife
│   │   ├── contact.json       ← Kontaktformular, Maps
│   │   ├── booking.json       ← Buchungsformular
│   │   ├── gallery.json       ← Galerie-Kategorien
│   │   └── blog.json          ← Blog-Beiträge
│   └── images/
│       ├── home-images.json   ← Hero & Startseiten-Bilder
│       ├── gallery-images.json← Fahrzeug-Galerie
│       └── services-images.json ← Dienstleistungsbilder
├── public/assets/
│   ├── logo.svg               ← Firmenlogo (ersetzen!)
│   └── og-default.jpg         ← Social Media Bild (ersetzen!)
├── src/
│   ├── app/                   ← Next.js App Router Seiten
│   ├── components/
│   │   ├── layout/            ← Navbar, Footer
│   │   ├── sections/          ← Hero, ServiceCards, Testimonials, etc.
│   │   └── ui/                ← WhatsApp Button
│   └── styles/globals.css     ← Design Tokens + Reset
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Noch ausstehend (nach Übergabe zu befüllen)

- [ ] Echte Telefonnummer in `data/site.json` eintragen
- [ ] Logo-Datei durch hochauflösendes Original ersetzen
- [ ] `og-default.jpg` (1200×630px) erstellen
- [ ] Google Maps Embed-URL mit echtem Standort ersetzen
- [ ] WhatsApp-Nummer verifizieren
- [ ] SMTP-Zugangsdaten für Formular-Benachrichtigungen eintragen
- [ ] Google Analytics ID eintragen
- [ ] SSL-Zertifikat via Coolify/Traefik aktivieren
