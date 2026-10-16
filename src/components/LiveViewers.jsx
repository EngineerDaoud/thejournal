import { useEffect, useState } from 'react'

// "N reading now": people on this article right now (last 30 minutes), from Google Analytics
// real-time data through /api/live. Nothing is shown until real data arrives, or if it fails.
export default function LiveViewers({ title, style }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!title) return undefined
    let alive = true
    setCount(null)

    async function load() {
      try {
        const r = await fetch(`/api/live?title=${encodeURIComponent(title)}`)
        const data = await r.json()
        if (alive && data && data.ok) setCount(data.count)
      } catch (e) {
        /* leave the badge hidden */
      }
    }

    load()
    const timer = setInterval(() => {
      if (!document.hidden) load()
    }, 30 * 1000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [title])

  if (!count) return null

  return (
    <span style={style} title="People on this article right now (Google Analytics real-time)">
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#3ddc84',
          marginRight: 8,
          verticalAlign: 'middle',
        }}
      />
      {count} Live Viewer
    </span>
  )
}