import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const SIZE = 128 // px, square

// Shrinks and crops any picked image down to a small square JPEG, so it saves
// quickly and fits comfortably in the account's profile data.
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

// Each signed-in admin sets their own picture here — it is saved on their own
// account, so if there is more than one admin, each of them has their own.
export default function AdminAvatar() {
  const { session, avatarUrl, setAvatar } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const dataUrl = await resizeToSquareDataUrl(file)
      const err = await setAvatar(dataUrl)
      if (err) setError('Could not save your picture. Please try again.')
    } catch {
      setError('Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const initial = (session?.user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* the picture itself is the button; a popup says what it does */}
      <span
        className="avatar-wrap"
        data-tip={busy ? 'Saving...' : avatarUrl ? 'Change image' : 'Add image'}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={avatarUrl ? 'Change your picture' : 'Add your picture'}
          className="avatar-btn"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid var(--color-line)',
            padding: 0,
            overflow: 'hidden',
            cursor: busy ? 'default' : 'pointer',
            background: avatarUrl ? 'transparent' : 'var(--color-ink)',
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your picture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{initial}</span>
          )}
        </button>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}