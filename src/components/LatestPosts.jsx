import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePublishedPosts, prefetchPost } from '../lib/posts'
import { firstCover } from '../lib/covers'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Right column: the newest published posts (the post you are reading is left out).
export default function LatestPosts({ currentId, limit = 5 }) {
  const { posts } = usePublishedPosts()
  const latest = useMemo(
    () =>
      [...posts]
        .filter((p) => p.id !== currentId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit),
    [posts, currentId, limit],
  )

  if (latest.length === 0) return null

  return (
    <section className="kw-box latest-box" aria-label="Latest posts">
      <h3 className="kw-title">Latest Posts</h3>
      <ul className="latest-list">
        {latest.map((p) => {
          const cover = firstCover(p.cover_image)
          return (
            <li key={p.id}>
              <Link
                to={`/blog/${p.slug}`}
                className="latest-item"
                onMouseEnter={() => prefetchPost(p.slug)}
                onTouchStart={() => prefetchPost(p.slug)}
              >
                {cover && <img src={cover} alt="" className="latest-thumb" loading="lazy" />}
                <span className="latest-text">
                  <span className="latest-title">{p.title}</span>
                  <span className="latest-date">{formatDate(p.created_at)}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}