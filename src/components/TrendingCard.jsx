import { Link } from 'react-router-dom'
import { parseCovers } from '../lib/covers'
import CoverImage from './CoverImage'

export function formatViews(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(v)
}

// Compact overlay card used in the two side columns of the Blog page (most viewed posts).
export default function TrendingCard({ post, rank }) {
  const covers = parseCovers(post.cover_image)
  const views = Number(post.views) || 0

  const overlay = (
    <>
      <div className="ov-shade" />
      <div className="ov-content">
        <div className="ov-tags">
          <span className="ov-tag">{post.category || 'General'}</span>
        </div>
        <h3 className="ov-title">{post.title}</h3>
        <div className="ov-meta">
          <span>{views > 0 ? `${formatViews(views)} ${views === 1 ? 'view' : 'views'}` : 'New'}</span>
        </div>
      </div>
    </>
  )

  return (
    <Link to={`/blog/${post.slug}`} className="ov-card ov-small trend-card">
      {covers.length > 0 ? (
        <CoverImage images={covers} ratio="16 / 10" radius={14} fill>
          {overlay}
        </CoverImage>
      ) : (
        <div className="cover-frame cover-frame-fill ov-nocover" style={{ aspectRatio: '16 / 10', borderRadius: 14 }}>
          {overlay}
        </div>
      )}
    </Link>
  )
}