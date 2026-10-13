import { useEffect, useRef, useState } from 'react'

// Shows a list of images one at a time with arrows, dots and swipe.
// With a single image it just renders that image, no controls.
// `autoPlay` + `interval` make it advance on its own (used for the small
// live preview in the admin editor); it pauses while the pointer is over it
// or a finger is on it, and always resets to a plain image when there is
// only one to show.
const CAPTION = { textAlign: 'center', fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 8 }

export default function Carousel({ images = [], alt = '', metas = [], style, autoPlay = false, interval = 5000 }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  const count = images.length

  useEffect(() => {
    if (index > count - 1) setIndex(0)
  }, [count, index])

  useEffect(() => {
    if (!autoPlay || paused || count < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval)
    return () => clearInterval(id)
  }, [autoPlay, paused, count, interval])

  if (count === 0) return null

  // metas[i] = { alt, title, caption } typed by the admin for image i (all optional)
  if (count === 1) {
    const m = metas[0] || {}
    return (
      <figure style={{ margin: 0, ...style }}>
        <img
          src={images[0]}
          alt={m.alt || alt}
          title={m.title || undefined}
          style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block' }}
        />
        {m.caption && <figcaption style={CAPTION}>{m.caption}</figcaption>}
      </figure>
    )
  }

  const go = (n) => setIndex(((n % count) + count) % count)

  const cap = metas[index]?.caption

  return (
    <div style={style}>
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1)
        if (e.key === 'ArrowRight') go(index + 1)
      }}
      onTouchStart={(e) => {
        setPaused(true)
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
          touchX.current = null
        }
        setPaused(false)
      }}
      tabIndex={0}
      aria-roledescription="carousel"
    >
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <div className="carousel-slide" key={`${src}-${i}`} aria-hidden={i !== index}>
            <img
              src={src}
              alt={i === index ? metas[i]?.alt || alt : ''}
              title={metas[i]?.title || undefined}
              draggable={false}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-prev"
        aria-label="Previous image"
        onClick={() => go(index - 1)}
      >
        &#8249;
      </button>
      <button
        type="button"
        className="carousel-arrow carousel-next"
        aria-label="Next image"
        onClick={() => go(index + 1)}
      >
        &#8250;
      </button>

      <div className="carousel-count">
        {index + 1} / {count}
      </div>

      <div className="carousel-dots">
        {images.map((src, i) => (
          <button
            key={`dot-${src}-${i}`}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            className={`carousel-dot${i === index ? ' is-on' : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
    {cap && <div style={CAPTION}>{cap}</div>}
    </div>
  )
}