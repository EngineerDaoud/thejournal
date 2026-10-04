import { useRef, useState } from 'react'
import { submitComment } from '../lib/comments'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CommentForm({ post, onSent }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')
  const [trap, setTrap] = useState('') // hidden field: humans never see it, spam bots fill it
  const openedAt = useRef(Date.now())

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Bot checks: pretend it worked so the bot learns nothing, but send nothing.
    if (trap || Date.now() - openedAt.current < 2500) {
      setState('done')
      return
    }

    if (!name.trim()) return setError('Please write your name.')
    if (!EMAIL_RE.test(email.trim())) return setError('Please write a valid email address.')
    if (body.trim().length < 3) return setError('Please write your comment.')

    setState('sending')
    const res = await submitComment({ post, name, email, body })

    if (!res.ok) {
      setState('idle')
      setError(res.error)
      return
    }

    setState('done')
    setName('')
    setEmail('')
    setBody('')
    if (onSent) onSent()
  }

  if (state === 'done') {
    return (
      <section className="side-card">
        <h2 className="side-card-title">Thank you</h2>
        <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: 0 }}>
          Your comment has been sent.
        </p>
        <button
          type="button"
          className="btn btn-outline"
          style={{ fontSize: 13, padding: '7px 14px', marginTop: 14 }}
          onClick={() => setState('idle')}
        >
          Write another
        </button>
      </section>
    )
  }

  return (
    <section className="side-card">
      <h2 className="side-card-title">Leave a comment</h2>

      <form onSubmit={handleSubmit}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="c-website">Leave this empty</label>
          <input
            id="c-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input
            id="c-name"
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input
            id="c-email"
            type="email"
            value={email}
            maxLength={160}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="field-hint">Not published — it is only sent to the editor.</div>
        </div>

        <div className="field">
          <label htmlFor="c-body">Comment</label>
          <textarea
            id="c-body"
            rows={5}
            value={body}
            maxLength={3000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think?"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn" disabled={state === 'sending'} style={{ width: '100%', justifyContent: 'center' }}>
          {state === 'sending' ? 'Sending...' : 'Submit comment'}
        </button>
      </form>
    </section>
  )
}