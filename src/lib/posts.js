import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { readStored, writeStored } from './cache'

const BASE_COLUMNS = 'id, title, slug, excerpt, cover_image, category, subcategory, author, created_at'
const LIST_KEY = 'journal:posts:v2'
const FRESH_MS = 60 * 1000 // inside this time we do not even ask the server again

let listCache = null // { at, data }
let listInflight = null
let hasViewsColumn = true
const subscribers = new Set()

function remember(data) {
  listCache = { at: Date.now(), data }
  writeStored(LIST_KEY, data)
  subscribers.forEach((fn) => fn(data))
}

// Instant (no network): what we already know, from memory or from the last visit.
export function getCachedPosts() {
  if (listCache) return listCache.data
  const stored = readStored(LIST_KEY)
  if (stored) {
    listCache = stored
    return stored.data
  }
  return null
}

async function requestPublishedPosts() {
  const run = (cols) =>
    supabase.from('posts').select(cols).eq('published', true).order('created_at', { ascending: false })

  let res = hasViewsColumn ? await run(`${BASE_COLUMNS}, views`) : { error: true }
  if (res.error) {
    // migration-views.sql not run yet: remember that, so we never send the failing query again.
    hasViewsColumn = false
    res = await run(BASE_COLUMNS)
  }
  if (res.error) {
    console.error(res.error)
    return null
  }
  return (res.data || []).map((p) => ({ ...p, views: p.views || 0 }))
}

// One shared request, no matter how many components ask for the posts at the same time.
export function fetchPublishedPosts({ force = false } = {}) {
  const cached = getCachedPosts()
  if (!force && cached && listCache && Date.now() - listCache.at < FRESH_MS) {
    return Promise.resolve(cached)
  }
  if (listInflight) return listInflight
  listInflight = requestPublishedPosts()
    .then((data) => {
      if (data) remember(data)
      return data || cached || []
    })
    .catch(() => cached || [])
    .finally(() => {
      listInflight = null
    })
  return listInflight
}

// React hook: shows cached posts at once (no "Loading..."), refreshes in the background.
export function usePublishedPosts() {
  const [posts, setPosts] = useState(() => getCachedPosts())

  useEffect(() => {
    let alive = true
    const onChange = (data) => alive && setPosts(data)
    subscribers.add(onChange)
    fetchPublishedPosts().then((data) => alive && setPosts(data))
    return () => {
      alive = false
      subscribers.delete(onChange)
    }
  }, [])

  return { posts: posts || [], loading: posts === null }
}

/* ---------------- single post ---------------- */

const postCache = new Map() // slug -> post (published posts only)
const postInflight = new Map()

export function getCachedPost(slug) {
  return postCache.get(slug) || null
}

export function fetchPostBySlug(slug) {
  if (postInflight.has(slug)) return postInflight.get(slug)
  const p = supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error || !data) return null
      if (data.published) postCache.set(slug, data)
      return data
    })
    .catch(() => null)
    .finally(() => postInflight.delete(slug))
  postInflight.set(slug, p)
  return p
}

// Called when a visitor hovers / touches a link: the post is already on its way before the click.
export function prefetchPost(slug) {
  if (!slug || postCache.has(slug) || postInflight.has(slug)) return
  fetchPostBySlug(slug)
}

// Adds +1 view for a post. Fire-and-forget: a failure here must never break reading.
export function trackView(slug) {
  try {
    supabase.rpc('increment_post_views', { post_slug: slug }).then(({ error }) => {
      if (error) console.warn('view count not saved:', error.message)
    })
  } catch (e) {
    /* ignore */
  }
}

// Most viewed first. Ties (or all zeros) fall back to the newest post first.
export function sortByViews(posts) {
  return [...posts].sort((a, b) => {
    const diff = (b.views || 0) - (a.views || 0)
    if (diff !== 0) return diff
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

export function groupByCategory(posts) {
  const order = []
  const map = {}
  for (const post of posts) {
    const cat = post.category || 'General'
    if (!map[cat]) {
      map[cat] = []
      order.push(cat)
    }
    map[cat].push(post)
  }
  return order.map((name) => ({ name, posts: map[name] }))
}

// Posts from the same category to show under an article, worked out from the list we
// already have (no extra database requests).
// Same subcategory first, then the rest of the category, then the newest posts from
// anywhere so the row is never empty.
export function relatedFromList(post, all, limit = 3) {
  if (!post || !all) return []
  const category = post.category || 'General'
  const others = all.filter((p) => p.id !== post.id)

  let pool = others.filter((p) => (p.category || 'General') === category)
  if (post.subcategory) {
    pool = [
      ...pool.filter((p) => p.subcategory === post.subcategory),
      ...pool.filter((p) => p.subcategory !== post.subcategory),
    ]
  }
  if (pool.length < limit) {
    const seen = new Set(pool.map((p) => p.id))
    for (const p of others) if (!seen.has(p.id)) pool.push(p)
  }
  return pool.slice(0, limit)
}