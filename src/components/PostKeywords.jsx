import { splitKeywords } from '../lib/keywords'

// Black "Keywords" box shown in the right column, under the comments.
// Primary keywords are solid white pills, secondary keywords are white-outlined pills.
export default function PostKeywords({ keywords }) {
  const { primary, secondary } = splitKeywords(keywords)
  if (primary.length === 0 && secondary.length === 0) return null

  return (
    <section className="kw-box" aria-label="Keywords">
      <h3 className="kw-title">Keywords</h3>

      {primary.length > 0 && (
        <>
          <div className="kw-label">Primary</div>
          <div className="kw-list">
            {primary.map((word) => (
              <span key={`p-${word}`} className="kw-pill kw-pill-primary">
                {word}
              </span>
            ))}
          </div>
        </>
      )}

      {secondary.length > 0 && (
        <>
          <div className="kw-label">{primary.length > 0 ? 'Secondary' : 'Topics'}</div>
          <div className="kw-list">
            {secondary.map((word) => (
              <span key={`s-${word}`} className="kw-pill">
                {word}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}