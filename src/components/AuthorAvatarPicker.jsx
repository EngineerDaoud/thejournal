import { useEffect, useRef, useState } from 'react'
import { loadAuthorAvatars, saveAuthorAvatar } from '../lib/authors'
import { authorInitial } from '../lib/siteConfig'

const SIZE = 128 // px, square

// Shrinks and crops any picked image down to a small square JPEG.
function resizeToSquareDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      img.onerror = reject
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// A compact avatar with a small camera-icon button on its corner. Whichever
// name is currently typed or picked, this shows that owner's saved picture
// (if any) — picking the same owner again later always shows what was saved.
export default function AuthorAvatarPicker({ name }) {
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const cleanName = (name || '').trim()

  useEffect(() => {
    let alive = true
    setError('')
    if (!cleanName) {
      setAvatarUrl(null)
      return
    }
    loadAuthorAvatars().then((map) => {
      if (alive) setAvatarUrl(map[cleanName] || null)
    })
    return () => {
      alive = false
    }
  }, [cleanName])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cleanName) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const dataUrl = await resizeToSquareDataUrl(file)
      const res = await saveAuthorAvatar(cleanName, dataUrl)
      if (res.ok) setAvatarUrl(dataUrl)
      else setError(res.error)
    } catch {
      setError('Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: 44, height: 44, flex: '0 0 auto' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid var(--color-line)',
          overflow: 'hidden',
          background: avatarUrl ? 'transparent' : 'var(--color-accent-soft)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={cleanName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent)' }}>
            {cleanName ? authorInitial(cleanName) : '?'}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || !cleanName}
        title={cleanName ? `Change ${cleanName}'s picture` : 'Type or pick an owner first'}
        aria-label={cleanName ? `Change ${cleanName}'s picture` : 'Set owner picture'}
        style={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-ink)',
          border: '2px solid var(--color-bg)',
          color: 'var(--color-bg)',
          cursor: busy || !cleanName ? 'default' : 'pointer',
          padding: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {error && (
        <span
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            fontSize: 11,
            color: 'var(--color-danger)',
            whiteSpace: 'nowrap',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}