import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="measure" style={{ paddingTop: 90, textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="underline-link">Back home</Link>
    </div>
  )
}
