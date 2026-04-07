/** Resend email notifications for booking requests — server-side only */

import { createHmac } from 'crypto'

const SITE_BASE_URL = `https://${process.env.NEXT_PUBLIC_DOMAIN ?? 'citytaxihorw.ch'}`

/**
 * Generate a tracking URL tied to a specific booking.
 * Token = HMAC(bookingId:exp, secret) — valid for ttlHours (default 24h).
 * Real invalidation happens when driver clicks "Müşteriyi Aldım" (status=picked_up).
 */
export function buildTrackingUrl(bookingId: string, ttlHours = 24): string {
  const secret = process.env.TRACKING_SECRET
  if (!secret) return `${SITE_BASE_URL}/live`
  const exp = (Date.now() + ttlHours * 3_600_000).toString()
  const token = createHmac('sha256', secret).update(`${bookingId}:${exp}`).digest('hex')
  return `${SITE_BASE_URL}/live?t=${token}&exp=${exp}&bid=${encodeURIComponent(bookingId)}`
}

export type BookingPayload = {
  pickup: string
  destination: string
  date: string
  time: string
  passengers: string
  service: string
  returnTrip?: boolean
  name: string
  phone: string
  email?: string
  flightNumber?: string
  luggage?: string
  notes?: string
  receivedAt: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Dispatch Email (to taxi operator — includes Annehmen button) ─────────────

export function buildDispatchEmailHtml(data: BookingPayload, bookingId: string): string {
  const driverToken = process.env.DRIVER_SECRET_TOKEN ?? ''
  const acceptUrl   = `${SITE_BASE_URL}/api/booking/accept?id=${encodeURIComponent(bookingId)}&t=${encodeURIComponent(driverToken)}`
  const rejectUrl   = `${SITE_BASE_URL}/api/booking/accept?id=${encodeURIComponent(bookingId)}&t=${encodeURIComponent(driverToken)}&action=reject`

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: 'Fahrttyp',   value: data.service,     highlight: true },
    { label: 'Abholort',   value: data.pickup,       highlight: true },
    { label: 'Zielort',    value: data.destination,  highlight: true },
    { label: 'Datum',      value: formatDate(data.date) },
    { label: 'Uhrzeit',    value: data.time },
    { label: 'Personen',   value: data.passengers },
    ...(data.returnTrip   ? [{ label: 'Rückfahrt',   value: 'Ja – bitte koordinieren' }] : []),
    ...(data.flightNumber ? [{ label: 'Flugnummer',  value: data.flightNumber }] : []),
    ...(data.luggage      ? [{ label: 'Gepäck',      value: data.luggage }] : []),
    { label: 'Kunde',      value: data.name,         highlight: true },
    { label: 'Telefon',    value: data.phone,         highlight: true },
    ...(data.email        ? [{ label: 'E-Mail',      value: data.email }] : []),
    ...(data.notes        ? [{ label: 'Anmerkungen', value: data.notes }] : []),
  ]

  const tableRows = rows.map(({ label, value, highlight }) => `
    <tr>
      <td style="padding:10px 16px;border:1px solid #e5e7eb;background:#f9f9f9;font-weight:600;font-size:13px;color:#555;width:150px;white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:10px 16px;border:1px solid #e5e7eb;font-size:${highlight ? '15px' : '14px'};font-weight:${highlight ? '600' : '400'};color:${highlight ? '#0a0a0a' : '#333'};">${escapeHtml(value)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">🚕 Citytaxi Horw</p>
            <p style="margin:8px 0 0;font-size:13px;color:#C8A96E;letter-spacing:1px;text-transform:uppercase;">Neue Fahrtanfrage</p>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:#C8A96E;padding:14px 36px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#0a0a0a;">
              📋 ${escapeHtml(data.name)} – ${escapeHtml(formatDate(data.date))} um ${escapeHtml(data.time)} Uhr
            </p>
          </td>
        </tr>

        <!-- Table -->
        <tr>
          <td style="padding:28px 36px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;">
              ${tableRows}
            </table>
          </td>
        </tr>

        <!-- Accept / Reject buttons -->
        <tr>
          <td style="padding:24px 36px 8px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">✅ Annehmen &amp; Tracking senden</a>
                </td>
                <td>
                  <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">❌ Ablehnen</a>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0;font-size:12px;color:#888;">Mit Klick auf „Annehmen" wird automatisch der Tracking-Link an den Kunden gesendet.</p>
          </td>
        </tr>

        <!-- Phone / Email buttons -->
        <tr>
          <td style="padding:16px 36px 8px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;">
                  <a href="tel:${escapeHtml(data.phone.replace(/\s/g, ''))}" style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">📞 Jetzt anrufen</a>
                </td>
                ${data.email ? `<td><a href="mailto:${escapeHtml(data.email)}" style="display:inline-block;background:#C8A96E;color:#0a0a0a;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">✉️ E-Mail senden</a></td>` : ''}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid #f0f0f0;margin-top:20px;">
            <p style="margin:0;font-size:12px;color:#888;">Eingegangen: ${escapeHtml(new Date(data.receivedAt).toLocaleString('de-CH'))} Uhr | citytaxihorw.ch</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Customer Pending Email (no tracking link — sent immediately on booking) ──

export function buildCustomerPendingHtml(data: BookingPayload): string {
  const firstName = escapeHtml(data.name.split(/\s+/)[0] || data.name)

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">🚕 Citytaxi Horw</p>
            <p style="margin:8px 0 0;font-size:13px;color:#C8A96E;letter-spacing:1px;text-transform:uppercase;">Anfrage eingegangen</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0a0a0a;">Guten Tag ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.7;">
              vielen Dank für Ihre Anfrage bei <strong>Citytaxi Horw</strong>. Wir haben folgende Fahrtdetails erhalten:
            </p>

            <!-- Booking summary card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Abholung</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.pickup)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Ziel</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.destination)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Datum & Uhrzeit</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(formatDate(data.date))} – ${escapeHtml(data.time)} Uhr</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Fahrttyp</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.service)}${data.returnTrip ? ' (inkl. Rückfahrt)' : ''}</p>
                </td>
              </tr>
            </table>

            <!-- Pending notice -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ec;border:1px solid #C8A96E;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#7a5a1a;line-height:1.7;font-weight:600;">⏳ Ihre Anfrage wird geprüft</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#7a5a1a;line-height:1.6;">
                    Sobald wir die Fahrt bestätigt haben, erhalten Sie eine weitere E-Mail mit dem Live-Tracking-Link.<br/>
                    Bei Dringlichkeit erreichen Sie uns direkt:
                  </p>
                  <p style="margin:10px 0 0;">
                    <a href="tel:+41415144444" style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;">📞 041 514 44 44</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Wir freuen uns, Sie bald fahren zu dürfen.<br/>Ihr <strong>Citytaxi Horw</strong> Team</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:16px 36px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#888;">Citytaxi Horw · Kantonsstrasse 130 · 6048 Horw · <a href="https://citytaxihorw.ch" style="color:#C8A96E;text-decoration:none;">citytaxihorw.ch</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Customer Tracking Email (with live tracking link — sent after driver accepts) ─

export function buildCustomerTrackingHtml(data: BookingPayload, bookingId: string): string {
  const firstName = escapeHtml(data.name.split(/\s+/)[0] || data.name)
  const trackingUrl = buildTrackingUrl(bookingId)

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">🚕 Citytaxi Horw</p>
            <p style="margin:8px 0 0;font-size:13px;color:#C8A96E;letter-spacing:1px;text-transform:uppercase;">Fahrt bestätigt ✅</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0a0a0a;">Guten Tag ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.7;">
              Ihre Fahrt wurde von unserem Fahrer <strong>bestätigt</strong>. Wir holen Sie wie vereinbart ab:
            </p>

            <!-- Booking summary card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Abholung</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.pickup)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Ziel</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.destination)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Datum & Uhrzeit</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(formatDate(data.date))} – ${escapeHtml(data.time)} Uhr</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Fahrttyp</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0a0a0a;">${escapeHtml(data.service)}${data.returnTrip ? ' (inkl. Rückfahrt)' : ''}</p>
                </td>
              </tr>
            </table>

            <!-- Live tracking CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;color:#C8A96E;text-transform:uppercase;letter-spacing:1px;">Live-Tracking</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#ffffff;font-weight:600;">Verfolgen Sie Ihr Taxi in Echtzeit</p>
                  <a href="${trackingUrl}" style="display:inline-block;background:#C8A96E;color:#0a0a0a;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">📍 Taxi jetzt verfolgen</a>
                </td>
              </tr>
            </table>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ec;border:1px solid #C8A96E;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#7a5a1a;line-height:1.6;">
                    Bei Fragen oder Änderungen erreichen Sie uns direkt:
                  </p>
                  <p style="margin:10px 0 0;">
                    <a href="tel:+41415144444" style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;">📞 041 514 44 44</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Wir freuen uns auf die Fahrt!<br/>Ihr <strong>Citytaxi Horw</strong> Team</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:16px 36px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#888;">Citytaxi Horw · Kantonsstrasse 130 · 6048 Horw · <a href="https://citytaxihorw.ch" style="color:#C8A96E;text-decoration:none;">citytaxihorw.ch</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Resend wrapper ───────────────────────────────────────────────────────────

type ResendResult = { ok: true } | { ok: false; error: string }

export async function sendViaResend(params: {
  to: string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<ResendResult> {
  const key  = process.env.RESEND_API_KEY
  const from = process.env.BOOKING_EMAIL_FROM
  if (!key || !from) {
    return { ok: false, error: 'E-Mail nicht konfiguriert (RESEND_API_KEY / BOOKING_EMAIL_FROM).' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` }
  }
  return { ok: true }
}

