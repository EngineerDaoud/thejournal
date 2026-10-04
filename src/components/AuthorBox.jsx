import { Link } from 'react-router-dom'
import { authorBio } from '../lib/siteConfig'
import AuthorAvatar from './AuthorAvatar'

// Small "about the author" card shown under each post.
export default function AuthorBox({ name }) {
  if (!name) return null
  return (
    <div className="author-box">
      <AuthorAvatar name={name} />
      <div style={{ minWidth: 0 }}>
        <div className="author-box-label">Written by</div>
        <Link to={`/author/${encodeURIComponent(name)}`} className="author-box-name">
          {name}
        </Link>
        <p className="author-box-bio">{authorBio(name)}</p>
        <Link
          to={`/author/${encodeURIComponent(name)}`}
          className="btn btn-outline"
          style={{ fontSize: 13, padding: '7px 14px', marginTop: 4 }}
        >
          More posts by {name}
        </Link>
      </div>
    </div>
  )
}