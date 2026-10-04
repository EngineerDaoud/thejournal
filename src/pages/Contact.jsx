import { useState } from 'react'
import { Link } from 'react-router-dom'
import InfoPage from '../components/InfoPage'
import { SITE } from '../lib/siteConfig'
import { supabase } from '../lib/supabaseClient'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Please write your name.')
    if (!EMAIL_RE.test(email.trim())) return setError('Please write a valid email address.')
    if (message.trim().length < 3) return setError('Please write your message.')

    setState('sending')
    try {
      const { data, error: err } = await supabase.functions.invoke('notify-contact', {
        body: { name: name.trim(), email: email.trim(), message: message.trim() },
      })
      if (err || !data?.ok) throw new Error('send failed')

      setState('done')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setState('idle')
      setError('Your message could not be sent. Please try again, or email us directly.')
    }
  }

  return (
    <InfoPage
      title="Contact Us"
      description="Contact The Journal for feedback, corrections, topic suggestions, copyright concerns, privacy requests or advertising enquiries. We reply within a few working days."
      intro={`We would love to hear from you. Whether you have a question, a correction, a topic suggestion or just want to say hello, the ${SITE.name} team reads every message.`}
    >
      <h2>How we can help</h2>
      <p>You can contact us about:</p>
      <ul>
        <li><strong>Feedback and questions</strong> about any article on the site.</li>
        <li><strong>Corrections</strong> if you have spotted a mistake, so we can fix it quickly.</li>
        <li><strong>Topic suggestions</strong> in technology, the environment, education or trending stories you would like us to cover.</li>
        <li><strong>Copyright and image concerns</strong>, see our <Link className="underline-link" to="/image-credits">Image &amp; Copyright</Link> page for what to include.</li>
        <li><strong>Privacy requests</strong> relating to your information, see our <Link className="underline-link" to="/privacy-policy">Privacy Policy</Link>.</li>
        <li><strong>Advertising and partnership</strong> enquiries.</li>
      </ul>

      <h2>Email us</h2>
      <p>
        {SITE.email ? (
          <>
            The quickest way to reach us is by email at{' '}
            <a className="underline-link" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </>
        ) : (
          'Use the form below to send us a message.'
        )}{' '}
        We do our best to reply to every message within a few working days.
      </p>

      <h2>Send a message</h2>
      <p>
        Fill in the form below and it will be sent to us directly.
      </p>

      {state === 'done' ? (
        <div className="info-note" style={{ maxWidth: 520, marginTop: 18 }}>
          <p><strong>Thank you.</strong> Your message has been sent.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 520, marginTop: 18 }}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Your email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn" disabled={state === 'sending'}>
            {state === 'sending' ? 'Sending...' : 'Send message'}
          </button>
        </form>
      )}

      <div className="info-note" style={{ marginTop: 34 }}>
        <p>
          <strong>Please note:</strong> we cannot give personal medical, legal or financial advice.
          For those matters, please speak to a qualified professional. Read our{' '}
          <Link className="underline-link" to="/disclaimer">Disclaimer</Link> for more.
        </p>
      </div>
    </InfoPage>
  )
}