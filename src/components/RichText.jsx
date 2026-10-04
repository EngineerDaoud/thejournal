import { resolveLink } from '../lib/links'
import { clampSize, fontCss } from '../lib/blockStyles'
import { ensureFont } from '../lib/fonts'

// Turns the small markup the admin editor writes into real formatting:
//   [word](link)            link (always opens in a NEW tab)
//   {c:#hex}text{/c}        text color
//   {h:#hex}text{/h}        highlight
//   {f:Font Name}text{/f}   font
//   {s:24}text{/s}          font size (px)
//   {u}text{/u}             underline
//   ~~text~~                strikethrough
//   **bold** / __bold__     bold
//   *italic* / _italic_     italic
// Any of these can be nested inside each other in any order.

const linkStyle = {
  color: '#1a56db',
  textDecoration: 'underline',
  textDecorationThickness: '1px',
  textUnderlineOffset: 3,
  fontWeight: 500,
  cursor: 'pointer',
}

const RULES = [
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    render: (m, key) => {
      const target = resolveLink(m[2])
      if (!target) return m[0]
      return (
        <a key={key} href={target.href} target="_blank" rel="noopener noreferrer" className="post-link" style={linkStyle}>
          {renderInline(m[1], key)}
        </a>
      )
    },
  },
  {
    re: /\{c:(#[0-9a-fA-F]{3,8})\}([\s\S]*?)\{\/c\}/,
    render: (m, key) => (
      <span key={key} style={{ color: m[1] }}>
        {renderInline(m[2], key)}
      </span>
    ),
  },
  {
    re: /\{h:(#[0-9a-fA-F]{3,8})\}([\s\S]*?)\{\/h\}/,
    render: (m, key) => (
      <span key={key} style={{ background: m[1], borderRadius: 2, padding: '0 2px' }}>
        {renderInline(m[2], key)}
      </span>
    ),
  },
  {
    re: /\{f:([\w\s-]{1,40})\}([\s\S]*?)\{\/f\}/,
    render: (m, key) => {
      const css = fontCss(m[1])
      if (css) ensureFont(m[1])
      const inner = renderInline(m[2], key)
      return css ? (
        <span key={key} style={{ fontFamily: css }}>
          {inner}
        </span>
      ) : (
        <span key={key}>{inner}</span>
      )
    },
  },
  {
    re: /\{s:(\d{1,3})\}([\s\S]*?)\{\/s\}/,
    render: (m, key) => (
      <span key={key} style={{ fontSize: clampSize(m[1]) }}>
        {renderInline(m[2], key)}
      </span>
    ),
  },
  {
    re: /\{u\}([\s\S]*?)\{\/u\}/,
    render: (m, key) => <u key={key}>{renderInline(m[1], key)}</u>,
  },
  {
    re: /~~([\s\S]+?)~~/,
    render: (m, key) => <s key={key}>{renderInline(m[1], key)}</s>,
  },
  {
    re: /\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/,
    render: (m, key) => <strong key={key}>{renderInline(m[1] ?? m[2], key)}</strong>,
  },
  {
    re: /\*([^*]+?)\*|_([^_]+?)_/,
    render: (m, key) => <em key={key}>{renderInline(m[1] ?? m[2], key)}</em>,
  },
]

// Finds whichever piece of markup starts first in the text, renders it (its
// inside is rendered the same way, so nesting works), then carries on with
// the rest.
function renderInline(text, keyBase = 'r') {
  const out = []
  let rest = text || ''
  let n = 0
  while (rest) {
    let best = null
    for (const rule of RULES) {
      const m = rule.re.exec(rest)
      if (!m || m[0].length === 0) continue
      if (!best || m.index < best.m.index || (m.index === best.m.index && m[0].length > best.m[0].length)) {
        best = { rule, m }
      }
    }
    if (!best) {
      out.push(rest)
      break
    }
    const { rule, m } = best
    if (m.index > 0) out.push(rest.slice(0, m.index))
    out.push(rule.render(m, `${keyBase}-${n++}`))
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

export default function RichText({ text }) {
  return <>{renderInline(text)}</>
}