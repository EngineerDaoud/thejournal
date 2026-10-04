import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPublishedPosts } from '../lib/posts'
import PostCard from '../components/PostCard'
import AuthorAvatar from '../components/AuthorAvatar'
import { SITE, authorBio } from '../lib/siteConfig'

export default function Author() {
  const { name } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = `${name} — ${SITE.name}`
    setLoading(true)
    fetchPublishedPosts().then((data) => {
      setPosts(data.filter((p) => (p.author || '').trim() === name))
      setLoading(false)
    })
  }, [name])

  return (
    <div className="container container-wide" style={{ paddingTop: 50, paddingBottom: 80 }}>
      <div className="author-head">
        <AuthorAvatar name={name} size="large" />
        <div>
          <div className="blog-side-title" style={{ border: 0, padding: 0, marginBottom: 4 }}>Author</div>
          <h1 style={{ margin: '0 0 8px' }}>{name}</h1>
          <p style={{ margin: 0, color: 'var(--color-ink-soft)', maxWidth: 620 }}>{authorBio(name)}</p>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--color-ink-soft)' }}>Loading...</p>}

      {!loading && posts.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>
          No published posts by this author yet. <Link className="underline-link" to="/blog">Browse the blog</Link>
        </p>
      )}

      {posts.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, margin: '44px 0 24px' }}>
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} by {name}
          </h2>
          <div className="card-grid-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}