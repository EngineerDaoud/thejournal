import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCategoryTree, getCachedCategoryTree, catLink } from '../lib/categories'
import { SITE } from '../lib/siteConfig'

export default function Footer() {
  const [tree, setTree] = useState(() => getCachedCategoryTree() || [])

  useEffect(() => {
    loadCategoryTree().then(setTree)
  }, [])

  return (
    <footer className="site-footer">
      <div className="container container-wide">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">{SITE.name}</Link>
            <p>{SITE.description}</p>
            <div className="footer-icons">
              <a href="https://github.com/EngineerDaoud" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/muhammad-daoud-097a2b33b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                </svg>
              </a>
              <a href="mailto:muhammaddaoudqadir@gmail.com" aria-label="Email" title="muhammaddaoudqadir@gmail.com">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="m3.5 6 8.5 7 8.5-7" />
                </svg>
              </a>
              <a href="https://aiflowmindagency.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="AI Flow Mind Agency" title="AI Flow Mind Agency">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M2.5 12h19M12 2.5c2.4 2.6 3.7 5.9 3.7 9.5s-1.3 6.9-3.7 9.5c-2.4-2.6-3.7-5.9-3.7-9.5S9.6 5.1 12 2.5Z" />
                </svg>
              </a>
              <a href="https://daoudsite.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="Portfolio" title="Portfolio">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2.5" y="7.5" width="19" height="12.5" rx="2" />
                  <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
                </svg>
              </a>
            </div>
          </div>

          <nav className="footer-col" aria-label="Explore">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/blog">All articles</Link>
            {tree.slice(0, 8).map((cat) => (
              <Link key={cat.name} to={catLink(cat.name)}>{cat.name}</Link>
            ))}
          </nav>

          <nav className="footer-col" aria-label="About the site">
            <h4>The site</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/editorial-policy">Editorial Policy</Link>
            <Link to="/image-credits">Image &amp; Copyright</Link>
          </nav>

          <nav className="footer-col" aria-label="Legal">
            <h4>Legal</h4>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link to="/disclaimer">Disclaimer</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span>Original articles, written by real authors.</span>
        </div>
      </div>
    </footer>
  )
}