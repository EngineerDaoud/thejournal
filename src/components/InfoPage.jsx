import { useEffect } from 'react'
import { SITE } from '../lib/siteConfig'

// Shared shell for the plain text pages (About, Editorial Policy, Privacy, ...).
// Text style (justified paragraphs, bullet lists, note boxes) lives in index.css
// under ".info-page".
// Sets (or creates) one <meta>/<link> tag in <head>.
function setHead(selector, create, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(create)
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
}

export default function InfoPage({ title, description, intro, updated, children }) {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE.name}`
    const desc = description || intro || SITE.description
    const url = window.location.origin + window.location.pathname
    document.title = fullTitle

    // SEO: description, canonical address and social-share tags for this page
    setHead('meta[name="description"]', 'meta', { name: 'description', content: desc })
    setHead('link[rel="canonical"]', 'link', { rel: 'canonical', href: url })
    setHead('meta[property="og:title"]', 'meta', { property: 'og:title', content: fullTitle })
    setHead('meta[property="og:description"]', 'meta', { property: 'og:description', content: desc })
    setHead('meta[property="og:url"]', 'meta', { property: 'og:url', content: url })
    setHead('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'website' })
    setHead('meta[property="og:site_name"]', 'meta', { property: 'og:site_name', content: SITE.name })
  }, [title, description, intro])

  return (
    <div className="measure info-page" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <h1 style={{ marginBottom: 14 }}>{title}</h1>
      {updated && <p className="info-updated">Last updated: {updated}</p>}
      {intro && <p className="info-intro">{intro}</p>}
      {children}
    </div>
  )
}