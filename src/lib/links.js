// Works out where a link should go.
//  inner = a page on this site (opens in the same tab)
//  outer = another website / mailto / tel (opens in a new tab)
// Returns null for anything unsafe (e.g. javascript:).

const FILE_EXT = /\.(ico|png|jpe?g|gif|svg|webp|css|js|html?|txt|xml|pdf|json)$/i
const DOMAIN = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i

function looksLikeDomain(segment) {
  return DOMAIN.test(segment) && !FILE_EXT.test(segment)
}

export function resolveLink(raw) {
  const url = (raw || '').trim()
  if (!url) return null

  if (/^(mailto:|tel:)/i.test(url)) return { type: 'outer', href: url }
  if (/^https?:\/\//i.test(url)) return { type: 'outer', href: url }
  if (url.startsWith('//')) return { type: 'outer', href: 'https:' + url }

  // Any other "scheme:" (javascript:, data:, ...) is blocked.
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null

  if (url.startsWith('/')) {
    // "/google.com" is really a website typed into the inner-link box.
    const first = url.slice(1).split(/[/?#]/)[0]
    if (looksLikeDomain(first)) return { type: 'outer', href: 'https://' + url.slice(1) }
    return { type: 'inner', href: url }
  }

  // "google.com" or "www.google.com/page" without https://
  const firstPart = url.split(/[/?#]/)[0]
  if (looksLikeDomain(firstPart)) return { type: 'outer', href: 'https://' + url }

  // A bare word like "contact" -> "/contact"
  return { type: 'inner', href: '/' + url }
}