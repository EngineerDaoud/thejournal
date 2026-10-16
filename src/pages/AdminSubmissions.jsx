import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchSubmissions,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  countWords,
  plainText,
} from '../lib/submissions'
import AdminAvatar from '../components/AdminAvatar'
import { confirmDialog } from '../components/ConfirmDialog'

export default function AdminSubmissions() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setItems(await fetchSubmissions())
    setLoading(false)
  }

  useEffect(() => {
    document.title = 'Reader articles — Admin'
    load()
  }, [])

  async function approve(sub, publish) {
    setError('')
    setBusyId(sub.id)
    const res = await approveSubmission(sub, publish)
    setBusyId(null)
    if (!res.ok) return setError(res.error || 'Could not approve this article.')
    if (publish) load()
    else navigate(`/admin/edit/${res.postId}`) // draft created: open it in the normal editor
  }

  async function reject(sub) {
    const ok = await confirmDialog({
      title: 'Reject this article?',
      message: 'It will not be published. You can still find it under "Rejected".',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!ok) return
    await rejectSubmission(sub.id)
    load()
  }

  async function remove(sub) {
    const ok = await confirmDialog({
      title: 'Delete this submission?',
      message: 'It will be deleted for good. The published post (if any) stays.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!ok) return
    await deleteSubmission(sub.id)
    load()
  }

  const by = (s) => items.filter((i) => i.status === s)
  const visible = by(filter)

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Reader articles</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <AdminAvatar />
          <Link to="/admin" className="btn btn-outline" style={{ fontSize: 13 }}>
            Back to posts
          </Link>
        </div>
      </div>

      <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, marginBottom: 22 }}>
        An article sent from "Write for us" goes live only after you approve it here.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          ['pending', `Waiting (${by('pending').length})`],
          ['approved', `Approved (${by('approved').length})`],
          ['rejected', `Rejected (${by('rejected').length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? 'btn' : 'btn btn-outline'}
            style={{ fontSize: 13 }}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--color-danger)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : visible.length === 0 ? (
        <p style={{ color: 'var(--color-ink-soft)' }}>Nothing here.</p>
      ) : (
        visible.map((s) => (
          <div
            key={s.id}
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-md)',
              padding: 18,
              marginBottom: 16,
              background: 'var(--color-surface)',
            }}
          >
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>{s.title}</h2>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 12 }}>
              {s.author_name} · {s.email} · {s.country || 'country not given'} · {s.category} · {countWords(s.content)} words ·{' '}
              {new Date(s.created_at).toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 10, flexWrap: 'wrap' }}>
              {s.author_avatar && (
                <img src={s.author_avatar} alt={s.author_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span>
                Slug: {s.slug || '—'} · Reading time: {s.reading_time ? `${s.reading_time} min` : '—'}
              </span>
            </div>
            {(s.search_intent || s.target_audience) && (
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 10 }}>
                {s.search_intent && <div>Search intent: {String(s.search_intent).split('\n').join(' · ')}</div>}
                {s.target_audience && <div>Target audience: {String(s.target_audience).split('\n').join(' · ')}</div>}
              </div>
            )}
            {s.excerpt && <p style={{ margin: '0 0 12px' }}>{s.excerpt}</p>}
            {s.cover_image && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {String(s.cover_image).split('\n').filter(Boolean).map((u) => (
                  <img key={u} src={u} alt={s.cover_meta?.[u]?.alt || ''} style={{ height: 70, borderRadius: 6 }} />
                ))}
              </div>
            )}

            <details style={{ marginBottom: 14 }}>
              <summary style={{ cursor: 'pointer', fontSize: 14 }}>Read the article</summary>
              <div style={{ marginTop: 10 }}>
                {s.tldr && (
                  <p style={{ margin: '0 0 12px', fontStyle: 'italic' }}>TL;DR: {plainText(s.tldr)}</p>
                )}
                {(s.content || []).map((b, i) =>
                  b.type === 'heading' ? (
                    <h3 key={i} style={{ fontSize: 18, margin: '16px 0 6px' }}>
                      {plainText(b.content)}
                    </h3>
                  ) : b.type === 'text' ? (
                    <p key={i} style={{ whiteSpace: 'pre-wrap', margin: '0 0 10px', lineHeight: 1.6 }}>
                      {plainText(b.content)}
                    </p>
                  ) : b.type === 'image' ? (
                    <figure key={i} style={{ margin: '0 0 12px' }}>
                      <img src={b.url} alt={b.alt || ''} style={{ maxWidth: '60%', borderRadius: 6 }} />
                      <figcaption style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                        alt: {b.alt || '(missing)'}{b.caption ? ` · caption: ${b.caption}` : ''}
                      </figcaption>
                    </figure>
                  ) : (
                    <p key={i} style={{ margin: '0 0 10px', color: 'var(--color-ink-soft)', fontSize: 13 }}>
                      [{b.type}] (open it with "Edit first" to see it)
                    </p>
                  ),
                )}
              </div>
            </details>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {s.status === 'pending' && (
                <>
                  <button className="btn" style={{ fontSize: 13 }} disabled={busyId === s.id} onClick={() => approve(s, true)}>
                    Approve &amp; publish
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: 13 }} disabled={busyId === s.id} onClick={() => approve(s, false)}>
                    Edit first (as draft)
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => reject(s)}>
                    Reject
                  </button>
                </>
              )}
              {s.status === 'approved' && s.post_id && (
                <Link to={`/admin/edit/${s.post_id}`} className="btn btn-outline" style={{ fontSize: 13 }}>
                  Open the post
                </Link>
              )}
              {s.status !== 'pending' && (
                <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => remove(s)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}