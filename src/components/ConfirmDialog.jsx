import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

function Dialog({ title, message, confirmText, cancelText, danger, onResult }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onResult(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onResult])

  return (
    <div className="cd-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onResult(false)}>
      <style>{`
        .cd-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(35, 36, 31, 0.45);
          backdrop-filter: blur(3px);
          animation: cd-fade 0.15s ease-out;
        }
        .cd-card {
          width: 100%; max-width: 420px;
          background: var(--color-bg);
          border: 1px solid var(--color-line);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 24px 60px rgba(35, 36, 31, 0.28);
          animation: cd-pop 0.18s ease-out;
        }
        .cd-title { font-size: 20px; margin: 0 0 10px; color: var(--color-ink); }
        .cd-msg { font-size: 14.5px; line-height: 1.55; margin: 0 0 24px; color: var(--color-ink-soft); }
        .cd-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .cd-danger {
          background: var(--color-danger); border-color: var(--color-danger); color: #fff;
        }
        .cd-danger:hover { background: var(--color-danger); border-color: var(--color-danger); }
        @keyframes cd-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cd-pop { from { opacity: 0; transform: translateY(8px) scale(0.96) } to { opacity: 1; transform: none } }
      `}</style>

      <div className="cd-card" role="alertdialog" aria-modal="true" aria-labelledby="cd-title">
        <h2 id="cd-title" className="cd-title">{title}</h2>
        <p className="cd-msg">{message}</p>
        <div className="cd-actions">
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={() => onResult(false)}>
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? 'btn cd-danger' : 'btn'}
            onClick={() => onResult(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Use:  if (!(await confirmDialog({ title, message, danger: true }))) return
export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      resolve(value)
      setTimeout(() => {
        root.unmount()
        host.remove()
      }, 0)
    }
    root.render(
      <Dialog
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        danger={danger}
        onResult={finish}
      />
    )
  })
}