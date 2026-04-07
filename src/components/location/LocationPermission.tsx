'use client'

/**
 * Location permission request UI.
 * Shows different states: prompt (ask), denied (error + manual instructions), loading (spinner).
 */

type Props = {
  status: PermissionState
  isLoading: boolean
  onRequest: () => void
}

export default function LocationPermission({ status, isLoading, onRequest }: Props) {
  return (
    <div className="lp-card">
      <div className="lp-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>

      {status === 'denied' ? (
        <>
          <h2 className="lp-title">Konum izni reddedildi</h2>
          <p className="lp-desc">
            Konumunuzu paylaşmak için tarayıcı ayarlarından izin vermeniz gerekiyor.
          </p>
          <div className="lp-instructions">
            <p><strong>Chrome / Edge:</strong> Adres çubuğundaki kilit ikonuna tıklayın → Konum → İzin Ver</p>
            <p><strong>Firefox:</strong> Adres çubuğundaki bilgi ikonuna tıklayın → Konum izni kaldır</p>
            <p><strong>Safari (iOS):</strong> Ayarlar → Gizlilik → Konum Servisleri → Safari → İzin Ver</p>
          </div>
          <a href="tel:+41415144444" className="btn btn-primary lp-btn">
            📞 Taxi direkt anrufen
          </a>
        </>
      ) : isLoading ? (
        <>
          <h2 className="lp-title">Standort wird ermittelt…</h2>
          <p className="lp-desc">Bitte warten Sie einen Moment.</p>
          <div className="lp-spinner" aria-label="Lädt…" />
        </>
      ) : (
        <>
          <h2 className="lp-title">Konumunuzu Paylaşın</h2>
          <p className="lp-desc">
            Size en yakın Citytaxi Horw aracını bulabilmemiz için konumunuza ihtiyacımız var.
            Konumunuz yalnızca bu oturum için kullanılır ve saklanmaz.
          </p>
          <button type="button" className="btn btn-primary lp-btn" onClick={onRequest}>
            📍 Konumumu Belirle
          </button>
        </>
      )}

      <style jsx>{`
        .lp-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.6rem;
          max-width: 46rem;
          margin: 0 auto;
          padding: 4rem 3.2rem;
          background: var(--white);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
        }
        .lp-icon {
          color: var(--accent);
          width: 4.8rem;
          height: 4.8rem;
        }
        .lp-title {
          font-family: var(--font-heading);
          font-size: var(--h4);
          color: var(--primary);
          margin: 0;
        }
        .lp-desc {
          font-size: var(--text-base);
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0;
        }
        .lp-instructions {
          background: var(--bg-alt);
          border-radius: var(--radius-md);
          padding: 1.6rem 2rem;
          text-align: left;
          font-size: var(--text-sm);
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          width: 100%;
        }
        .lp-btn {
          min-width: 22rem;
          justify-content: center;
        }
        .lp-spinner {
          width: 4rem;
          height: 4rem;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: lp-spin 0.8s linear infinite;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
