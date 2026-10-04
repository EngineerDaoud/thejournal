import { useEffect, useRef, useState } from 'react'

// Shows a list of images one at a time with arrows, dots and swipe.
// With a single image it just renders that image, no controls.
// `autoPlay` + `interval` make it advance on its own (used for the small
// live preview in the admin editor); it pauses while the pointer is over it
// or a finger is on it, and always resets to a plain image when there is
// only one to show.
export default function Carousel({ images = [], alt = '', style, autoPlay = false, interval = 5000 }) {
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

  if (count === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        style={{ width: '100%', borderRadius: 'var(--radius-md)', ...style }}
      />
    )
  }

  const go = (n) => setIndex(((n % count) + count) % count)

  return (
    <div
      className="carousel"
      style={style}
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
            <img src={src} alt={i === index ? alt : ''} draggable={false} />
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
  )
}