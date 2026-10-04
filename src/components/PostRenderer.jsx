import RichText from './RichText'
import { resolveLink } from '../lib/links'
import { ChartView, CompareView, HtmlFrame, TableView } from './BlockViews'
import { fontCss, lineHeightValue, themeStyle } from '../lib/blockStyles'
import { ensureFont } from '../lib/fonts'

function isBulletLine(line) {
  return /^\s*[-*]\s+/.test(line)
}
function isNumberedLine(line) {
  return /^\s*\d+[.)]\s+/.test(line)
}
function stripListMarker(line) {
  return line.replace(/^\s*([-*]|\d+[.)])\s+/, '')
}

// Renders a text block's content, turning any lines written with the bullet
// button (or a pasted "- item" / "1. item" list) into a real <ul>/<ol>, and
// keeping the rest as normal paragraph text with line breaks preserved.
function TextBlockBody({ content }) {
  const lines = (content || '').split('\n')
  const groups = []
  for (const line of lines) {
    const kind = isBulletLine(line) ? 'ul' : isNumberedLine(line) ? 'ol' : 'p'
    const last = groups[groups.length - 1]
    if (last && last.kind === kind) {
      last.lines.push(line)
    } else {
      groups.push({ kind, lines: [line] })
    }
  }

  return (
    <>
      {groups.map((group, i) => {
        if (group.kind === 'ul' || group.kind === 'ol') {
          const Tag = group.kind
          return (
            <Tag key={i} style={{ margin: '0 0 22px', paddingLeft: 24 }}>
              {group.lines.map((line, j) => (
                <li key={j} style={{ marginBottom: 6 }}>
                  <RichText text={stripListMarker(line)} />
                </li>
              ))}
            </Tag>
          )
        }
        const text = group.lines.join('\n')
        if (!text.trim()) return null
        return (
          <p key={i} style={{ marginBottom: 22, whiteSpace: 'pre-wrap' }}>
            <RichText text={text} />
          </p>
        )
      })}
    </>
  )
}

function renderBlock(block) {

        if (block.type === 'text') {
          const themed = block.theme && block.theme !== 'none'
          const lh = lineHeightValue(block.lineHeight)
          return (
            <div
              key={block.id}
              className={themed ? `themed-block themed-${block.theme}` : undefined}
              style={{
                textAlign: block.align || 'justify',
                hyphens: 'auto',
                ...(lh ? { lineHeight: lh } : {}),
                ...(themed ? { ...themeStyle(block.theme), margin: '0 0 26px' } : {}),
              }}
            >
              <TextBlockBody content={block.content} />
            </div>
          )
        }

        if (block.type === 'heading') {
          return (
            <h2
              key={block.id}
              style={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: 'var(--color-ink)',
                margin: '48px 0 20px',
                textAlign: block.align || 'left',
                ...(block.font && fontCss(block.font) ? (ensureFont(block.font), { fontFamily: fontCss(block.font) }) : {}),
                ...(block.color ? { color: block.color } : {}),
              }}
            >
              {block.content}
            </h2>
          )
        }

        if (block.type === 'image') {
          const width =
            block.width === 'small' ? '50%' : block.width === 'medium' ? '80%' : '100%'
          return (
            <figure key={block.id} style={{ margin: '32px 0' }}>
              <img
                src={block.url}
                alt={block.caption || ''}
                style={{ width, margin: '0 auto', borderRadius: 4 }}
              />
              {block.caption && (
                <figcaption
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--color-ink-soft)',
                    marginTop: 8,
                  }}
                >
                  {block.caption}
                </figcaption>
              )}
            </figure>
          )
        }

        if (block.type === 'table') {
          return <TableView key={block.id} block={block} />
        }

        if (block.type === 'html') {
          return (block.html || '').trim() ? <HtmlFrame key={block.id} html={block.html} /> : null
        }

        if (block.type === 'chart') {
          return <ChartView key={block.id} block={block} />
        }

        if (block.type === 'compare') {
          return <CompareView key={block.id} block={block} />
        }

        if (block.type === 'faq') {
          return (
            <div key={block.id} style={{ margin: '40px 0' }}>
              {block.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 0',
                    borderTop: i === 0 ? '1px solid var(--color-line)' : 'none',
                    borderBottom: '1px solid var(--color-line)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{item.question}</div>
                  <div style={{ color: 'var(--color-ink-soft)', whiteSpace: 'pre-wrap', textAlign: 'justify', hyphens: 'auto' }}>
                    <RichText text={item.answer} />
                  </div>
                </div>
              ))}
            </div>
          )
        }

        if (block.type === 'download') {
          const dl = resolveLink(block.url)
          if (!dl) return null
          return (
            <div key={block.id} style={{ margin: '32px 0', textAlign: 'center' }}>
              <a href={dl.href} target="_blank" rel="noopener noreferrer" className="btn">
                {block.label || 'Download'}
                {block.filename ? ` (${block.filename})` : ''}
              </a>
            </div>
          )
        }

  return null
}

// Every heading starts a new section: the heading + everything under it (until the next
// heading) sits in one softly highlighted box, so the sections stand out from each other.
// Anything before the first heading (the intro) stays plain.
export default function PostRenderer({ blocks }) {
  const intro = []
  const sections = []
  for (const block of blocks) {
    if (block.type === 'heading') {
      sections.push([block])
    } else if (sections.length) {
      sections[sections.length - 1].push(block)
    } else {
      intro.push(block)
    }
  }

  return (
    <div>
      {intro.map((block) => renderBlock(block))}
      {sections.map((group) => (
        <section key={group[0].id} className="post-section">
          {group.map((block) => renderBlock(block))}
        </section>
      ))}
    </div>
  )
}