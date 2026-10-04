import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRelatedPosts } from '../lib/posts'
import PostCard from './PostCard'

const PAGE_SIZE = 4

// "More in <category>", full width, 4 cards per row. With more than 4 posts,
// it becomes a carousel that pages through 4 at a time.
export default function RelatedPosts({ post, limit = 8 }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchRelatedPosts(post, limit).then((rows) => {
      if (!alive) return
      setPosts(rows)
      setPage(0)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [post?.id, limit])

  if (loading || posts.length === 0) return null

  const category = post.category || 'General'
  const pageCount = Math.ceil(posts.length / PAGE_SIZE)
  const isCarousel = pageCount > 1
  const visible = isCarousel ? posts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) : posts

  function prev() {
    setPage((p) => (p - 1 + pageCount) % pageCount)
  }
  function next() {
    setPage((p) => (p + 1) % pageCount)
  }

  return (
    <section className="related" aria-label="Related posts">
      <div className="related-head">
        <h2 className="blog-side-title" style={{ border: 0, padding: 0, margin: 0 }}>
          More in {category}
        </h2>
        <Link
          to={`/blog?category=${encodeURIComponent(category)}`}
          className="underline-link"
          style={{ fontSize: 13 }}
        >
          See all
        </Link>
      </div>

      <div className="related-grid">
        {visible.map((p) => (
          <PostCard key={p.id} post={p} size="small" />
        ))}
      </div>

      {isCarousel && (
        <div className="comment-carousel-nav" style={{ borderTop: 0, marginTop: 22, justifyContent: 'center', gap: 18 }}>
          <button type="button" className="btn btn-outline" onClick={prev} aria-label="Previous">
            &larr;
          </button>
          <span className="comment-carousel-count">
            {page + 1} / {pageCount}
          </span>
          <button type="button" className="btn btn-outline" onClick={next} aria-label="Next">
            &rarr;
          </button>
        </div>
      )}
    </section>
  )
}