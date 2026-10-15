import { splitItems } from '../lib/postInfo'

// Black boxes (white text) in the right column: Search Intent, Target Audience.
// Every item the admin added is shown as its own pill, like the keywords.
export default function PostInfoBoxes({ items }) {
  if (!items || items.length === 0) return null
  return (
    <>
      {items.map((it) => {
        const list = splitItems(it.text)
        if (list.length === 0) return null
        return (
          <section key={it.title} className="kw-box info-box" aria-label={it.title}>
            <h3 className="kw-title">{it.title}</h3>
            <div className="kw-list">
              {list.map((word, i) => (
                <span key={`${word}-${i}`} className="kw-pill">
                  {word}
                </span>
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}