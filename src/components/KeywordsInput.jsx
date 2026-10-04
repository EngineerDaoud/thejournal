import { useRef, useState } from 'react'

// Type a keyword, press Enter (or comma) to add it as a chip. Add as many as
// you like. Drag a chip to reorder it, or click its x to remove it.
export default function KeywordsInput({ value = [], onChange }) {
  const [draft, setDraft] = useState('')
  const dragIndex = useRef(null)
  const [overIndex, setOverIndex] = useState(null)

  function addFromDraft() {
    const word = draft.trim()
    setDraft('')
    if (!word) return
    if (value.some((k) => k.toLowerCase() === word.toLowerCase())) return
    onChange([...value, word])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addFromDraft()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeAt(i) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function handleDragStart(i) {
    dragIndex.current = i
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    setOverIndex(i)
  }

  function handleDrop(i) {
    const from = dragIndex.current
    dragIndex.current = null
    setOverIndex(null)
    if (from === null || from === i) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    onChange(next)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 10px',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius)',
          background: 'var(--color-surface)',
          minHeight: 46,
          alignItems: 'center',
        }}
      >
        {value.map((word, i) => (
          <span
            key={word + i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => setOverIndex(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 6px 4px 12px',
              borderRadius: 999,
              border: `1.5px solid var(--color-accent)`,
              color: 'var(--color-accent)',
              background: overIndex === i ? 'var(--color-accent-soft)' : 'transparent',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'grab',
              userSelect: 'none',
            }}
            title="Drag to reorder"
          >
            {word}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${word}`}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              &times;
            </button>
          </span>
        ))}

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addFromDraft}
          placeholder={value.length === 0 ? 'Type a keyword and press Enter' : 'Add another...'}
          style={{
            flex: '1 1 140px',
            minWidth: 140,
            border: 'none',
            outline: 'none',
            padding: '4px 2px',
            background: 'transparent',
          }}
        />
      </div>
      <div className="field-hint">Press Enter to add. Drag a keyword to reorder it.</div>
    </div>
  )
}