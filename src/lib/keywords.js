// Primary and secondary keywords live in the SAME existing `keywords` column (a list of text),
// so no database change is needed. A primary keyword is saved with the tag "p:" in front
// ("p:ai tools"); anything without the tag (including all your older posts) is secondary.

const TAG = 'p:'

export function splitKeywords(list) {
  const primary = []
  const secondary = []
  for (const raw of list || []) {
    const word = String(raw || '').trim()
    if (!word) continue
    if (word.startsWith(TAG)) {
      const clean = word.slice(TAG.length).trim()
      if (clean) primary.push(clean)
    } else {
      secondary.push(word)
    }
  }
  return { primary, secondary }
}

export function joinKeywords(primary = [], secondary = []) {
  const seen = new Set()
  const out = []
  for (const w of primary) {
    const k = String(w).trim()
    if (k && !seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase())
      out.push(TAG + k)
    }
  }
  for (const w of secondary) {
    const k = String(w).trim()
    if (k && !seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase())
      out.push(k)
    }
  }
  return out
}