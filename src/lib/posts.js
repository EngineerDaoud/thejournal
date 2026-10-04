import { supabase } from './supabaseClient'

const BASE_COLUMNS = 'id, title, slug, excerpt, cover_image, category, subcategory, author, created_at'

export async function fetchPublishedPosts() {
  // Ask for the `views` column too. If migration-views.sql has not been run yet the
  // column does not exist, so fall back to the old query and the site keeps working.
  let { data, error } = await supabase
    .from('posts')
    .select(`${BASE_COLUMNS}, views`)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    const retry = await supabase
      .from('posts')
      .select(BASE_COLUMNS)
      .eq('published', true)
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error(error)
    return []
  }
  return (data || []).map((p) => ({ ...p, views: p.views || 0 }))
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

// Posts from the same category to show under an article.
// Same subcategory first, then the rest of the category, then (only if there
// still are not enough) the newest posts from anywhere so the row is never empty.
export async function fetchRelatedPosts(post, limit = 3) {
  if (!post) return []
  const category = post.category || 'General'

  const { data: sameCat } = await supabase
    .from('posts')
    .select(BASE_COLUMNS)
    .eq('published', true)
    .eq('category', category)
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(20)

  let pool = sameCat || []

  if (post.subcategory) {
    pool = [
      ...pool.filter((p) => p.subcategory === post.subcategory),
      ...pool.filter((p) => p.subcategory !== post.subcategory),
    ]
  }

  if (pool.length < limit) {
    const { data: recent } = await supabase
      .from('posts')
      .select(BASE_COLUMNS)
      .eq('published', true)
      .neq('id', post.id)
      .order('created_at', { ascending: false })
      .limit(limit + 5)

    const seen = new Set(pool.map((p) => p.id))
    for (const p of recent || []) {
      if (!seen.has(p.id)) pool.push(p)
    }
  }

  return pool.slice(0, limit)
}