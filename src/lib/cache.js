// Tiny helpers so data survives page changes (and even page reloads).
// Idea: show what we already have INSTANTLY, then refresh quietly in the background.

export function readStored(key, maxAgeMs) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw)
    if (maxAgeMs && Date.now() - at > maxAgeMs) return null
    return { at, data }
  } catch {
    return null
  }
}

export function writeStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* storage full or blocked: ignore, memory cache still works */
  }
}

// Run something when the browser is idle (so it never slows down the page the visitor is reading).
export function whenIdle(fn, timeout = 2500) {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout })
  else setTimeout(fn, 800)
}