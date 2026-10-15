// "Search Intent: ..." and "Target Audience: ..." paragraphs written in the admin editor are pulled
// out of the article body so they can be shown in black boxes in the right column instead.
// No database change needed: they stay normal paragraph blocks in the post content.

const LABELS = [
  { key: 'intent', title: 'Search Intent', re: /^\s*(?:\*\*|__)?\s*search\s+intent\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*([\s\S]*)$/i },
  { key: 'audience', title: 'Target Audience', re: /^\s*(?:\*\*|__)?\s*target\s+audience\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*([\s\S]*)$/i },
]

export function splitPostInfo(blocks) {
  const body = []
  const found = {}
  for (const b of blocks || []) {
    let matched = false
    if (b && b.type === 'text' && typeof b.content === 'string' && !b.htmlMode) {
      for (const l of LABELS) {
        if (found[l.key]) continue
        const m = b.content.match(l.re)
        if (m && m[1].trim()) {
          found[l.key] = { title: l.title, text: m[1].trim() }
          matched = true
          break
        }
      }
    }
    if (!matched) body.push(b)
  }
  const info = LABELS.map((l) => found[l.key]).filter(Boolean)
  return { body, info }
}

// Search Intent / Target Audience are saved as ONE text value, one item per line.
export function splitItems(value) {
  return String(value || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}