// ─── Public notification helpers ─────────────────────────────────────────────

/** Dispatch email to taxi operator with Annehmen/Ablehnen buttons. */
export async function notifyBookingDispatch(data: BookingPayload, bookingId: string): Promise<ResendResult> {
  const to = process.env.BOOKING_EMAIL_DISPATCH?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  if (to.length === 0) {
    return { ok: false, error: 'BOOKING_EMAIL_DISPATCH ist nicht konfiguriert.' }
  }
  return sendViaResend({
    to,
    subject: `🚕 Neue Fahrtanfrage – ${data.name} – ${formatDate(data.date)} ${data.time}`,
    html: buildDispatchEmailHtml(data, bookingId),
    replyTo: data.email?.trim() || undefined,
  })
}

/** Pending confirmation to customer — no tracking link yet. */
export async function notifyBookingCustomerPending(data: BookingPayload): Promise<ResendResult> {
  const email = data.email?.trim()
  if (!email) return { ok: true }
  return sendViaResend({
    to: [email],
    subject: '⏳ Ihre Taxi-Anfrage bei Citytaxi Horw – wird geprüft',
    html: buildCustomerPendingHtml(data),
    replyTo: process.env.BOOKING_EMAIL_REPLY_TO || process.env.BOOKING_EMAIL_DISPATCH?.split(',')[0]?.trim(),
  })
}

/** Tracking confirmation to customer — sent after driver accepts. */
export async function notifyBookingCustomerTracking(data: BookingPayload, bookingId: string): Promise<ResendResult> {
  const email = data.email?.trim()
  if (!email) return { ok: true }
  return sendViaResend({
    to: [email],
    subject: '✅ Fahrt bestätigt – Ihr Tracking-Link | Citytaxi Horw',
    html: buildCustomerTrackingHtml(data, bookingId),
    replyTo: process.env.BOOKING_EMAIL_REPLY_TO || process.env.BOOKING_EMAIL_DISPATCH?.split(',')[0]?.trim(),
  })
}
