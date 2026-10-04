import { Link } from 'react-router-dom'
import { parseCovers } from '../lib/covers'
import CoverImage from './CoverImage'
import AuthorAvatar from './AuthorAvatar'

// Card with the text written on top of the picture (dark see-through fade at the bottom).
// size: 'large' (main post) | 'normal' (grid) | 'small' (side / related)
const RATIOS = { large: '4 / 3', normal: '16 / 9', small: '16 / 10' }

export default function PostCard({ post, size = 'normal', ratio }) {
  const covers = parseCovers(post.cover_image)
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const overlay = (
    <>
      <div className="ov-shade" />
      <span className="ov-date">{date}</span>
      {post.author && (
        <span className="ov-author" tabIndex={0}>
          <AuthorAvatar name={post.author} />
          <span className="ov-author-pop">{post.author}</span>
        </span>
      )}
      <div className="ov-content">
        <div className="ov-tags">
          <span className="ov-tag">{post.category || 'General'}</span>
          {post.subcategory && size !== 'small' && <span className="ov-tag">{post.subcategory}</span>}
        </div>
        <h3 className="ov-title">{post.title}</h3>
        {post.excerpt && size === 'large' && <p className="ov-excerpt">{post.excerpt}</p>}
      </div>
    </>
  )

  return (
    <Link to={`/blog/${post.slug}`} className={`ov-card ov-${size}`} style={{ display: 'block' }}>
      {covers.length > 0 ? (
        <CoverImage images={covers} ratio={ratio || RATIOS[size] || RATIOS.normal} radius={16} fill>
          {overlay}
        </CoverImage>
      ) : (
        <div className="cover-frame cover-frame-fill ov-nocover" style={{ aspectRatio: ratio || RATIOS[size] || RATIOS.normal, borderRadius: 16 }}>
          {overlay}
        </div>
      )}
    </Link>
  )
}