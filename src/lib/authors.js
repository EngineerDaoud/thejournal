import { supabase } from './supabaseClient'
import { readStored, writeStored } from './cache'

// One request shared by every AuthorAvatar on a page (Articlelist, an article's
// AuthorBox, the Author page) instead of one query per avatar.
const KEY = 'journal:authors:v1'
const FRESH_MS = 5 * 60 * 1000
let cache = null
let cachedAt = 0
let known = readStored(KEY)?.data || null

// Instant (no network): the pictures we already know about.
export function getCachedAvatars() {
  return known
}

async function fetchAll() {
  const { data, error } = await supabase.from('authors').select('name, avatar_url')
  if (error) {
    // Table not created yet (migration-authors.sql not run) — fall back quietly.
    console.warn('author pictures not loaded:', error.message)
    return {}
  }
  const map = {}
  for (const row of data || []) map[row.name] = row.avatar_url
  known = map
  writeStored(KEY, map)
  return map
}

export function loadAuthorAvatars() {
  if (!cache || Date.now() - cachedAt > FRESH_MS) {
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
  known = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
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