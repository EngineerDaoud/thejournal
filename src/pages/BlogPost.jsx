import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PostRenderer from '../components/PostRenderer'
import AdSlot from '../components/AdSlot'
import { useAuth } from '../context/AuthContext'
import RichText from '../components/RichText'
import Carousel from '../components/Carousel'
import { parseCovers } from '../lib/covers'
import AuthorBox from '../components/AuthorBox'
import { trackView, fetchPostBySlug, getCachedPost } from '../lib/posts'
import PageSkeleton from '../components/PageSkeleton'
import CommentForm from '../components/CommentForm'
import CommentsPanel from '../components/CommentsPanel'
import RelatedPosts from '../components/RelatedPosts'
import PostKeywords from '../components/PostKeywords'
import { resolveLink } from '../lib/links'

const BADGE = { display: 'inline-block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, background: 'var(--color-ink)', color: '#fff', padding: '5px 12px', borderRadius: 4 }

export default function BlogPost() {
  const { slug } = useParams()
  const [fetched, setFetched] = useState(null) // { slug, post | null }
  const [commentKey, setCommentKey] = useState(0)
  const { isAdmin, loading: authLoading } = useAuth()

  // The post is requested straight away (it no longer waits for the sign-in check), and a post
  // that was already opened or hovered before shows at once from the cache.
  useEffect(() => {
    let alive = true
    fetchPostBySlug(slug).then((data) => {
      if (alive) setFetched({ slug, post: data })
    })
    return () => {
      alive = false
    }
  }, [slug])

  const fresh = fetched && fetched.slug === slug ? fetched : null
  const post = fresh ? fresh.post : getCachedPost(slug)
  // Drafts are only returned to the admin (Supabase RLS), and we double check here.
  const hidden = post && !post.published && !isAdmin
  const status = hidden ? (authLoading ? 'loading' : 'not-found') : post ? 'ready' : fresh ? 'not-found' : 'loading'

  useEffect(() => {
    if (post && status === 'ready') document.title = `${post.title} — The Journal`
  }, [post?.id, status])

  // Count the view: published posts only, not the admin, once per browser session.
  useEffect(() => {
    if (!post || !post.published || authLoading || isAdmin) return
    try {
      const key = `viewed:${post.slug}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        trackView(post.slug)
      }
    } catch (e) {
      trackView(post.slug)
    }
  }, [post?.id, isAdmin, authLoading])

  if (status === 'loading') {
    return <PageSkeleton />
  }

  if (status === 'not-found') {
    return (
      <div className="measure" style={{ paddingTop: 60 }}>
        <h1>Post not found</h1>
        <Link to="/blog" className="underline-link">Back to blog</Link>
      </div>
    )
  }

  const covers = parseCovers(post.cover_image)

  return (
    <>
    <div className="post-layout" style={{ paddingTop: 60, paddingBottom: 80 }}>
      {/* top part (category, byline, title) sits above, so the right column can start level with the cover image */}
      <header className="post-head">
        {!post.published && (
          <div
            style={{
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-line)',
              borderRadius: 4,
              padding: '10px 16px',
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            <strong>Draft preview.</strong> Not live yet, only you (admin) can see this page.
          </div>
        )}
        <Link
          to={`/blog?category=${encodeURIComponent(post.category || 'General')}`}
          style={BADGE}
        >
          {post.category || 'General'}
        </Link>
        {post.subcategory && (
          <>
            <span style={{ color: 'var(--color-ink-soft)', margin: '0 8px' }}>&rsaquo;</span>
            <Link
              to={`/blog?category=${encodeURIComponent(post.category || 'General')}&sub=${encodeURIComponent(post.subcategory)}`}
              style={BADGE}
            >
              {post.subcategory}
            </Link>
          </>
        )}
        <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: '14px 0 26px', lineHeight: 1.4 }}>
          {post.author && (
            <>
              By{' '}
              <Link to={`/author/${encodeURIComponent(post.author)}`} className="underline-link" style={{ color: 'inherit' }}>
                {post.author}
              </Link>
              {' \u00b7 '}
            </>
          )}
          {new Date(post.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 42px)', marginBottom: 24 }}>{post.title}</h1>

      </header>
      <div className="post-main">
        <article>

          {covers.length > 0 && (
            <Carousel images={covers} alt={post.title} style={{ marginBottom: 34 }} />
          )}

          {post.tldr && (
            <div
              style={{
                background: 'var(--color-accent-soft)',
                borderLeft: '3px solid var(--color-accent)',
                padding: '16px 20px',
                borderRadius: 4,
                marginBottom: 34,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 6 }}>
                TL;DR
              </div>
              <div><RichText text={post.tldr} /></div>
            </div>
          )}

          <AdSlot />

          <PostRenderer blocks={post.content || []} />

          {post.cta_text && resolveLink(post.cta_link) && (
            <div style={{ margin: '48px 0', textAlign: 'center' }}>
              <a
                href={resolveLink(post.cta_link).href}
                {...(resolveLink(post.cta_link).type === 'outer' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="btn"
              >
                {post.cta_text}
              </a>
            </div>
          )}

          <AuthorBox name={post.author} />

          <AdSlot />
        </article>

        <div style={{ marginTop: 50 }}>
          <Link to="/blog" className="btn" style={{ fontSize: 13, padding: '7px 14px' }}>
            Back to all entries
          </Link>
        </div>
      </div>

      {/* Right side: leave a comment + the comments that were approved */}
      <aside className="post-side">
        <CommentForm post={post} onSent={() => setCommentKey((k) => k + 1)} />
        <CommentsPanel postId={post.id} refreshKey={commentKey} />
        <PostKeywords keywords={post.keywords} />
        <AdSlot label="Advertisement" />
      </aside>
    </div>

    {/* Full-width row, breaking out of the narrow article column */}
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px 60px' }}>
      <RelatedPosts post={post} limit={8} />
    </div>
    </>
  )
}