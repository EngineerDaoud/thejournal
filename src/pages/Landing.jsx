import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePublishedPosts, prefetchPost } from '../lib/posts'
import PageSkeleton from '../components/PageSkeleton'
import PostCard from '../components/PostCard'
import AdSlot from '../components/AdSlot'
import PostGrid from '../components/PostGrid'
import AuthorAvatar from '../components/AuthorAvatar'
import { SITE } from '../lib/siteConfig'

export default function Landing() {
  const { posts, loading } = usePublishedPosts()

  useEffect(() => {
    document.title = `${SITE.name} — ${SITE.tagline}`
  }, [])

  if (loading) return <PageSkeleton />

  if (posts.length === 0) {
    return (
      <div className="measure" style={{ paddingTop: 90, textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, marginBottom: 14 }}>Nothing published yet</h1>
        <p style={{ color: 'var(--color-ink-soft)' }}>Check back soon for the first entry.</p>
      </div>
    )
  }

  const [featured, ...rest] = posts
  const sideList = rest.slice(0, 2)
  const latestList = rest.slice(2, 7)
  // Everything after the hero, newest first, laid out line by line (3 per row).
  const MAX_GRID = 18
  const gridPosts = rest.slice(2)
  const shownGrid = gridPosts.slice(0, MAX_GRID)

  return (
    <div className="container container-wide" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Hero row: Trending (left) | featured post (centre) | Latest (right), all the same height */}
      <div className="hero-row hero-row-3">
        {sideList.length > 0 && (
          <section className="hero-panel hero-panel-trending">
            <h2 className="hero-panel-title">Trending</h2>
            <div className="hero-panel-cards">
              {sideList.map((post) => (
                <PostCard key={post.id} post={post} size="small" />
              ))}
            </div>
          </section>
        )}

        <section className="hero-panel hero-center">
          <h2 className="hero-panel-title">Featured</h2>
          <PostCard post={featured} size="large" />
        </section>

        {latestList.length > 0 && (
          <section className="hero-panel hero-panel-latest">
            <h2 className="hero-panel-title">Latest</h2>
            <div className="hero-latest-box">
              {latestList.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="latest-item hero-latest-item"
                  onMouseEnter={() => prefetchPost(post.slug)}
                  onTouchStart={() => prefetchPost(post.slug)}
                >
                  <div className="latest-item-title">{post.title}</div>
                  <div className="hero-latest-date">
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {post.author && (
                    <span className="latest-author" tabIndex={0}>
                      <AuthorAvatar name={post.author} />
                      <span className="ov-author-pop">{post.author}</span>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <AdSlot />

      {shownGrid.length > 0 && (
        <section style={{ marginTop: 60 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1px solid var(--color-ink)',
              paddingTop: 10,
              marginBottom: 26,
            }}
          >
            <h2 style={{ fontSize: 20, margin: 0 }}>All stories</h2>
            <Link to="/blog" className="underline-link" style={{ fontSize: 14 }}>
              View all
            </Link>
          </div>
          <PostGrid posts={shownGrid} allPosts={posts} />
          {gridPosts.length > MAX_GRID && (
            <div style={{ textAlign: 'center', marginTop: 44 }}>
              <Link to="/blog" className="btn">
                View all posts
              </Link>
            </div>
          )}
        </section>
      )}

      <style>{`
        @media (max-width: 900px) {
          .hero-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}