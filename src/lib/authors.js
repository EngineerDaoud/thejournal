import { supabase } from './supabaseClient'

// One request shared by every AuthorAvatar on a page (Blog list, an article's
// AuthorBox, the Author page) instead of one query per avatar.
let cache = null
let cachedAt = 0

async function fetchAll() {
  const { data, error } = await supabase.from('authors').select('name, avatar_url')
  if (error) {
    // Table not created yet (migration-authors.sql not run) — fall back quietly.
    console.warn('author pictures not loaded:', error.message)
    return {}
  }
  const map = {}
  for (const row of data || []) map[row.name] = row.avatar_url
  return map
}

export function loadAuthorAvatars() {
  if (!cache || Date.now() - cachedAt > 30_000) {
    cachedAt = Date.now()
    cache = fetchAll().catch(() => {
      cache = null
      return {}
    })
  }
  return cache
}

function bustCache() {
  cache = null
}

/**
 * Saves (or replaces) the picture for one author name.
 * dataUrl: a small base64 image, or null to remove the picture.
 */
export async function saveAuthorAvatar(name, dataUrl) {
  const clean = (name || '').trim()
  if (!clean) return { ok: false, error: 'No owner selected.' }

  const { error } = await supabase
    .from('authors')
    .upsert({ name: clean, avatar_url: dataUrl, updated_at: new Date().toISOString() })

  if (error) {
    console.error(error)
    return { ok: false, error: 'Could not save the picture.' }
  }
  bustCache()
  return { ok: true }
}