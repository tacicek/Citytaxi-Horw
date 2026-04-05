import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Temel validasyon
    const required = ['pickup', 'destination', 'date', 'time', 'name', 'phone']
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return NextResponse.json(
          { success: false, error: `Pflichtfeld fehlt: ${field}` },
          { status: 400 }
        )
      }
    }

    // Geçmiş tarih kontrolü
    const bookingDate = new Date(`${data.date}T${data.time}`)
    if (bookingDate < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Das Datum liegt in der Vergangenheit.' },
        { status: 400 }
      )
    }

    // TODO: Buraya gerçek bildirim entegrasyonu eklenecek
    // Seçenekler:
    //   1. SMTP ile e-posta gönder (nodemailer / Resend / SendGrid)
    //   2. WhatsApp Business API
    //   3. Telegram Bot API
    //   4. Supabase veritabanına kaydet
    //
    // Şimdilik konsola yaz (geliştirme modu):
    if (process.env.NODE_ENV === 'development') {
      console.log('[BookingRequest]', {
        pickup: data.pickup,
        destination: data.destination,
        date: data.date,
        time: data.time,
        passengers: data.passengers,
        service: data.service,
        name: data.name,
        phone: data.phone,
        notes: data.notes,
        receivedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BookingAPI] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Serverfehler. Bitte telefonisch buchen.' },
      { status: 500 }
    )
  }
}
