import { useEffect } from 'react'
import PostRenderer from './PostRenderer'
import RichText from './RichText'
import Carousel from './Carousel'
import { SITE } from '../lib/siteConfig'

const BADGE = { display: 'inline-block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, background: 'var(--color-ink)', color: '#fff', padding: '5px 12px', borderRadius: 4 }

// Full-screen preview: shows the article the way readers will see it on the site.
// Used by the Write for us page and the admin editor (nothing is saved or sent).
export default function ArticlePreview({
  title,
  author,
  category,
  readingTime,
  tldr,
  blocks = [],
  coverImages = [],
  coverMeta = {},
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const metas = coverImages.map((u) => coverMeta[u] || {})
  const minutes = Number(readingTime) || 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Article preview"
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--color-bg, #fff)', overflowY: 'auto' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 20px',
          background: 'var(--color-accent-soft)',
          borderBottom: '1px solid var(--color-line)',
          fontSize: 14,
        }}
      >
        <span>
          <strong>Preview.</strong> This is how your article will look on {SITE.name}. Nothing has been sent yet.
        </span>
        <button type="button" className="btn" style={{ fontSize: 13, padding: '7px 14px' }} onClick={onClose}>
          Close preview
        </button>
      </div>

      <div className="measure" style={{ paddingTop: 50, paddingBottom: 80 }}>
        <span style={BADGE}>{category || 'General'}</span>
        {minutes > 0 && (
          <span style={{ ...BADGE, marginLeft: 10 }}>Estimated reading time: {minutes} min</span>
        )}
        <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: '14px 0 26px', lineHeight: 1.4 }}>
          {author && <>By {author}{' \u00b7 '}</>}
          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 42px)', marginBottom: 24 }}>{title || 'Your title will appear here'}</h1>

        {coverImages.length > 0 && (
          <Carousel images={coverImages} metas={metas} alt={title} style={{ marginBottom: 34 }} />
        )}

        {tldr && tldr.trim() && (
          <div
            style={{
              background: 'var(--color-accent-soft)',
              borderLeft: '3px solid var(--color-accent)',
              padding: '16px 20px',
              borderRadius: 4,
              marginBottom: 34,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 6 }}>TL;DR</div>
            <div><RichText text={tldr} /></div>
          </div>
        )}

        <PostRenderer blocks={blocks} />

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close preview
          </button>
        </div>
      </div>
    </div>
  )
}