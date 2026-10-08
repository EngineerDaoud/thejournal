import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchPublishedPosts, usePublishedPosts, sortByViews } from '../lib/posts'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'
import TrendingCard from '../components/TrendingCard'
import AdSlot from '../components/AdSlot'
import PageSkeleton from '../components/PageSkeleton'
import PostGrid from '../components/PostGrid'

export default function Articles() {
  const { posts, loading } = usePublishedPosts()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'All'
  const activeSub = searchParams.get('sub') || ''

  useEffect(() => {
    document.title = 'Articles — The Journal'

    // Live counts: when a post is added / edited / published / deleted (Supabase realtime)
    // the list is refreshed. The list is shared, so every part of the page updates by itself.
    // No more 30-second polling: it only re-asks when the tab is focused again, and the
    // cache skips the request if the data is less than a minute old.
    let channel = null
    try {
      channel = supabase
        .channel('Articles-posts-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () =>
          fetchPublishedPosts({ force: true })
        )
        .subscribe()
    } catch (e) {
      channel = null
    }
    const onFocus = () => fetchPublishedPosts()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = {}
    for (const post of posts) {
      const cat = post.category || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [posts])

  const categories = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const post of posts) {
      const cat = post.category || 'General'
      if (!seen.has(cat)) {
        seen.add(cat)
        list.push(cat)
      }
    }
    return list
  }, [posts])

  const subcategories = useMemo(() => {
    if (activeCategory === 'All') return []
    const set = new Set()
    for (const p of posts) {
      if ((p.category || 'General') === activeCategory && p.subcategory) set.add(p.subcategory)
    }
    return [...set]
  }, [posts, activeCategory])

  const filtered = posts.filter((p) => {
    if (activeCategory !== 'All' && (p.category || 'General') !== activeCategory) return false
    if (activeSub && p.subcategory !== activeSub) return false
    return true
  })

  // Centre = the newest post. Sides = the most viewed of the others, 3 per column.
  const featured = filtered[0]
  const trending = sortByViews(filtered.slice(1)).slice(0, 6)
  const leftCol = trending.slice(0, 3)
  const rightCol = trending.slice(3, 6)
  const shownIds = new Set([featured?.id, ...trending.map((p) => p.id)])
  const notShown = filtered.filter((p) => !shownIds.has(p.id))
  // 2 more posts sit right under the big Latest card; the rest go to "More stories"
  const belowLatest = notShown.slice(0, 2)
  const morePosts = notShown.slice(2)

  function selectSub(sub) {
    if (!sub) searchParams.delete('sub')
    else searchParams.set('sub', sub)
    setSearchParams(searchParams)
  }

  function selectCategory(cat) {
    // clicking the active category again clears the filter (shows everything)
    if (cat === 'All' || cat === activeCategory) {
      searchParams.delete('category')
    } else {
      searchParams.set('category', cat)
    }
    searchParams.delete('sub')
    setSearchParams(searchParams)
  }

  return (
    <div className="container container-wide" style={{ paddingTop: 50, paddingBottom: 80 }}>
      <h1 style={{ marginBottom: 26 }}>Articles</h1>

      {categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 40,
            borderBottom: '1px solid var(--color-line)',
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={activeCategory === cat ? 'btn' : 'btn btn-outline'}
              style={{ padding: '7px 16px', fontSize: 14 }}
            >
              {cat}
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  borderRadius: 999,
                  minWidth: 22,
                  padding: '1px 8px',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--color-ink-soft)' }}>
            Total: <strong style={{ color: 'var(--color-ink)' }}>{posts.length}</strong>{' '}
            {posts.length === 1 ? 'article' : 'articles'}
          </span>
        </div>
      )}

      {subcategories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '-18px 0 32px' }}>
          {['', ...subcategories].map((sub) => (
            <button
              key={sub || 'all-sub'}
              onClick={() => selectSub(sub)}
              className={activeSub === sub ? 'btn' : 'btn btn-outline'}
              style={{ padding: '5px 14px', fontSize: 13 }}
            >
              {sub || `All ${activeCategory}`}
            </button>
          ))}
        </div>
      )}

      {loading && <PageSkeleton inline />}

      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>Nothing here yet.</p>
      )}

      {featured && (
        <div
          className={`Articles-hero${leftCol.length ? ' has-left' : ''}${rightCol.length ? ' has-right' : ''}`}
        >
          {leftCol.length > 0 && (
            <aside className="Articles-hero-side Articles-hero-left" aria-label="Trending posts">
              <div className="Articles-side-title">Trending</div>
              {leftCol.map((post, i) => (
                <TrendingCard key={post.id} post={post} rank={i + 1} />
              ))}
            </aside>
          )}

          <div className="Articles-hero-main">
            <div className="Articles-side-title">Latest</div>
            <PostCard post={featured} size="large" ratio="16 / 9" />
            {belowLatest.length > 0 && (
              <div className="Articles-hero-below">
                {belowLatest.map((p) => (
                  <PostCard key={p.id} post={p} size="small" ratio="14 / 9" />
                ))}
              </div>
            )}
          </div>

          {rightCol.length > 0 && (
            <aside className="Articles-hero-side Articles-hero-right" aria-label="More trending posts">
              <div className="Articles-side-title">Trending</div>
              {rightCol.map((post, i) => (
                <TrendingCard key={post.id} post={post} rank={i + 4} />
              ))}
            </aside>
          )}
        </div>
      )}

      {morePosts.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, margin: '56px 0 24px' }}>More stories</h2>
          <PostGrid posts={morePosts} allPosts={posts} sideAds={false} perRow={4} />
        </>
      )}

      {filtered.length > 3 && <AdSlot />}
    </div>
  )
}