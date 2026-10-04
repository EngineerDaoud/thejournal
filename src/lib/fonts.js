import { supabase } from './supabaseClient'

// ---------- Google Fonts (loaded only when actually used) ----------
// Every font here is loaded on demand, so the public site never downloads a
// font that no post uses.
export const GOOGLE_FONTS = [
  // Sans-serif
  { name: 'Inter', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Poppins', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Montserrat', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Roboto', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Open Sans', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Lato', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Nunito', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Raleway', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Work Sans', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'DM Sans', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Manrope', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Rubik', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Quicksand', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Mulish', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Source Sans 3', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Noto Sans', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Oswald', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Barlow', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Josefin Sans', cat: 'Sans-serif', fallback: 'sans-serif' },
  { name: 'Ubuntu', cat: 'Sans-serif', fallback: 'sans-serif' },
  // Serif
  { name: 'Fraunces', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Lora', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Merriweather', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Playfair Display', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Crimson Text', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'EB Garamond', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Libre Baskerville', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'PT Serif', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Source Serif 4', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Cormorant Garamond', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Bitter', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'DM Serif Display', cat: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Noto Serif', cat: 'Serif', fallback: 'Georgia, serif' },
  // Display / Handwriting
  { name: 'Bebas Neue', cat: 'Display', fallback: 'Impact, sans-serif' },
  { name: 'Anton', cat: 'Display', fallback: 'Impact, sans-serif' },
  { name: 'Lobster', cat: 'Display', fallback: 'cursive' },
  { name: 'Pacifico', cat: 'Display', fallback: 'cursive' },
  { name: 'Dancing Script', cat: 'Display', fallback: 'cursive' },
  { name: 'Caveat', cat: 'Display', fallback: 'cursive' },
  { name: 'Satisfy', cat: 'Display', fallback: 'cursive' },
  { name: 'Great Vibes', cat: 'Display', fallback: 'cursive' },
  { name: 'Permanent Marker', cat: 'Display', fallback: 'cursive' },
  { name: 'Abril Fatface', cat: 'Display', fallback: 'serif' },
  // Monospace
  { name: 'Roboto Mono', cat: 'Monospace', fallback: 'monospace' },
  { name: 'Fira Code', cat: 'Monospace', fallback: 'monospace' },
  { name: 'JetBrains Mono', cat: 'Monospace', fallback: 'monospace' },
  { name: 'Source Code Pro', cat: 'Monospace', fallback: 'monospace' },
  // Urdu / Arabic
  { name: 'Noto Nastaliq Urdu', cat: 'Urdu / Arabic', fallback: 'serif' },
  { name: 'Amiri', cat: 'Urdu / Arabic', fallback: 'serif' },
  { name: 'Scheherazade New', cat: 'Urdu / Arabic', fallback: 'serif' },
  { name: 'Lateef', cat: 'Urdu / Arabic', fallback: 'serif' },
  { name: 'Noto Naskh Arabic', cat: 'Urdu / Arabic', fallback: 'serif' },
  { name: 'Cairo', cat: 'Urdu / Arabic', fallback: 'sans-serif' },
  { name: 'Tajawal', cat: 'Urdu / Arabic', fallback: 'sans-serif' },
  { name: 'Harmattan', cat: 'Urdu / Arabic', fallback: 'sans-serif' },
]

// System fonts: nothing to load.
export const SYSTEM_FONTS = [
  { name: 'Georgia', css: 'Georgia, serif', cat: 'System' },
  { name: 'Arial', css: 'Arial, Helvetica, sans-serif', cat: 'System' },
  { name: 'Times New Roman', css: "'Times New Roman', Times, serif", cat: 'System' },
  { name: 'Courier New', css: "'Courier New', monospace", cat: 'System' },
  { name: 'Verdana', css: 'Verdana, Geneva, sans-serif', cat: 'System' },
  { name: 'Tahoma', css: 'Tahoma, Geneva, sans-serif', cat: 'System' },
  { name: 'Trebuchet MS', css: "'Trebuchet MS', sans-serif", cat: 'System' },
]

const SAFE_NAME = /^[A-Za-z0-9 _-]{1,40}$/
export const isSafeFontName = (n) => SAFE_NAME.test((n || '').trim())

const googleByName = (n) => GOOGLE_FONTS.find((f) => f.name.toLowerCase() === (n || '').toLowerCase())

// ---------- Loading ----------
const loaded = new Set()
const FONT_FILE_TYPES = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

function googleHref(name) {
  const fam = encodeURIComponent(name).replace(/%20/g, '+')
  return `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`
}

function addLink(href) {
  if (typeof document === 'undefined') return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function addFontFace(f) {
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.setAttribute('data-custom-font', f.name)
  style.textContent = `@font-face { font-family: '${f.name}'; src: url('${f.url}') format('${f.format || 'woff2'}'); font-display: swap; }`
  document.head.appendChild(style)
}

// ---------- Custom fonts (kept in the database) ----------
let customCache = null // Promise<array>

export function getCustomFonts(force = false) {
  if (!customCache || force) {
    customCache = supabase
      .from('custom_fonts')
      .select('*')
      .order('name')
      .then(({ data, error }) => (error ? [] : data || []))
      .catch(() => [])
  }
  return customCache
}

/** Makes sure a font is available on the page. Safe to call many times. */
export function ensureFont(name) {
  const clean = (name || '').trim()
  if (!clean || loaded.has(clean.toLowerCase()) || !isSafeFontName(clean)) return
  if (SYSTEM_FONTS.some((f) => f.name.toLowerCase() === clean.toLowerCase())) return
  loaded.add(clean.toLowerCase())
  if (googleByName(clean)) {
    addLink(googleHref(googleByName(clean).name))
    return
  }
  // Not built in: it is one of the admin's own fonts.
  getCustomFonts().then((list) => {
    const f = list.find((x) => x.name.toLowerCase() === clean.toLowerCase())
    if (!f) return
    if (f.source === 'google') addLink(googleHref(f.name))
    else if (f.url) addFontFace(f)
  })
}

const previewed = new Set()

/**
 * Menu previews only. Asks Google for just the letters needed to draw the font
 * NAMES (a few KB per font instead of the whole font). A font that is really
 * used in the text is loaded in full by ensureFont() afterwards, and that
 * later full version takes over.
 */
export function loadAllForPreview(list) {
  const todo = list.filter((f) => !loaded.has(f.name.toLowerCase()) && !previewed.has(f.name.toLowerCase()))
  if (todo.length === 0) return
  todo.forEach((f) => previewed.add(f.name.toLowerCase()))
  const families = todo.map((f) => 'family=' + encodeURIComponent(f.name).replace(/%20/g, '+')).join('&')
  const letters = encodeURIComponent('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -')
  addLink(`https://fonts.googleapis.com/css2?${families}&text=${letters}&display=swap`)
}

export function loadCustomForPreview(list) {
  list.forEach((f) => {
    if (loaded.has(f.name.toLowerCase())) return
    loaded.add(f.name.toLowerCase())
    if (f.source === 'google') addLink(googleHref(f.name))
    else if (f.url) addFontFace(f)
  })
}

// ---------- Admin actions ----------
function cleanFontName(raw) {
  return (raw || '').replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9 _-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
}

export async function uploadFontFile(file, displayName) {
  if (!file) return { error: 'No file selected.' }
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  const format = FONT_FILE_TYPES[ext]
  if (!format) return { error: 'Use a .woff2, .woff, .ttf or .otf font file.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Font file is larger than 5 MB.' }
  const name = cleanFontName(displayName || file.name)
  if (!isSafeFontName(name)) return { error: 'Give the font a simple name (letters, numbers, spaces).' }

  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const path = `fonts/${rand}.${ext}`

  const { error: upErr } = await supabase.storage.from('blog-images').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (upErr) return { error: `Upload failed: ${upErr.message}. See the note in migration-fonts.sql about allowed file types.` }
  const { data: pub } = supabase.storage.from('blog-images').getPublicUrl(path)

  const { data, error } = await supabase
    .from('custom_fonts')
    .insert({ name, source: 'upload', url: pub.publicUrl, format })
    .select()
    .single()
  if (error) {
    await supabase.storage.from('blog-images').remove([path])
    return { error: /duplicate|unique/i.test(error.message) ? `A font named "${name}" already exists.` : error.message }
  }
  getCustomFonts(true)
  return { font: data }
}

export async function addGoogleFontByName(raw) {
  const name = (raw || '').replace(/\s+/g, ' ').trim()
  if (!isSafeFontName(name)) return { error: 'Type the exact Google Font name, e.g. Dancing Script.' }
  if (googleByName(name)) return { error: `${googleByName(name).name} is already in the list.` }
  // Check it really exists on Google Fonts before saving it.
  try {
    const res = await fetch(googleHref(name))
    if (!res.ok) return { error: `"${name}" was not found on Google Fonts. Check the spelling.` }
  } catch {
    return { error: 'Could not reach Google Fonts. Check your internet.' }
  }
  const { data, error } = await supabase
    .from('custom_fonts')
    .insert({ name, source: 'google' })
    .select()
    .single()
  if (error) return { error: /duplicate|unique/i.test(error.message) ? `"${name}" is already added.` : error.message }
  getCustomFonts(true)
  return { font: data }
}

export async function deleteCustomFont(font) {
  const { error } = await supabase.from('custom_fonts').delete().eq('id', font.id)
  if (error) return { error: error.message }
  if (font.source === 'upload' && font.url) {
    const i = font.url.indexOf('/blog-images/')
    if (i >= 0) await supabase.storage.from('blog-images').remove([decodeURIComponent(font.url.slice(i + 13).split('?')[0])])
  }
  getCustomFonts(true)
  return {}
}