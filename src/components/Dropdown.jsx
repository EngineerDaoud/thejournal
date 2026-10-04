import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'

// A styled replacement for <select>. Native selects can't be given rounded
// corners, hover states or a highlighted "chosen" row, so this draws its own
// menu instead.
//
// The menu is positioned with `position: fixed` (not absolute) on purpose:
// the formatting sidebar scrolls internally, and an absolutely positioned
// menu would be clipped by it.
//
// `preserveFocus` stops the trigger/menu from stealing focus away from a
// contentEditable paragraph, so the user's text selection survives the click.
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  preserveFocus = false,
  resetAfterSelect = false,
  size = 'md',
  title,
  id,
  style,
  emptyText = 'Nothing to choose yet',
  onOpen,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))
  const label = selected ? selected.label : placeholder

  function place() {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, 170)
    const spaceBelow = window.innerHeight - r.bottom
    const openUp = spaceBelow < 200 && r.top > spaceBelow
    setPos({
      left: Math.min(Math.max(8, r.left), window.innerWidth - width - 8),
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      width,
      maxHeight: Math.max(150, (openUp ? r.top : spaceBelow) - 18),
    })
  }

  useLayoutEffect(() => {
    if (open) {
      place()
      if (onOpen) onOpen()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScroll = () => place()
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) setActiveIndex(options.findIndex((o) => String(o.value) === String(value)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function choose(opt) {
    setOpen(false)
    if (!resetAfterSelect && String(opt.value) === String(value)) return
    onChange(opt.value)
  }

  function onKeyDown(e) {
    if (disabled) return
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt) choose(opt)
    }
  }

  const hold = preserveFocus ? (e) => e.preventDefault() : undefined

  return (
    <div className="dd" ref={wrapRef} style={style}>
      <button
        id={id}
        ref={btnRef}
        type="button"
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`dd-trigger ${size === 'sm' ? 'dd-sm' : ''} ${selected ? '' : 'dd-placeholder'}`}
        onMouseDown={hold}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span className="dd-label" style={selected?.style}>
          {label}
        </span>
        <svg className="dd-caret" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4.2l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          className="dd-menu"
          role="listbox"
          onMouseDown={hold}
          style={{
            left: pos.left,
            top: pos.top,
            bottom: pos.bottom,
            width: pos.width,
            maxHeight: pos.maxHeight,
          }}
        >
          {options.length === 0 && <div className="dd-empty">{emptyText}</div>}
          {options.map((opt, i) => {
            const isSel = String(opt.value) === String(value)
            const showGroup = opt.group && opt.group !== options[i - 1]?.group
            return (
              <Fragment key={`${opt.value}-${i}`}>
              {showGroup && <div className="dd-group">{opt.group}</div>}
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                className={`dd-item${isSel ? ' dd-selected' : ''}${i === activeIndex ? ' dd-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={hold}
                onClick={() => choose(opt)}
              >
                <span className="dd-item-label" style={opt.style}>
                  {opt.label}
                </span>
                {isSel && <span className="dd-check">&#10003;</span>}
              </button>
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}