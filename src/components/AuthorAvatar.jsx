import { useEffect, useState } from 'react'
import { loadAuthorAvatars } from '../lib/authors'
import { authorInitial } from '../lib/siteConfig'

// Drop-in replacement for the plain-initial circle: shows the picture that was
// saved for this author name in the admin editor, or the initial if none was set.
export default function AuthorAvatar({ name, size = 'normal' }) {
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    let alive = true
    loadAuthorAvatars().then((map) => {
      if (alive) setAvatarUrl(map[name] || null)
    })
    return () => {
      alive = false
    }
  }, [name])

  const cls = size === 'large' ? 'author-avatar author-avatar-lg' : 'author-avatar'

  if (avatarUrl) {
    return (
      <div className={cls} style={{ padding: 0, overflow: 'hidden' }}>
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      </div>
    )
  }

  return <div className={cls}>{authorInitial(name)}</div>
}