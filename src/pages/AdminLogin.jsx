import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const { signIn, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="measure" style={{ paddingTop: 90, maxWidth: 400 }}>
      <h1 style={{ marginBottom: 30, fontSize: 28 }}>Admin sign in</h1>
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 18 }}>{error}</p>
        )}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}