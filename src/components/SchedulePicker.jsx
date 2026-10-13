import { useEffect, useRef, useState } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

const pad = (n) => String(n).padStart(2, '0')

// "2026-10-14T09:30" (your local time) <-> Date
export function toLocalInput(value) {
  const d = new Date(value)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatWhen(local) {
  const d = new Date(local)
  return isNaN(d) ? '' : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function roundedSoon(minutesAhead) {
  const d = new Date(Date.now() + minutesAhead * 60 * 1000)
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0)
  return d
}

// A small calendar that opens from a button. Nothing here is full width:
// the button sits on the left, the calendar is a compact card under it.
export default function SchedulePicker({ value, onSchedule, onClear, saving }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(() => new Date(roundedSoon(60)))
  const [view, setView] = useState(() => new Date())
  const boxRef = useRef(null)

  const scheduled = value ? new Date(value) : null

  // Every time it opens: start from the saved schedule, or one hour from now.
  useEffect(() => {
    if (!open) return
    const start = scheduled && !isNaN(scheduled) ? scheduled : roundedSoon(60)
    setPicked(new Date(start))
    setView(new Date(start.getFullYear(), start.getMonth(), 1))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const today = startOfDay(new Date())
  const y = view.getFullYear()
  const m = view.getMonth()
  const firstOffset = (new Date(y, m, 1).getDay() + 6) % 7 // week starts on Monday
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1))]

  const hour24 = picked.getHours()
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const isPm = hour24 >= 12
  const minuteStr = pad(Math.round(picked.getMinutes() / 5) * 5 % 60)

  function setTime(h12, min, pm) {
    const d = new Date(picked)
    d.setHours((h12 % 12) + (pm ? 12 : 0), Number(min), 0, 0)
    setPicked(d)
  }

  function pickDay(day) {
    const d = new Date(picked)
    d.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
    setPicked(d)
  }

  function preset(d) {
    setPicked(d)
    setView(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  function tomorrowAt(h) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(h, 0, 0, 0)
    return d
  }

  function nextMonday9() {
    const d = new Date()
    d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7))
    d.setHours(9, 0, 0, 0)
    return d
  }

  const tooSoon = picked.getTime() <= Date.now() + 30 * 1000

  return (
    <div className="sched" ref={boxRef}>
      <button
        type="button"
        className={scheduled ? 'btn sched-trigger' : 'btn btn-outline sched-trigger'}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {scheduled ? `Scheduled · ${formatWhen(value)}` : 'Schedule'}
      </button>

      {open && (
        <div className="sched-pop" role="dialog" aria-label="Schedule this post">
          <div className="sched-presets">
            <button type="button" onClick={() => preset(roundedSoon(60))}>In 1 hour</button>
            <button type="button" onClick={() => preset(tomorrowAt(9))}>Tomorrow 9 AM</button>
            <button type="button" onClick={() => preset(nextMonday9())}>Next Monday</button>
          </div>

          <div className="sched-head">
            <button type="button" aria-label="Previous month" onClick={() => setView(new Date(y, m - 1, 1))}>‹</button>
            <strong>{MONTHS[m]} {y}</strong>
            <button type="button" aria-label="Next month" onClick={() => setView(new Date(y, m + 1, 1))}>›</button>
          </div>

          <div className="sched-grid">
            {DAYS.map((d) => (
              <span key={d} className="sched-dow">{d}</span>
            ))}
            {cells.map((day, i) =>
              day ? (
                <button
                  key={i}
                  type="button"
                  disabled={day < today}
                  className={
                    'sched-day' +
                    (sameDay(day, picked) ? ' is-picked' : '') +
                    (sameDay(day, today) ? ' is-today' : '')
                  }
                  onClick={() => pickDay(day)}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={i} />
              )
            )}
          </div>

          <div className="sched-time">
            <span className="sched-label">Time</span>
            <select value={hour12} onChange={(e) => setTime(Number(e.target.value), minuteStr, isPm)} aria-label="Hour">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span>:</span>
            <select value={minuteStr} onChange={(e) => setTime(hour12, e.target.value, isPm)} aria-label="Minute">
              {MINUTES.map((mm) => (
                <option key={mm} value={mm}>{mm}</option>
              ))}
            </select>
            <div className="sched-ampm">
              <button type="button" className={!isPm ? 'on' : ''} onClick={() => setTime(hour12, minuteStr, false)}>AM</button>
              <button type="button" className={isPm ? 'on' : ''} onClick={() => setTime(hour12, minuteStr, true)}>PM</button>
            </div>
          </div>

          <p className="sched-summary">
            {tooSoon
              ? 'That time has already passed. Pick a later one.'
              : `Goes live ${picked.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} (your device time)`}
          </p>

          <div className="sched-foot">
            {scheduled && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setOpen(false)
                  onClear()
                }}
              >
                Remove
              </button>
            )}
            <button
              type="button"
              className="btn"
              disabled={saving || tooSoon}
              onClick={() => {
                onSchedule(toLocalInput(picked))
                setOpen(false)
              }}
            >
              {saving ? 'Saving...' : 'Schedule post'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}