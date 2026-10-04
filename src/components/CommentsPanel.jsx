import { useEffect, useState } from 'react'
import { fetchApprovedComments } from '../lib/comments'

const STACK_LIMIT = 5

function CommentItem({ c }) {
  return (
    <li className="comment-item">
      <div className="comment-head">
        <span className="comment-avatar" aria-hidden="true">
          {(c.name || '?').trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="comment-name">{c.name}</div>
          <div className="comment-date">
            {new Date(c.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
      <p className="comment-body">{c.body}</p>
    </li>
  )
}

// The approved comments for one post: name + comment, newest first.
// The latest 5 always show in full. Anything beyond that appears in a
// one-at-a-time carousel underneath, instead of growing the sidebar forever.
export default function CommentsPanel({ postId, refreshKey = 0 }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchApprovedComments(postId).then((rows) => {
      if (!alive) return
      setComments(rows)
      setIndex(0)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [postId, refreshKey])

  const stacked = comments.slice(0, STACK_LIMIT)
  const overflow = comments.slice(STACK_LIMIT)
  const hasOverflow = overflow.length > 0

  function prev() {
    setIndex((i) => (i - 1 + overflow.length) % overflow.length)
  }
  function next() {
    setIndex((i) => (i + 1) % overflow.length)
  }

  return (
    <section className="side-card">
      <h2 className="side-card-title">
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {loading && <p className="side-empty">Loading...</p>}

      {!loading && comments.length === 0 && (
        <p className="side-empty">No comments yet. Be the first one.</p>
      )}

      <div className="comment-scroll">
        {!loading && stacked.length > 0 && (
          <ul className="comment-list">
            {stacked.map((c) => (
              <CommentItem key={c.id} c={c} />
            ))}
          </ul>
        )}

        {!loading && hasOverflow && (
          <div className="comment-carousel">
            <ul className="comment-list">
              <CommentItem c={overflow[index]} />
            </ul>
            <div className="comment-carousel-nav">
              <button type="button" className="btn btn-outline" onClick={prev} aria-label="Previous comment">
                &larr;
              </button>
              <span className="comment-carousel-count">
                {index + 1} / {overflow.length}
              </span>
              <button type="button" className="btn btn-outline" onClick={next} aria-label="Next comment">
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}