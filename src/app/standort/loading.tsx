'use client'

export default function StandortLoading() {
  return (
    <div className="standort-skeleton">
      <div className="sk-hero" />
      <div className="sk-body">
        <div className="sk-card" />
      </div>

      <style jsx>{`
        .standort-skeleton {
          min-height: 100vh;
        }
        .sk-hero {
          height: 24rem;
          background: var(--bg-dark);
        }
        .sk-body {
          max-width: 80rem;
          margin: 0 auto;
          padding: var(--section-y-md) 2.4rem;
        }
        .sk-card {
          height: 46rem;
          border-radius: var(--radius-xl);
          background: linear-gradient(90deg, var(--bg-alt) 25%, var(--border) 50%, var(--bg-alt) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}
