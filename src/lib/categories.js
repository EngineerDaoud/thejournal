import { supabase } from './supabaseClient'

// Builds [{ name, children: [name, ...] }] from the categories table.
// If the table is empty (or not created yet) it falls back to the categories
// used by published posts, so the menu never breaks.
async function fetchCategoryTree() {
  const { data: rows, error } = await supabase
    .from('categories')
    .select('id, name, parent_id, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (!error && rows && rows.length) {
    const parents = rows.filter((r) => !r.parent_id)
    return parents.map((p) => ({
      name: p.name,
      children: rows.filter((r) => r.parent_id === p.id).map((c) => c.name),
    }))
  }

  const { data } = await supabase.from('posts').select('category, subcategory').eq('published', true)
  if (!data) return []
  const map = new Map()
  for (const row of data) {
    const cat = row.category || 'General'
    if (!map.has(cat)) map.set(cat, new Set())
    if (row.subcategory) map.get(cat).add(row.subcategory)
  }
  return [...map.entries()].map(([name, subs]) => ({ name, children: [...subs] }))
}

// The navbar and the footer both need the tree; share one request between them.
let cache = null
let cachedAt = 0
export function loadCategoryTree() {
  if (!cache || Date.now() - cachedAt > 60_000) {
    cachedAt = Date.now()
    cache = fetchCategoryTree().catch(() => {
      cache = null
      return []
    })
  }
  return cache
}

export const catLink = (cat) => `/blog?category=${encodeURIComponent(cat)}`
export const subLink = (cat, sub) =>
  `/blog?category=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`