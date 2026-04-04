import type { Metadata } from 'next'
import bookingData from '@/data/pages/booking.json'
import BookingForm from '@/components/sections/BookingForm'

export const metadata: Metadata = {
  title: bookingData.seo.title,
  description: bookingData.seo.description,
  alternates: { canonical: bookingData.seo.canonical },
  openGraph: bookingData.seo.og as any,
}

export default function BookingPage() {
  return (
    <>
      <section className="page-hero section-dark">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-height) + var(--section-y-md))', paddingBottom: 'var(--section-y-md)' }}>
          <span className="section-label">Schnell & Einfach</span>
          <h1>{bookingData.headline}</h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--secondary-dark)', marginTop: '1.6rem' }}>
            {bookingData.subheadline}
          </p>
        </div>
      </section>
      <BookingForm />
    </>
  )
}
