import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { countPendingComments } from '../lib/comments'
import AdminAvatar from '../components/AdminAvatar'

export default function AdminDashboard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [pending, setPending] = useState(0)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, published, author, created_at')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    document.title = 'Admin — The Journal'
    loadPosts()
    countPendingComments().then(setPending)
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('posts').delete().eq('id', id)
    loadPosts()
  }

  async function setPublished(id, value) {
    await supabase
      .from('posts')
      .update({ published: value, updated_at: new Date().toISOString() })
      .eq('id', id)
    loadPosts()
  }

  const draftCount = posts.filter((p) => !p.published).length
  const liveCount = posts.length - draftCount
  const visible = posts.filter((p) =>
    filter === 'all' ? true : filter === 'draft' ? !p.published : p.published
  )

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      {/* one big container: title + profile on top, actions + filters underneath */}
      <div className="admin-panel">
      <div className="admin-panel-top">
        <h1 style={{ fontSize: 28, margin: 0 }}>Your posts</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <AdminAvatar />
          <button onClick={handleSignOut} className="btn btn-outline" style={{ fontSize: 13 }}>
            Sign out
          </button>
        </div>
      </div>

      <div className="admin-panel-bar">
      <div className="admin-panel-actions">
        <Link to="/admin/new" className="btn">
          + Write a new post
        </Link>
        <Link to="/admin/comments" className="btn btn-outline">
          Comments{pending > 0 ? ` (${pending} waiting)` : ''}
        </Link>
      </div>

      <div className="admin-panel-tabs">
        {[
          { key: 'all', label: `All (${posts.length})` },
          { key: 'live', label: `Live (${liveCount})` },
          { key: 'draft', label: `Drafts (${draftCount})` },
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
      </div>
      </div>

      {loading && <p style={{ color: 'var(--color-ink-soft)' }}>Loading...</p>}

      {!loading && posts.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>No posts yet. Write your first one.</p>
      )}

      <div className="admin-post-grid">
        {visible.map((post) => (
          <div key={post.id} className="admin-post-card">
            <div style={{ fontSize: 17, marginBottom: 8, lineHeight: 1.3 }}>{post.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              {post.published ? 'Live' : 'Draft (only you can see it)'} &middot;{' '}
              {post.author ? `${post.author} \u00b7 ` : ''}
              {new Date(post.created_at).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/blog/${post.slug}`} target="_blank" className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }}>
                {post.published ? 'View' : 'Preview'}
              </Link>
              <button
                onClick={() => setPublished(post.id, !post.published)}
                className={post.published ? 'btn btn-outline' : 'btn'}
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                {post.published ? 'Unpublish' : 'Publish now'}
              </button>
              <Link to={`/admin/edit/${post.id}`} className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }}>
                Edit
              </Link>
              <button
                onClick={() => handleDelete(post.id)}
                className="btn-danger btn"
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