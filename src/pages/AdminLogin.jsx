import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  padding: '40px 36px 34px',
  border: '1px solid var(--color-line)',
  borderRadius: 16,
  background: 'var(--color-surface)',
  boxShadow: '0 18px 50px rgba(35, 36, 31, 0.08)',
}

const iconWrapStyle = {
  width: 54,
  height: 54,
  borderRadius: '50%',
  background: 'var(--color-ink)',
  color: 'var(--color-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 18px',
}

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 16, borderRadius: 10 }

export default function AdminLogin() {
  const { signIn, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Sign in'
  }, [])

  if (!loading && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const err = await signIn(email, password)
    setSubmitting(false)
    if (err) {
      setPassword('')
      setError(err.message)
      return
    }
    navigate('/admin')
  }

  return (
    <div style={{ minHeight: '68vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <div style={cardStyle}>
        <div style={iconWrapStyle} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, textAlign: 'center' }}>Admin sign in</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, textAlign: 'center', color: 'var(--color-ink-soft)' }}>
          Sign in to manage your posts and comments.
        </p>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                style={{ ...inputStyle, paddingRight: 64 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-ink-soft)',
                  padding: '6px 8px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: 'var(--color-danger)',
                fontSize: 14,
                margin: '0 0 16px',
                padding: '10px 12px',
                border: '1px solid var(--color-danger)',
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 16, marginTop: 6 }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 14 }}>
          <Link to="/" className="underline-link">
            &larr; Back to the website
          </Link>
        </p>
      </div>
    </div>
  )
}