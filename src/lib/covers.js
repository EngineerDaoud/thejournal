// A post can have one cover image or several. They are kept in the existing
// `cover_image` text column, one URL per line, so nothing in the database has
// to change: an old post with a single URL still reads back as a list of one.

export function parseCovers(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  return String(value)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeCovers(list) {
  const clean = (list || []).map((s) => String(s).trim()).filter(Boolean)
  return clean.length ? clean.join('\n') : null
}

// The one image to use where there is only room for one (listing cards).
export function firstCover(value) {
  return parseCovers(value)[0] || ''
}