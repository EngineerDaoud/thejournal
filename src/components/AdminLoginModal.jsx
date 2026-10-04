import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLoginModal({ open, onClose }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset the form each time the popup opens, and let Escape close it.
  useEffect(() => {
    if (!open) return
    setEmail('')
    setPassword('')
    setError('')
    setSubmitting(false)
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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
    onClose()
    navigate('/admin')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(35, 36, 31, 0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        zIndex: 200,
        animation: 'admin-modal-fade 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Admin sign in"
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-line)',
          boxShadow: 'var(--shadow-pop)',
          padding: 30,
          animation: 'admin-modal-in 0.18s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontSize: 21, margin: 0 }}>Admin sign in</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid var(--color-line)',
              color: 'var(--color-ink-soft)',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="modal-email">Email</label>
            <input
              id="modal-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="modal-password">Password</label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 4 }}>{error}</p>
          )}
          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes admin-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes admin-modal-in { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}