import { supabase } from './supabaseClient'
import { parseCovers, serializeCovers } from './covers'
import { joinKeywords } from './keywords'

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const MAX_COVERS = 4

// Cover images + their alt/title/caption, kept only for our own submissions/ pictures.
export function sanitizeCovers(list, meta) {
  const urls = parseCovers(list)
    .filter((u) => import.meta.env.VITE_SUPABASE_URL && u.startsWith(IMAGE_PREFIX))
    .slice(0, MAX_COVERS)
  const outMeta = {}
  for (const u of urls) {
    const m = (meta && meta[u]) || {}
    const clean = {}
    if (String(m.alt || '').trim()) clean.alt = String(m.alt).trim().slice(0, 200)
    if (String(m.title || '').trim()) clean.title = String(m.title).trim().slice(0, 120)
    if (String(m.caption || '').trim()) clean.caption = String(m.caption).trim().slice(0, 300)
    if (Object.keys(clean).length) outMeta[u] = clean
  }
  return { urls, meta: Object.keys(outMeta).length ? outMeta : null }
}

// Removes the editor's formatting markup so only the readable words are left.
export function plainText(str) {
  return String(str || '')
    .replace(/\[([^\]]+)\]\([^)\s]*\)/g, '$1')
    .replace(/\{\/?[a-z]:?[^}]*\}/gi, '')
    .replace(/\*\*|__|~~/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function countWords(blocks) {
  return (blocks || [])
    .filter((b) => b && (b.type === 'text' || b.type === 'heading'))
    .map((b) => plainText(b.content))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

// Readers may only send safe block types. Custom HTML, images and download files are
// removed, and the "HTML mode" switch is turned off, so nothing can run on the site.
const SAFE_TYPES = ['text', 'heading', 'table', 'chart', 'faq', 'compare', 'image']

// A reader's image is accepted only if it lives in OUR storage bucket's "submissions/" folder.
// Pictures hosted anywhere else are dropped, so nobody can slip in tracking or outside links.
const IMAGE_PREFIX = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public/blog-images/submissions/`

function safeImage(b) {
  if (typeof b.url !== 'string' || !b.url.startsWith(IMAGE_PREFIX) || !import.meta.env.VITE_SUPABASE_URL) return null
  return {
    id: b.id,
    type: 'image',
    url: b.url,
    alt: String(b.alt || '').slice(0, 200),
    title: String(b.title || '').slice(0, 120),
    caption: String(b.caption || '').slice(0, 300),
    width: ['small', 'medium', 'large'].includes(b.width) ? b.width : 'large',
  }
}

export function sanitizeBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((b) => b && SAFE_TYPES.includes(b.type))
    .map((b) => (b.type === 'image' ? safeImage(b) : b))
    .filter(Boolean)
    .map((b) => {
      if (b.type === 'image') return b
      // eslint-disable-next-line no-unused-vars
      const { htmlMode, html, ...rest } = b
      return { ...rest, htmlMode: false }
    })
}

// Emails the admin about a new article. Never throws: the article is already saved.
async function sendSubmissionEmail({ email, title }) {
  try {
    const { data, error } = await supabase.functions.invoke('notify-submission', {
      body: { email, title, siteUrl: window.location.origin },
    })
    if (error) {
      console.warn('Submission email not sent:', error.message)
      return false
    }
    return Boolean(data?.ok)
  } catch (err) {
    console.warn('Submission email not sent:', err?.message || err)
    return false
  }
}

// Search Intent / Target Audience: one item per line, same format the admin editor saves.
function cleanItems(list, max) {
  const items = (Array.isArray(list) ? list : []).map((x) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, max)
  return items.length ? items.join('\n') : null
}

/* ---------------- public: send an article for approval ---------------- */

export async function submitArticle({ title, slug, authorName, authorAvatar, readingTime, searchIntent, targetAudience, email, country, category, excerpt, tldr, blocks, coverImages, coverMeta, primaryKw, secondaryKw }) {
  const covers = sanitizeCovers(coverImages, coverMeta)
  const clean = {
    title: title.trim().slice(0, 160),
    slug: slugify(slug || title).slice(0, 120) || null,
    author_name: authorName.trim().slice(0, 80),
    // Only a small JPEG made by our own picker is accepted.
    author_avatar:
      typeof authorAvatar === 'string' && authorAvatar.startsWith('data:image/jpeg;base64,') && authorAvatar.length < 60000
        ? authorAvatar
        : null,
    reading_time: Number(readingTime) > 0 ? Math.min(240, Math.round(Number(readingTime))) : null,
    search_intent: cleanItems(searchIntent, 10),
    target_audience: cleanItems(targetAudience, 10),
    email: email.trim().toLowerCase().slice(0, 160),
    country: country.trim().slice(0, 80),
    category: category.trim().slice(0, 80),
    excerpt: excerpt.trim().slice(0, 300) || null,
    tldr: (tldr || '').trim().slice(0, 600) || null,
    content: sanitizeBlocks(blocks).map((b, i) => ({ ...b, id: b.id || `sub-${Date.now()}-${i}` })),
    cover_image: serializeCovers(covers.urls),
    cover_meta: covers.meta,
    keywords: joinKeywords((primaryKw || []).slice(0, 10).map((k) => String(k).slice(0, 60)), (secondaryKw || []).slice(0, 20).map((k) => String(k).slice(0, 60))),
    status: 'pending',
  }

  const { error } = await supabase.from('submissions').insert(clean)
  if (error) {
    console.error(error)
    if (/several articles|too many articles/i.test(error.message || '')) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Your article could not be sent. Please try again.' }
  }

  const emailed = await sendSubmissionEmail({ email: clean.email, title: clean.title })
  return { ok: true, emailed }
}

/* ---------------- admin only (protected by Supabase RLS) ---------------- */

export async function fetchSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error(error)
    return []
  }
  return data || []
}

export async function countPendingSubmissions() {
  const { count, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) return 0
  return count || 0
}

// Turns a submission into a real post. publish = true -> live now, false -> draft (to edit first).
// Returns { ok, postId?, error? }
export async function approveSubmission(sub, publish) {
  const base = slugify(sub.slug || sub.title) || 'article'
  const content = sanitizeBlocks(sub.content)
  const words = countWords(content)

  let postId = null
  let lastError = ''
  for (let attempt = 0; attempt < 4 && !postId; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: sub.title,
        slug,
        excerpt: sub.excerpt || '',
        content,
        tldr: sub.tldr || null,
        cover_image: sanitizeCovers(sub.cover_image, sub.cover_meta).urls.length ? serializeCovers(sanitizeCovers(sub.cover_image, sub.cover_meta).urls) : null,
        cover_meta: sanitizeCovers(sub.cover_image, sub.cover_meta).meta,
        keywords: Array.isArray(sub.keywords) ? sub.keywords : [],
        category: sub.category,
        author: sub.author_name,
        search_intent: sub.search_intent || null,
        target_audience: sub.target_audience || null,
        reading_time: sub.reading_time || Math.max(1, Math.round(words / 200)),
        published: Boolean(publish),
      })
      .select('id')
      .single()
    if (!error && data) postId = data.id
    else lastError = error?.message || 'Could not create the post.'
    if (error && !/duplicate/i.test(error.message || '')) break
  }
  if (!postId) return { ok: false, error: lastError }

  // Save the author's picture (only if that author has none yet, so a reader can never
  // replace an existing author's picture). Never blocks the approval.
  try {
    if (sub.author_avatar && String(sub.author_avatar).startsWith('data:image/jpeg;base64,')) {
      const { data: existing } = await supabase.from('authors').select('name, avatar_url').eq('name', sub.author_name).maybeSingle()
      if (!existing || !existing.avatar_url) {
        await supabase
          .from('authors')
          .upsert({ name: sub.author_name, avatar_url: sub.author_avatar, updated_at: new Date().toISOString() })
      }
    }
  } catch {
    /* ignore */
  }

  // Make sure the category exists in the menu (never blocks the approval).
  try {
    const { data: parent } = await supabase
      .from('categories')
      .select('id')
      .eq('name', sub.category)
      .is('parent_id', null)
      .maybeSingle()
    if (!parent) await supabase.from('categories').insert({ name: sub.category })
  } catch {
    /* ignore */
  }

  const { error: upErr } = await supabase
    .from('submissions')
    .update({ status: 'approved', post_id: postId })
    .eq('id', sub.id)
  if (upErr) console.error(upErr)
  return { ok: true, postId }
}

export async function rejectSubmission(id) {
  const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id)
  if (error) console.error(error)
  return !error
}

export async function deleteSubmission(id) {
  const { error } = await supabase.from('submissions').delete().eq('id', id)
  if (error) console.error(error)
  return !error
}