// Vercel serverless function: serves the normal index.html for /blog/<slug>, but with that
// article's own title, description, share image and structured data already inside <head>.
// Google, WhatsApp, Facebook, X and LinkedIn read these tags without running any JavaScript.

const SITE_URL = 'https://thejournal.vercel.app'
const SITE_NAME = 'The Journal'
const DEFAULT_DESC =
  'Daily updates on technology, the environment and education, plus the topics trending right now.'

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

function cleanText(s) {
  return String(s || '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](link) -> text
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cut(s, max) {
  if (s.length <= max) return s
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '\u2026'
}

function firstImage(value) {
  const first = String(value || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)[0]
  if (!first) return ''
  return /^https?:\/\//i.test(first) ? first : `${SITE_URL}${first.startsWith('/') ? '' : '/'}${first}`
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = host ? `https://${host}` : SITE_URL

  // The normal single-page-app shell (a static file, so this request is not rewritten again).
  let html
  try {
    const r = await fetch(`${origin}/index.html`)
    if (!r.ok) throw new Error('index.html ' + r.status)
    html = await r.text()
  } catch (e) {
    res.status(502).send('Temporarily unavailable')
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  let post = null
  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/posts?select=title,excerpt,cover_image,author,category,created_at,slug` +
        `&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    )
    if (r.ok) {
      const rows = await r.json()
      post = rows && rows[0]
    }
  } catch (e) {
    /* fall through: the plain page is still served */
  }

  if (post) {
    const title = String(post.title || '').replace(/\s+/g, ' ').trim()
    const fullTitle = `${title} \u2014 ${SITE_NAME}`
    const desc = cut(cleanText(post.excerpt) || DEFAULT_DESC, 160)
    const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`
    const image = firstImage(post.cover_image)
    const published = post.created_at ? new Date(post.created_at).toISOString() : ''

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: desc,
      mainEntityOfPage: url,
      ...(image ? { image: [image] } : {}),
      ...(published ? { datePublished: published } : {}),
      ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
      publisher: { '@type': 'Organization', name: SITE_NAME },
    }

    const tags = [
      `<meta name="description" content="${esc(desc)}" />`,
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      image ? `<meta property="og:image" content="${esc(image)}" />` : '',
      published ? `<meta property="article:published_time" content="${published}" />` : '',
      post.category ? `<meta property="article:section" content="${esc(post.category)}" />` : '',
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    ]
      .filter(Boolean)
      .join('\n    ')

    html = html
      .replace(/<title>[^<]*<\/title>/i, `<title>${esc(fullTitle)}</title>`)
      .replace(/<meta\s+name="description"[^>]*>/i, '')
      .replace('</head>', `    ${tags}\n  </head>`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  res.status(200).send(html)
}