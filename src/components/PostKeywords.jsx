// Green-bordered keyword pills shown on the article, in the order set in the editor.
export default function PostKeywords({ keywords }) {
  if (!keywords || keywords.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '4px 0 26px' }}>
      {keywords.map((word) => (
        <span
          key={word}
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            border: '1.5px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}