import { useEffect, useRef, useState } from 'react'

// One image "card" used everywhere a cover image is shown in a list.
//
// The frame is always the same shape (16:9), so every card lines up. Each picture
// is NEVER cropped: it is fitted whole into the frame, and any spare space is
// filled with a soft blurred copy of the same picture. A 16:9 picture
// (e.g. 1600 x 900) fills the frame exactly.
//
// Pass `images` (an array) for posts with several covers: with more than one
// image the card becomes a small carousel (arrows, dots, swipe, auto-play).
// A single image just renders as a plain image, no controls.
function Slide({ src }) {
  return (
    <>
      <img className="cover-frame-bg" src={src} alt="" aria-hidden="true" loading="lazy" />
      <img className="cover-frame-img" src={src} alt="" loading="lazy" draggable={false} />
    </>
  )
}

export default function CoverImage({
  images,
  src,
  ratio = '16 / 9',
  radius = 4,
  style,
  children,
  autoPlay = true,
  interval = 4500,
  fill = false,
}) {
  const list = images && images.length ? images : src ? [src] : []
  const count = list.length

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  // small random offset so cards on the same page do not all flip at the same moment
  const jitter = useRef(Math.floor(Math.random() * 1500))

  useEffect(() => {
    if (index > count - 1) setIndex(0)
  }, [count, index])

  useEffect(() => {
    if (!autoPlay || paused || count < 2) return undefined
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval + jitter.current)
    return () => clearInterval(id)
  }, [autoPlay, paused, count, interval])

  if (count === 0) return null

  const frameStyle = { aspectRatio: ratio, borderRadius: radius, ...style }
  const fillClass = fill ? ' cover-frame-fill' : ''

  if (count === 1) {
    return (
      <div className={`cover-frame${fillClass}`} style={frameStyle}>
        <Slide src={list[0]} />
        {children}
      </div>
    )
  }

  // These controls sit inside a <Link>, so a click must not open the post.
  const stop = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const go = (n) => setIndex(((n % count) + count) % count)

  return (
    <div
      className={`cover-frame cover-frame-multi${fillClass}`}
      style={frameStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
    >
      <div className="cover-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {list.map((url, i) => (
          <div className="cover-slide" key={`${url}-${i}`}>
            <Slide src={url} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="cover-arrow cover-arrow-prev"
        aria-label="Previous image"
        onClick={(e) => {
          stop(e)
          go(index - 1)
        }}
      >
        &#8249;
      </button>
      <button
        type="button"
        className="cover-arrow cover-arrow-next"
        aria-label="Next image"
        onClick={(e) => {
          stop(e)
          go(index + 1)
        }}
      >
        &#8250;
      </button>

      <div className="cover-dots">
        {list.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Image ${i + 1}`}
            className={`cover-dot${i === index ? ' is-on' : ''}`}
            onClick={(e) => {
              stop(e)
              go(i)
            }}
          />
        ))}
      </div>

      {children}
    </div>
  )
}