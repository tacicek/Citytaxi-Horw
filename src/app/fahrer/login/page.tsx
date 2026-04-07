'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FahrerLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-Mail oder Passwort ist falsch. Bitte versuchen Sie es erneut.')
      setLoading(false)
      return
    }

    router.replace('/fahrer')
  }

  return (
    <>
      <div className="login-page">
        <div className="login-card">
          <span className="login-icon">🚕</span>
          <h1 className="login-title">Citytaxi Horw</h1>
          <p className="login-sub">Fahrer-Bereich</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email" className="login-label">E-Mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fahrer@citytaxihorw.ch"
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">Passwort</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          padding: calc(var(--nav-height) + 2rem) 2rem 2rem;
        }
        .login-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 2.4rem;
          padding: 4rem 3.2rem;
          width: 100%;
          max-width: 38rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          text-align: center;
        }
        .login-icon { font-size: 5.6rem; line-height: 1; margin-bottom: 0.4rem; }
        .login-title {
          font-size: 2.4rem;
          font-weight: 800;
          color: #C8A96E;
          margin: 0;
          font-family: var(--font-heading);
        }
        .login-sub {
          font-size: 1.4rem;
          color: #555;
          margin: 0 0 1.6rem;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          text-align: left;
        }
        .login-label {
          font-size: 1.3rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-input {
          background: #111;
          border: 1px solid #333;
          border-radius: 0.8rem;
          color: #fff;
          font-size: 1.5rem;
          padding: 1.2rem 1.4rem;
          width: 100%;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #444; }
        .login-input:focus { border-color: #C8A96E; }
        .login-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 0.8rem;
          color: #f87171;
          font-size: 1.3rem;
          padding: 1rem 1.4rem;
          margin: 0;
          text-align: left;
        }
        .login-btn {
          background: #C8A96E;
          color: #0a0a0a;
          border: none;
          border-radius: 0.8rem;
          font-size: 1.6rem;
          font-weight: 700;
          padding: 1.4rem;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          margin-top: 0.4rem;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.9; }
        .login-btn:active:not(:disabled) { transform: scale(0.97); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
