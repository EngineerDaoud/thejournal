import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllComments, setCommentApproved, deleteComment } from '../lib/comments'
import AdminAvatar from '../components/AdminAvatar'
import { confirmDialog } from '../components/ConfirmDialog'

export default function AdminComments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  async function load() {
    setLoading(true)
    setComments(await fetchAllComments())
    setLoading(false)
  }

  useEffect(() => {
    document.title = 'Comments — Admin'
    load()
  }, [])

  async function approve(id, value) {
    await setCommentApproved(id, value)
    load()
  }

  async function remove(id) {
    const ok = await confirmDialog({
      title: 'Delete this comment?',
      message: 'This comment will be deleted for good. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!ok) return
    await deleteComment(id)
    load()
  }

  const pending = comments.filter((c) => !c.approved)
  const approved = comments.filter((c) => c.approved)
  const visible = filter === 'pending' ? pending : filter === 'approved' ? approved : comments

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Comments</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <AdminAvatar />
          <Link to="/admin" className="btn btn-outline" style={{ fontSize: 13 }}>
            Back to posts
          </Link>
        </div>
      </div>

      <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, marginBottom: 26 }}>
        A comment only appears on the site after you approve it here.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: `Waiting (${pending.length})` },
          { key: 'approved', label: `Approved (${approved.length})` },
          { key: 'all', label: `All (${comments.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={filter === t.key ? 'btn' : 'btn btn-outline'}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--color-ink-soft)' }}>Loading...</p>}

      {!loading && visible.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>Nothing here.</p>
      )}

      <div className="admin-post-grid">
        {visible.map((c) => (
          <div key={c.id} className="admin-post-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', wordBreak: 'break-word' }}>
                  {c.email} &middot; {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              <span className="cat-pill cat-pill-sm" style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
                {c.approved ? 'Approved' : 'Waiting'}
              </span>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {c.body}
            </p>

            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              On:{' '}
              <Link to={`/blog/${c.post_slug}`} className="underline-link" style={{ color: 'inherit' }}>
                {c.post_title || c.post_slug}
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => approve(c.id, !c.approved)}
                className={c.approved ? 'btn btn-outline' : 'btn'}
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                {c.approved ? 'Hide again' : 'Approve'}
              </button>
              <a
                href={`mailto:${c.email}?subject=${encodeURIComponent('Re: ' + (c.post_title || 'your comment'))}`}
                className="btn btn-outline"
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                Reply
              </a>
              <button
                onClick={() => remove(c.id)}
                className="btn btn-danger"
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}