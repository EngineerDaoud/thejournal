// Vercel serverless function: builds sitemap.xml automatically from Supabase.
// Served at /sitemap.xml (see the rewrite in vercel.json).

const SITE_URL = 'https://thejournal.vercel.app'

const STATIC_PAGES = [
  '/',
  '/blog',
  '/about',
  '/contact',
  '/editorial-policy',
  '/image-credits',
  '/privacy-policy',
  '/terms-and-conditions',
  '/disclaimer',
]

const escapeXml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  let posts = []
  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/posts?select=slug,created_at&published=eq.true&order=created_at.desc`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    )
    if (r.ok) posts = await r.json()
  } catch (e) {
    // If Supabase is unreachable we still return the static pages.
  }

  const urls = [
    ...STATIC_PAGES.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`),
    ...posts
      .filter((p) => p.slug)
      .map((p) => {
        const lastmod = p.created_at ? new Date(p.created_at).toISOString() : null
        return (
          `  <url><loc>${escapeXml(`${SITE_URL}/blog/${encodeURIComponent(p.slug)}`)}</loc>` +
          (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
          `</url>`
        )
      }),
  ]

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}