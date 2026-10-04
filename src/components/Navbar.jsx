import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loadCategoryTree, getCachedCategoryTree, catLink, subLink } from '../lib/categories'
import { useAuth } from '../context/AuthContext'
import AdminLoginModal from './AdminLoginModal'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [tree, setTree] = useState(() => getCachedCategoryTree() || [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  // Already signed in: go straight to the admin panel. Otherwise, show the
  // sign-in popup instead of leaving the page.
  function handleAdminClick(e) {
    e.preventDefault()
    setMenuOpen(false)
    if (isAdmin) navigate('/admin')
    else setLoginOpen(true)
  }

  useEffect(() => {
    loadCategoryTree().then(setTree)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setDropOpen(false)
  }, [location.pathname, location.search])

  const isActive = (path) => location.pathname === path

  // Which category / subcategory the visitor is looking at, so the matching
  // row in the menu can be highlighted.
  const params = new URLSearchParams(location.search)
  const activeCat = location.pathname === '/blog' ? params.get('category') : null
  const activeSub = location.pathname === '/blog' ? params.get('sub') : null

  const linkStyle = (active) => ({
    padding: '4px 0',
    borderBottom: active ? '1px solid var(--color-ink)' : '1px solid transparent',
    whiteSpace: 'nowrap',
  })

  const desktopLinks = (
    <>
      <div
        onMouseEnter={() => setDropOpen(true)}
        onMouseLeave={() => setDropOpen(false)}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 76 }}
      >
        <div
          className="nav-blog-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 12px',
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          <Link to="/blog" style={{ ...linkStyle(isActive('/blog')), borderBottom: 'none', padding: 0, lineHeight: 1 }}>
            Blog
          </Link>
          {tree.length > 0 && (
            <button
              type="button"
              aria-label="Show categories"
              aria-expanded={dropOpen}
              onClick={() => setDropOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'inherit',
                display: 'inline-flex',
              }}
            >
              <svg
                className={`nav-caret${dropOpen ? ' is-open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path d="M2 4.2l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {dropOpen && tree.length > 0 && (
          <div className="nav-drop">
            <Link
              to="/blog"
              className={`nav-drop-link${activeCat === null && isActive('/blog') ? ' is-on' : ''}`}
              style={dropItem(true)}
            >
              All posts
            </Link>
            {tree.map((cat) => (
              <CatRow key={cat.name} cat={cat} activeCat={activeCat} activeSub={activeSub} />
            ))}
          </div>
        )}
      </div>
    </>
  )

  const mobileLinks = (
    <>
      <Link to="/blog" style={linkStyle(isActive('/blog'))}>Blog</Link>
      {tree.map((cat) => (
        <div key={cat.name} style={{ paddingLeft: 14 }}>
          <Link to={catLink(cat.name)} style={{ ...linkStyle(false), display: 'inline-block', fontSize: 14 }}>
            {cat.name}
          </Link>
          {cat.children.map((sub) => (
            <div key={sub} style={{ paddingLeft: 14 }}>
              <Link
                to={subLink(cat.name, sub)}
                style={{ ...linkStyle(false), display: 'inline-block', fontSize: 13, color: 'var(--color-ink-soft)' }}
              >
                {sub}
              </Link>
            </div>
          ))}
        </div>
      ))}
    </>
  )

  return (
    <>
    <header style={{ borderBottom: '1px solid var(--color-line)' }}>
      <div
        className="container container-wide"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 76,
          gap: 20,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          The Journal
        </Link>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="btn-outline btn nav-toggle"
          style={{ padding: '6px 12px', fontSize: 13 }}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 15 }}>
          {desktopLinks}
          <a
            href="/admin"
            onClick={handleAdminClick}
            aria-label="Admin panel"
            className="admin-lock"
            data-tip="Admin panel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1.5px solid var(--color-ink)',
              background: 'var(--color-ink)',
              color: '#fff',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </a>
        </nav>
      </div>

      {menuOpen && (
        <nav
          className="nav-mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '10px 24px 20px',
            borderTop: '1px solid var(--color-line)',
            fontSize: 15,
          }}
        >
          {mobileLinks}
          <a
            href="/admin"
            onClick={handleAdminClick}
            aria-label="Site admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1.5px solid var(--color-ink)',
              background: 'var(--color-ink)',
              color: '#fff',
              marginTop: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </a>
        </nav>
      )}

      <style>{`
        .nav-toggle { display: none; }
        .nav-mobile { display: none; }

        .nav-drop {
          position: absolute;
          top: 100%;
          right: -16px; /* open towards the left so it never goes past the screen edge */
          left: auto;
          max-width: calc(100vw - 24px);
          margin-top: 10px; /* small gap so it does not stick to the navbar */
          min-width: 220px;
          padding: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-pop);
          z-index: 50;
          animation: nav-drop-in 0.16s ease;
        }
        /* invisible bridge over the gap so the menu does not close while the pointer crosses it */
        .nav-drop::before { content: ''; position: absolute; top: -12px; left: 0; right: 0; height: 12px; }
        @keyframes nav-drop-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.985); }
          to { opacity: 1; transform: none; }
        }
        /* one main category per row; its sub-categories fly out to the side on hover */
        .nav-cat { position: relative; margin-top: 2px; }
        .nav-cat-link {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .nav-cat-arrow { flex-shrink: 0; opacity: 0.55; }
        .nav-cat:hover > .nav-cat-link:not(.is-on),
        .nav-cat:focus-within > .nav-cat-link:not(.is-on) { background: var(--color-ink); color: #fff !important; }
        .nav-sub {
          display: none;
          position: absolute;
          top: -9px;
          left: calc(100% + 12px);
          min-width: 200px;
          padding: 8px;
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-pop);
          z-index: 60;
        }
        .nav-sub.is-flip { left: auto; right: calc(100% + 12px); }
        /* invisible bridge so the pointer can cross the gap without closing the flyout */
        .nav-sub::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: -16px;
          width: 16px;
        }
        .nav-sub.is-flip::before { left: auto; right: -16px; }
        .nav-cat:hover > .nav-sub,
        .nav-cat:focus-within > .nav-sub { display: block; animation: nav-drop-in 0.14s ease; }
        .nav-drop-link {
          transition: background 0.14s ease, color 0.14s ease, transform 0.14s ease;
        }
        .nav-drop-link:hover {
          background: var(--color-ink);
          color: #fff !important;
          transform: translateX(3px);
        }
        .nav-drop-link.is-on {
          background: var(--color-ink);
          color: #fff !important;
          transform: none;
        }
        .nav-drop-link.is-on:hover { background: var(--color-ink); color: #fff !important; transform: none; }
        /* hover popup on the lock icon */
        .admin-lock { position: relative; }
        .admin-lock::after {
          content: attr(data-tip);
          position: absolute;
          top: calc(100% + 12px);
          right: -4px;
          background: var(--color-ink);
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          line-height: 1;
          white-space: nowrap;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
          opacity: 0;
          transform: translateY(-4px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 60;
        }
        .admin-lock::before {
          content: '';
          position: absolute;
          top: calc(100% + 6px);
          right: 12px;
          border: 6px solid transparent;
          border-top: 0;
          border-bottom-color: var(--color-ink);
          opacity: 0;
          transform: translateY(-4px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 60;
        }
        .admin-lock:hover::after,
        .admin-lock:hover::before,
        .admin-lock:focus-visible::after,
        .admin-lock:focus-visible::before { opacity: 1; transform: translateY(0); }
        @media (hover: none) {
          .admin-lock::after, .admin-lock::before { display: none; }
        }
        .nav-caret { transition: transform 0.2s ease; }
        .nav-caret.is-open { transform: rotate(180deg); }

        .nav-blog-btn {
          border: 1px solid var(--color-ink);
          border-radius: var(--radius);
          color: #fff;
          background: var(--color-ink);
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }
        .nav-blog-btn a { color: #fff !important; }
        .nav-blog-btn:hover {
          background: var(--color-ink);
          color: #fff;
          border-color: var(--color-ink);
          transform: scale(1.06);
        }

        @media (max-width: 860px) {
          .nav-links { display: none !important; }
          .nav-toggle { display: inline-flex !important; }
          .nav-mobile { display: flex !important; }
          .nav-mobile .nav-divider { display: none; }
        }
      `}</style>
    </header>

    <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

// One main category in the Blog dropdown. Its sub-categories appear in a small
// flyout next to it while the pointer is over the row (or a link inside has focus).
function CatRow({ cat, activeCat, activeSub }) {
  const ref = useRef(null)
  const [flip, setFlip] = useState(false)
  const hasKids = cat.children.length > 0

  function onEnter() {
    if (!hasKids || !ref.current) return
    // open to the left instead when there is no room on the right
    setFlip(ref.current.getBoundingClientRect().right + 240 > window.innerWidth)
  }

  return (
    <div ref={ref} className="nav-cat" onMouseEnter={onEnter}>
      <Link
        to={catLink(cat.name)}
        className={`nav-drop-link nav-cat-link${activeCat === cat.name && !activeSub ? ' is-on' : ''}`}
        style={dropItem(true)}
      >
        <span>{cat.name}</span>
        {hasKids && (
          <svg className="nav-cat-arrow" width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d={flip ? 'M8 2l-4 4 4 4' : 'M4 2l4 4-4 4'}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Link>
      {hasKids && (
        <div className={`nav-sub${flip ? ' is-flip' : ''}`}>
          {cat.children.map((sub) => (
            <Link
              key={sub}
              to={subLink(cat.name, sub)}
              className={`nav-drop-link${activeSub === sub && activeCat === cat.name ? ' is-on' : ''}`}
              style={dropItem(false)}
            >
              {sub}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function dropItem(bold) {
  return {
    display: 'block',
    padding: '8px 14px',
    borderRadius: 9,
    fontSize: bold ? 14 : 13,
    fontWeight: bold ? 600 : 400,
    color: bold ? 'var(--color-ink)' : 'var(--color-ink-soft)',
    whiteSpace: 'nowrap',
  }
}