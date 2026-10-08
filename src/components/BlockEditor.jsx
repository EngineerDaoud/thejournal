import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { resolveLink } from '../lib/links'
import { imagePath, downloadPath } from '../lib/upload'
import {
  BLOCK_THEMES,
  CHARTJS_EXAMPLE,
  CHART_PALETTES,
  CHART_TYPES,
  FONT_OPTIONS,
  FONT_SIZES,
  HEADER_SWATCHES,
  HIGHLIGHT_SWATCHES,
  LINE_SPACINGS,
  TABLE_PRESETS,
  chartToHtml,
  clampSize,
  fontCss,
  lineHeightValue,
  resolveTableDesign,
  tableToHtml,
  textOn,
  themeStyle,
} from '../lib/blockStyles'
import { ChartView, HtmlFrame, TableView } from './BlockViews'
import Dropdown from './Dropdown'
import {
  GOOGLE_FONTS,
  addGoogleFontByName,
  deleteCustomFont,
  getCustomFonts,
  loadAllForPreview,
  ensureFont,
  loadCustomForPreview,
  uploadFontFile,
} from '../lib/fonts'

// The TL;DR is not a real block in the saved content array. It is shown as a
// pinned paragraph editor at the top of the editor so it can be formatted by
// the same sidebar (bold, colours, fonts, sizes, links), and this is the id
// used to tell it apart from real blocks.
export const TLDR_ID = '__tldr'

let idCounter = 0
function newId() {
  idCounter += 1
  return `blk-${Date.now()}-${idCounter}`
}

export function newTextBlock(content = '', align = 'left') {
  return { id: newId(), type: 'text', content, align }
}

export function newHeadingBlock(content = '', align = 'left') {
  return { id: newId(), type: 'heading', content, align }
}

export function newImageBlock(url, caption = '', width = 'large') {
  return { id: newId(), type: 'image', url, caption, width }
}

export function newTableBlock() {
  return {
    id: newId(),
    type: 'table',
    headers: ['Column 1', 'Column 2'],
    rows: [['', '']],
  }
}

export function newChartBlock() {
  return {
    id: newId(),
    type: 'chart',
    title: '',
    chartType: 'bar',
    palette: 'forest',
    showValues: true,
    items: [
      { label: 'Jan', value: '10' },
      { label: 'Feb', value: '18' },
      { label: 'Mar', value: '14' },
    ],
  }
}

export function newHtmlBlock() {
  return { id: newId(), type: 'html', html: '' }
}

export function newDownloadBlock() {
  return { id: newId(), type: 'download', url: '', label: 'Download', filename: '' }
}

export function newCompareBlock() {
  return {
    id: newId(),
    type: 'compare',
    title: '',
    a: '',
    b: '',
    rows: [{ feature: '', a: '', b: '', winner: '' }],
    winner: 'auto',
    verdict: '',
  }
}

export function newFaqBlock() {
  return {
    id: newId(),
    type: 'faq',
    items: [{ question: '', answer: '' }],
  }
}

async function uploadImage(file) {
  const { path, error: badFile } = imagePath(file)
  if (badFile) throw new Error(badFile)
  const { error } = await supabase.storage.from('blog-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
  return data.publicUrl
}

async function uploadDownloadFile(file) {
  const { path, error: badFile } = downloadPath(file)
  if (badFile) throw new Error(badFile)
  const { error } = await supabase.storage.from('blog-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error
  // { download: name } makes the browser save the file instead of opening it.
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path, { download: file.name })
  return { url: data.publicUrl, filename: file.name }
}

const SITE_PAGES = [
  { label: 'Page: Article(all posts)', url: '/blog' },
  { label: 'Page: Contact Us', url: '/contact' },
  { label: 'Page: Privacy Policy', url: '/privacy-policy' },
  { label: 'Page: Terms & Conditions', url: '/terms-and-conditions' },
]

function normalizeOuter(raw) {
  let url = (raw || '').trim().replace(/\s/g, '%20').replace(/\)/g, '%29')
  if (!url) return ''
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) url = 'https://' + url
  return url
}

// Turns the small set of formatting the toolbar writes (bold, italic, links,
// text color, bullet lists) into real HTML so the editor shows live
// formatting instead of raw markup — no separate preview needed.
function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMarkupToHtml(text) {
  let s = escapeHtml(text)
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label, url) => {
      const safe = resolveLink(url.replace(/&amp;/g, '&'))
      if (!safe) return label // javascript:, data: etc. are never turned into a link
      return `<a href="${safe.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${label}</a>`
    }
  )
  s = s.replace(
    /\{c:(#[0-9a-fA-F]{3,8})\}([\s\S]*?)\{\/c\}/g,
    (_, hex, inner) => `<span style="color:${hex}">${inner}</span>`
  )
  s = s.replace(
    /\{h:(#[0-9a-fA-F]{3,8})\}([\s\S]*?)\{\/h\}/g,
    (_, hex, inner) => `<span style="background-color:${hex}">${inner}</span>`
  )
  s = s.replace(/\{f:([\w\s-]{1,40})\}([\s\S]*?)\{\/f\}/g, (_, name, inner) => {
    const css = fontCss(name)
    if (css) ensureFont(name)
    return css ? `<span style="font-family:${css}">${inner}</span>` : inner
  })
  s = s.replace(
    /\{s:(\d{1,3})\}([\s\S]*?)\{\/s\}/g,
    (_, n, inner) => `<span style="font-size:${clampSize(n)}px">${inner}</span>`
  )
  s = s.replace(/\{u\}([\s\S]*?)\{\/u\}/g, (_, inner) => `<u>${inner}</u>`)
  s = s.replace(/~~([\s\S]+?)~~/g, (_, inner) => `<s>${inner}</s>`)
  s = s.replace(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g, (_, a, b) => `<strong>${a ?? b}</strong>`)
  s = s.replace(/\*([^*]+?)\*|_([^_]+?)_/g, (_, a, b) => `<em>${a ?? b}</em>`)
  return s
}

const BULLET_RE = /^\s*[-*]\s+/
const NUMBER_RE = /^\s*\d+[.)]\s+/

function markupToHtml(content) {
  const lines = (content || '').split('\n')
  const groups = []
  for (const line of lines) {
    const kind = BULLET_RE.test(line) ? 'ul' : NUMBER_RE.test(line) ? 'ol' : 'p'
    const last = groups[groups.length - 1]
    if (last && last.kind === kind) last.lines.push(line)
    else groups.push({ kind, lines: [line] })
  }
  return groups
    .map((g) => {
      if (g.kind === 'ul' || g.kind === 'ol') {
        return `<${g.kind}>${g.lines
          .map((l) => `<li>${inlineMarkupToHtml(l.replace(/^\s*([-*]|\d+[.)])\s+/, ''))}</li>`)
          .join('')}</${g.kind}>`
      }
      return g.lines.map((l) => `<div>${inlineMarkupToHtml(l) || '<br>'}</div>`).join('')
    })
    .join('')
}

function rgbToHex(rgb) {
  const m = (rgb || '').match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return null
  const toHex = (n) => Number(n).toString(16).padStart(2, '0')
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`
}

// Colors written by the browser can be #hex or rgb(...). Transparent or
// empty ones mean "no color".
function styleColorToHex(raw) {
  const v = (raw || '').trim().toLowerCase()
  if (!v || v === 'transparent' || v === 'initial' || v === 'inherit') return null
  if (/^rgba\(.*,\s*0(\.0+)?\)$/.test(v)) return null
  if (v.startsWith('#')) return v.length === 4 || v.length === 7 ? v : null
  return rgbToHex(v)
}

function firstFontName(v) {
  return (v || '').split(',')[0].trim().replace(/^["']|["']$/g, '')
}

// Reverse of markupToHtml: walks the edited DOM back into our plain-text
// markup (**bold**, {c:#hex}...{/c}, "- item") so it saves the same way it
// always has and still renders correctly everywhere else on the site.
function serializeInline(node) {
  let out = ''
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const tag = child.tagName
    if (tag === 'BR') {
      out += '\n'
    } else if (tag === 'STRONG' || tag === 'B') {
      out += `**${serializeInline(child)}**`
    } else if (tag === 'EM' || tag === 'I') {
      out += `*${serializeInline(child)}*`
    } else if (tag === 'U') {
      out += `{u}${serializeInline(child)}{/u}`
    } else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
      out += `~~${serializeInline(child)}~~`
    } else if (tag === 'A') {
      out += `[${serializeInline(child)}](${child.getAttribute('href') || ''})`
    } else if (tag === 'FONT' || tag === 'SPAN') {
      let inner = serializeInline(child)
      if (inner.trim() !== '') {
        const st = child.style || {}
        if (st.fontWeight === 'bold' || Number(st.fontWeight) >= 600) inner = `**${inner}**`
        if (st.fontStyle === 'italic') inner = `*${inner}*`
        const deco = `${st.textDecorationLine || ''} ${st.textDecoration || ''}`
        if (deco.includes('underline')) inner = `{u}${inner}{/u}`
        if (deco.includes('line-through')) inner = `~~${inner}~~`
        const bg = styleColorToHex(st.backgroundColor)
        if (bg) inner = `{h:${bg}}${inner}{/h}`
        const px = /^(\d+(?:\.\d+)?)px$/.exec(st.fontSize || '')
        if (px && Math.round(Number(px[1])) >= 8 && Math.round(Number(px[1])) <= 80) {
          inner = `{s:${Math.round(Number(px[1]))}}${inner}{/s}`
        }
        const face = firstFontName(child.getAttribute('face') || st.fontFamily)
        if (face && face !== 'Inter' && /^[\w\s-]{1,40}$/.test(face)) inner = `{f:${face}}${inner}{/f}`
        const col = styleColorToHex(st.color || child.getAttribute('color') || '')
        if (col) inner = `{c:${col}}${inner}{/c}`
      }
      out += inner
    } else {
      out += serializeInline(child)
    }
  })
  return out
}

function htmlToMarkup(container) {
  const lines = []
  container.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      lines.push(child.textContent)
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const tag = child.tagName
    if (tag === 'UL') {
      Array.from(child.children).forEach((li) => lines.push(`- ${serializeInline(li)}`))
    } else if (tag === 'OL') {
      Array.from(child.children).forEach((li, i) => lines.push(`${i + 1}. ${serializeInline(li)}`))
    } else if (tag === 'BR') {
      lines.push('')
    } else {
      lines.push(serializeInline(child))
    }
  })
  return lines.join('\n')
}

// 30 ready colours (greys, reds, oranges, yellows, greens, blues, purples, pinks, browns).
// Anything else: use the colour picker or type a code (#3D5A45) below.
const COLOR_SWATCHES = [
  '#000000', '#23241F', '#4B5563', '#6B7280', '#9CA3AF', '#FFFFFF',
  '#7F1D1D', '#A23B2E', '#DC2626', '#EA580C', '#F59E0B', '#A97F3F',
  '#CA8A04', '#65A30D', '#16A34A', '#3D5A45', '#047857', '#0D9488',
  '#0891B2', '#0284C7', '#1a56db', '#1E3A8A', '#4F46E5', '#8e2de2',
  '#C026D3', '#DB2777', '#BE185D', '#831843', '#92400E', '#78350F',
]

const HIGHLIGHT_COLORS = [
  '#FFF3A3', '#FDE68A', '#FFD9A8', '#FFD6D6', '#FECACA', '#FBCFE8', '#E9D5FF',
  '#DDD6FE', '#CDE7FF', '#BAE6FD', '#C8F7C5', '#A7F3D0', '#D1D5DB',
]

// <input type="color"> only accepts #rrggbb.
function toSixDigitHex(value) {
  const v = (value || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return ('#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase()
  return '#000000'
}

// A real colour picker (any colour from the rainbow square). While you drag, only the
// preview changes; the colour is applied to the text when you close the picker
// (the "change" event), so the text selection is not disturbed while you choose.
function ColorPick({ value, onLive, onPick, title }) {
  const ref = useRef(null)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => pickRef.current(el.value)
    el.addEventListener('change', handler)
    return () => el.removeEventListener('change', handler)
  }, [])

  return (
    <input
      ref={ref}
      type="color"
      title={title}
      aria-label={title}
      value={toSixDigitHex(value)}
      onChange={(e) => onLive(e.target.value)}
      style={{
        width: 38,
        height: 32,
        padding: 2,
        border: '1px solid var(--color-line)',
        borderRadius: 6,
        background: 'transparent',
        cursor: 'pointer',
        flex: '0 0 auto',
      }}
    />
  )
}

const ALIGN_OPTIONS = [
  { v: 'left', label: '⟸' },
  { v: 'center', label: '⟺' },
  { v: 'right', label: '⟹' },
  { v: 'justify', label: '☰' },
]

const isAlignable = (b) => b.type === 'text' || b.type === 'heading'

const BLOCK_LABELS = {
  text: 'Paragraph',
  heading: 'Heading',
  image: 'Image',
  table: 'Table',
  chart: 'Chart',
  html: 'HTML',
  faq: 'FAQs',
  compare: 'Comparison',
  download: 'Download',
}

// Stops a toolbar button click from stealing focus away from the editor,
// which is what would otherwise clear the text selection before the button's
// own click handler gets to use it.
function preventFocusLoss(e) {
  e.preventDefault()
}

function selectAllIn(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

// Font name and pixel size of whatever the cursor / selection is sitting in.
function readLook() {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return { font: '', size: 0 }
    // Use the first piece of text inside the selection (after a font/size change
    // the browser can leave the selection pointing at the outer box).
    const range = sel.getRangeAt(0)
    let node = range.startContainer
    if (node.nodeType === Node.ELEMENT_NODE && !range.collapsed) {
      node = node.childNodes[range.startOffset] || node
      while (node && node.nodeType === Node.ELEMENT_NODE && node.firstChild) node = node.firstChild
    }
    if (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement
    if (!node) return { font: '', size: 0 }
    const cs = window.getComputedStyle(node)
    return {
      font: firstFontName(cs.fontFamily),
      size: Math.round(parseFloat(cs.fontSize)) || 0,
    }
  } catch {
    return { font: '', size: 0 }
  }
}

function readFormatState() {
  try {
    return {
      ...readLook(),
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
    }
  } catch {
    return { font: '', size: 0, bold: false, italic: false, underline: false, strike: false, ul: false, ol: false }
  }
}

const SAME_FMT = (a, b) => Object.keys(a).every((k) => a[k] === b[k])

// The browser can only set font sizes 1-7 through execCommand. We ask for
// size 7 (a marker) and then swap every marker for a real pixel size.
function convertFontSizes(el, px) {
  const nodes = Array.from(el.querySelectorAll('font[size="7"], span[style*="xxx-large"]'))
  if (nodes.length === 0) return
  const made = []
  nodes.forEach((node) => {
    const span = document.createElement('span')
    if (node.tagName === 'FONT') {
      if (node.getAttribute('color')) span.style.color = node.getAttribute('color')
      if (node.getAttribute('face')) span.style.fontFamily = node.getAttribute('face')
    } else {
      span.style.cssText = node.style.cssText.replace(/font-size:[^;]+;?/i, '')
    }
    span.style.fontSize = `${px}px`
    while (node.firstChild) span.appendChild(node.firstChild)
    node.replaceWith(span)
    // Anything inside that had its own size is now overridden by this one.
    span.querySelectorAll('[style*="font-size"]').forEach((inner) => {
      inner.style.fontSize = ''
      if (inner.tagName === 'SPAN' && !inner.getAttribute('style')) {
        while (inner.firstChild) inner.parentNode.insertBefore(inner.firstChild, inner)
        inner.remove()
      }
    })
    made.push(span)
  })
  // Keep the text selected so more formatting can be stacked on it.
  const range = document.createRange()
  range.setStartBefore(made[0])
  range.setEndAfter(made[made.length - 1])
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

// The editable area only (no toolbar). All formatting is applied by the
// shared <EditorSidebar /> on the left, which finds this editor through the
// `registry` map. Edits are saved as plain-text markup (**bold**,
// {c:#hex}...{/c}, "- item" ...), so the public site renders them with
// RichText / PostRenderer.
function RichEditor({
  value,
  onChange,
  placeholder,
  align,
  theme,
  lineHeight,
  editorKey,
  blockId,
  registry,
  onActivate,
}) {
  const ref = useRef(null)
  const savedRange = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [empty, setEmpty] = useState(!(value || '').trim())

  // Populate the editor once on mount. After that it manages its own DOM;
  // we only read out of it (via commit) rather than re-rendering into it on
  // every keystroke, which would otherwise reset the cursor position.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = markupToHtml(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Let the sidebar find and drive this editor.
  useEffect(() => {
    function commit() {
      const el = ref.current
      if (!el) return
      setEmpty(!el.textContent.trim())
      onChangeRef.current(htmlToMarkup(el))
    }

    function saveSelection() {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange()
      }
    }

    const api = {
      key: editorKey,
      blockId,
      get el() {
        return ref.current
      },
      commit,
      saveSelection,
      // Puts focus back in this editor (restoring the last selection),
      // without scrolling the page.
      focus() {
        const el = ref.current
        if (!el) return
        if (document.activeElement !== el) {
          el.focus({ preventScroll: true })
          if (savedRange.current) {
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(savedRange.current)
          }
        }
      },
      savedText() {
        return savedRange.current ? savedRange.current.toString() : ''
      },
      markLinksExternal() {
        ref.current?.querySelectorAll('a:not([target])').forEach((a) => {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        })
      },
    }
    registry.current.set(editorKey, api)
    return () => {
      if (registry.current.get(editorKey) === api) registry.current.delete(editorKey)
    }
  }, [editorKey, blockId, registry])

  function commit() {
    registry.current.get(editorKey)?.commit()
  }

  function saveSelection() {
    registry.current.get(editorKey)?.saveSelection()
  }

  const line = '1px solid var(--color-line)'
  const style = {
    minHeight: 110,
    padding: '10px 12px',
    borderTop: line,
    borderRight: line,
    borderBottom: line,
    borderLeft: line,
    borderRadius: 4,
    background: 'var(--color-surface)',
    fontSize: 15,
    lineHeight: lineHeightValue(lineHeight) || 1.6,
    textAlign: align || 'left',
    ...themeStyle(theme),
  }

  return (
    <div style={{ position: 'relative' }}>
      {empty && (
        <div
          style={{
            position: 'absolute',
            top: 11,
            left: 13,
            color: 'var(--color-ink-soft)',
            fontSize: 15,
            pointerEvents: 'none',
          }}
        >
          {placeholder}
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => onActivate(editorKey, blockId)}
        onInput={commit}
        onBlur={() => {
          saveSelection()
          commit()
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        style={style}
      />
    </div>
  )
}

const sbLabelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--color-ink-soft)',
  margin: '0 0 6px',
}
const sbRowStyle = { display: 'flex', gap: 8, marginBottom: 10 }
const sbBtnStyle = { padding: '6px 0', fontSize: 13, flex: 1, justifyContent: 'center', minWidth: 0 }
const sbCheckStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 13,
  lineHeight: 1.35,
  color: 'var(--color-ink)',
  cursor: 'pointer',
  margin: '0 0 6px',
}
const sbHintStyle = { fontSize: 12, color: 'var(--color-ink-soft)', lineHeight: 1.4, margin: '2px 0 6px' }

function SbSection({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} style={{ borderTop: '1px solid var(--color-line)', padding: '10px 0 4px' }}>
      <summary
        style={{ ...sbLabelStyle, display: 'list-item', listStylePosition: 'inside', cursor: 'pointer', marginBottom: 8 }}
      >
        {title}
      </summary>
      {children}
    </details>
  )
}

function Swatch({ color, title, onClick, size = 24, dashed = false }) {
  return (
    <button
      type="button"
      title={title || color}
      onMouseDown={preventFocusLoss}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color || 'transparent',
        border: dashed ? '1px dashed var(--color-ink-soft)' : '1px solid var(--color-line)',
        cursor: 'pointer',
        padding: 0,
        fontSize: 11,
        lineHeight: 1,
        color: 'var(--color-ink-soft)',
      }}
    >
      {dashed ? '×' : ''}
    </button>
  )
}

// Switch between the visual builder and pasting your own HTML code.
function ModeSwitch({ htmlMode, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      <button
        type="button"
        className={!htmlMode ? 'btn' : 'btn btn-outline'}
        style={{ padding: '5px 14px', fontSize: 12 }}
        onClick={() => onChange(false)}
      >
        Visual builder
      </button>
      <button
        type="button"
        className={htmlMode ? 'btn' : 'btn btn-outline'}
        style={{ padding: '5px 14px', fontSize: 12 }}
        onClick={() => onChange(true)}
      >
        HTML code
      </button>
    </div>
  )
}

// Paste or write HTML (tables, SVG, CSS, even <script> like Chart.js) and see
// it built live underneath. It runs inside an isolated, sandboxed frame.
function HtmlCodeEditor({ value, onChange, seeds = [], hint }) {
  const [preview, setPreview] = useState(value || '')

  useEffect(() => {
    const t = setTimeout(() => setPreview(value || ''), 500)
    return () => clearTimeout(t)
  }, [value])

  function seed(html) {
    if ((value || '').trim() && !window.confirm('Replace the code you have written?')) return
    onChange(html)
  }

  return (
    <div>
      {seeds.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {seeds.map((sd) => (
            <button
              key={sd.label}
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => seed(sd.html())}
            >
              {sd.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        rows={10}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={'<table>\n  <tr><th>Name</th><th>Price</th></tr>\n  <tr><td>Tea</td><td>$3</td></tr>\n</table>'}
        style={{
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre',
          overflowX: 'auto',
        }}
      />
      <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: '6px 0 14px', lineHeight: 1.45 }}>
        {hint ||
          'Write or paste HTML. <style>, <svg> and <script> all work. It runs in a safe, isolated frame, so it cannot affect the rest of your site.'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginBottom: 6 }}>Preview</div>
      {preview.trim() ? (
        <div style={{ border: '1px dashed var(--color-line)', borderRadius: 4, padding: 10 }}>
          <HtmlFrame html={preview} compact />
        </div>
      ) : (
        <div
          style={{
            border: '1px dashed var(--color-line)',
            borderRadius: 4,
            padding: 20,
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-ink-soft)',
          }}
        >
          The result appears here as you type.
        </div>
      )}
    </div>
  )
}

// Word-style formatting panel. It lives in the left margin, stays in view
// while scrolling, and works on whichever block was clicked last — or on the
// whole post when "All content" is ticked.
function EditorSidebar({ registry, active, setActive, blocks, onChange, targets, onInsert, onInsertImage }) {
  const [scope, setScope] = useState('selected') // 'selected' | 'all'
  const [msg, setMsg] = useState('')
  const [fmt, setFmt] = useState({ font: '', size: 0, bold: false, italic: false, underline: false, strike: false, ul: false, ol: false })
  const [customHex, setCustomHex] = useState('#3D5A45')
  const [customFonts, setCustomFonts] = useState([])
  const [customSize, setCustomSize] = useState('')
  const [fontName, setFontName] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [fontBusy, setFontBusy] = useState(false)
  const [fontMsg, setFontMsg] = useState('')
  const fontFileRef = useRef(null)

  // Load the font list once, so every font shows in its own style in the menu.
  useEffect(() => {
    getCustomFonts().then((list) => {
      loadCustomForPreview(list)
      setCustomFonts(list)
    })
  }, [])

  async function onFontFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFontBusy(true)
    setFontMsg('')
    const r = await uploadFontFile(file, fontName)
    setFontBusy(false)
    if (r.error) return setFontMsg(r.error)
    loadCustomForPreview([r.font])
    setCustomFonts((l) => [...l, r.font].sort((a, b) => a.name.localeCompare(b.name)))
    setFontName('')
    setFontMsg(`"${r.font.name}" added. Pick it from the Font menu.`)
  }

  async function onAddGoogle() {
    setFontBusy(true)
    setFontMsg('')
    const r = await addGoogleFontByName(googleName)
    setFontBusy(false)
    if (r.error) return setFontMsg(r.error)
    loadCustomForPreview([r.font])
    setCustomFonts((l) => [...l, r.font].sort((a, b) => a.name.localeCompare(b.name)))
    setGoogleName('')
    setFontMsg(`"${r.font.name}" added. Pick it from the Font menu.`)
  }

  async function onDeleteFont(f) {
    if (!window.confirm(`Remove the font "${f.name}"? Posts that use it will fall back to a default font.`)) return
    const r = await deleteCustomFont(f)
    if (r.error) return setFontMsg(r.error)
    setCustomFonts((l) => l.filter((x) => x.id !== f.id))
  }
  const [hiliteHex, setHiliteHex] = useState('#FFF3A3')
  const [linkOpen, setLinkOpen] = useState(false)
  const [kind, setKind] = useState('inner')
  const [inner, setInner] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [outer, setOuter] = useState('')
  const imageInputRef = useRef(null)

  const activeBlock = blocks.find((b) => b.id === active?.blockId) || null
  const activeLabel = activeBlock
    ? activeBlock.label
      ? activeBlock.label
      : activeBlock.type === 'faq' && active?.key
        ? 'FAQ answer'
        : BLOCK_LABELS[activeBlock.type] || null
    : null
  const selectedMode = scope === 'selected'

  // Keep Bold / Italic / ... highlighted to match where the cursor is.
  useEffect(() => {
    function onSelectionChange() {
      const entry = active?.key ? registry.current.get(active.key) : null
      const sel = window.getSelection()
      if (!entry?.el || !sel || sel.rangeCount === 0 || !entry.el.contains(sel.anchorNode)) return
      setFmt((prev) => {
        const next = readFormatState()
        return SAME_FMT(prev, next) ? prev : next
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [active, registry])

  function activeEntry() {
    return active?.key ? registry.current.get(active.key) : null
  }

  // Changes any block(s) that match. `patch` is an object or (block) => object.
  function patchWhere(pred, patch) {
    onChange((prev) =>
      prev.map((b) => (pred(b) ? { ...b, ...(typeof patch === 'function' ? patch(b) : patch) } : b))
    )
  }

  // Changes the clicked block (if it's of `type`), or every block of that
  // type in "All content" mode.
  function patchTarget(type, patch, label) {
    setMsg('')
    if (!selectedMode) {
      if (!blocks.some((b) => b.type === type)) {
        setMsg(`There is no ${label} in this post yet.`)
        return
      }
      patchWhere((b) => b.type === type, patch)
      return
    }
    if (!activeBlock || activeBlock.type !== type) {
      setMsg(`Click inside a ${label} first.`)
      return
    }
    patchWhere((b) => b.id === activeBlock.id, patch)
  }

  // Runs a browser editing command on the selected text (or on the whole
  // paragraph if nothing is selected), or on every paragraph in "All content"
  // mode. `toggle` is for on/off commands (bold, italic, list...).
  function applyCommand(cmd, arg, opts = {}) {
    const { toggle = false, after = null, silent = false } = opts
    if (!silent) setMsg('')
    try {
      document.execCommand('styleWithCSS', false, false)
    } catch {
      /* ignore */
    }
    const run = (entry) => {
      document.execCommand(cmd, false, arg)
      if (after) after(entry.el)
    }

    if (selectedMode) {
      const entry = activeEntry()
      if (!entry?.el) {
        if (!silent) setMsg('Click inside a paragraph first.')
        return false
      }
      entry.focus()
      const sel = window.getSelection()
      const hasSelection = sel.rangeCount > 0 && !sel.isCollapsed && entry.el.contains(sel.anchorNode)
      if (!hasSelection) {
        if (!entry.el.textContent.trim()) {
          if (!silent) setMsg('Type some text first.')
          return false
        }
        selectAllIn(entry.el)
      }
      run(entry)
      entry.commit()
      setFmt(readFormatState())
      // read again once the browser has finished rewriting the text, so the
      // Font / Size boxes show the new value straight away
      requestAnimationFrame(() => setFmt(readFormatState()))
      return true
    }

    const entries = Array.from(registry.current.values()).filter((e) => e.el && e.el.textContent.trim())
    if (entries.length === 0) {
      if (!silent) setMsg('There is no paragraph text to format yet.')
      return false
    }
    const previousActive = active
    if (toggle) {
      const states = entries.map((e) => {
        e.focus()
        selectAllIn(e.el)
        return document.queryCommandState(cmd)
      })
      const desired = !states.every(Boolean)
      entries.forEach((e, i) => {
        if (states[i] !== desired) {
          e.focus()
          selectAllIn(e.el)
          run(e)
        }
        e.commit()
      })
    } else {
      entries.forEach((e) => {
        e.focus()
        selectAllIn(e.el)
        run(e)
        e.commit()
      })
    }
    window.getSelection()?.removeAllRanges()
    document.activeElement?.blur?.()
    setActive(previousActive)
    return true
  }

  function applyFont(name) {
    if (!name) return
    ensureFont(name)
    setMsg('')
    if (selectedMode) {
      if (activeBlock?.type === 'heading') {
        patchWhere((b) => b.id === activeBlock.id, { font: name })
        return
      }
      applyCommand('fontName', name)
      return
    }
    patchWhere((b) => b.type === 'heading', { font: name })
    applyCommand('fontName', name, { silent: true })
  }

  function applySize(px) {
    const n = Number(px)
    if (!n) return
    if (selectedMode && activeBlock?.type === 'heading') {
      setMsg('Size works on paragraph text.')
      return
    }
    applyCommand('fontSize', '7', { after: (el) => convertFontSizes(el, n), silent: !selectedMode })
  }

  function applyColor(hex) {
    let clean = (hex || '').trim()
    if (/^[0-9a-fA-F]{3,8}$/.test(clean)) clean = '#' + clean // "3D5A45" works too
    if (!/^#[0-9a-fA-F]{3,8}$/.test(clean)) {
      setMsg('Enter a color as #rrggbb.')
      return
    }
    setMsg('')
    if (selectedMode && activeBlock?.type === 'heading') {
      patchWhere((b) => b.id === activeBlock.id, { color: clean })
      return
    }
    if (!selectedMode) {
      patchWhere((b) => b.type === 'heading', { color: clean })
      applyCommand('foreColor', clean, { silent: true })
      return
    }
    applyCommand('foreColor', clean)
  }

  function clearFormatting() {
    if (selectedMode && activeBlock?.type === 'heading') {
      patchWhere((b) => b.id === activeBlock.id, { font: '', color: '' })
      return
    }
    if (!selectedMode) patchWhere((b) => b.type === 'heading', { font: '', color: '' })
    applyCommand('removeFormat', undefined, { silent: !selectedMode })
  }

  function applyAlign(v) {
    setMsg('')
    if (!selectedMode) {
      patchWhere(isAlignable, { align: v })
      return
    }
    if (!activeBlock || !isAlignable(activeBlock)) {
      setMsg(activeBlock ? 'Alignment works on paragraphs and headings.' : 'Click inside a paragraph or heading first.')
      return
    }
    patchWhere((b) => b.id === activeBlock.id, { align: v })
  }

  function openLinkPanel() {
    if (!selectedMode) {
      setMsg('A link needs selected text. Tick "Selected text / paragraph" first.')
      setLinkOpen(false)
      return
    }
    const entry = activeEntry()
    if (!entry) {
      setMsg('Click inside a paragraph, select a word, then click Link.')
      setLinkOpen(false)
      return
    }
    entry.saveSelection()
    if (entry.savedText().trim() === '') {
      setMsg('Select a word first, then click Link.')
      setLinkOpen(false)
      return
    }
    setMsg('')
    setLinkOpen(true)
  }

  function applyLink() {
    let url = ''
    if (kind === 'inner') {
      url = inner === '__custom' ? customPath.trim() : inner
      if (url) {
        const r = resolveLink(url)
        url = r ? r.href : ''
      }
    } else {
      const r = resolveLink(normalizeOuter(outer))
      url = r ? r.href : ''
    }
    if (!url) {
      setMsg(kind === 'inner' ? 'Pick a page or post.' : 'Type the website address.')
      return
    }
    const entry = activeEntry()
    if (!entry || entry.savedText().trim() === '') {
      setMsg('Selection lost — select the word again and click Link.')
      return
    }
    entry.focus()
    document.execCommand('createLink', false, url)
    entry.markLinksExternal()
    entry.commit()
    setLinkOpen(false)
    setInner('')
    setCustomPath('')
    setOuter('')
    setMsg('')
  }

  // Which alignment button to highlight.
  let currentAlign = null
  if (selectedMode) {
    currentAlign = activeBlock && isAlignable(activeBlock) ? activeBlock.align || 'left' : null
  } else {
    const set = new Set(blocks.filter(isAlignable).map((b) => b.align || 'left'))
    currentAlign = set.size === 1 ? [...set][0] : null
  }

  const curText = selectedMode && activeBlock?.type === 'text' ? activeBlock : null
  const curTable = selectedMode && activeBlock?.type === 'table' ? resolveTableDesign(activeBlock.design) : null
  const curChart = selectedMode && activeBlock?.type === 'chart' ? activeBlock : null
  const showTable = selectedMode
    ? activeBlock?.type === 'table' && !activeBlock.htmlMode
    : blocks.some((b) => b.type === 'table')
  const showChart = selectedMode
    ? activeBlock?.type === 'chart' && !activeBlock.htmlMode
    : blocks.some((b) => b.type === 'chart')

  function tableChange(changes) {
    patchTarget(
      'table',
      (b) => ({ design: { ...resolveTableDesign(b.design), ...changes, presetId: '' } }),
      'table'
    )
  }

  function fmtBtn(on) {
    return selectedMode && on ? 'btn' : 'btn btn-outline'
  }

  // What the Font / Size boxes show: the look of the current selection.
  const headingActive = selectedMode && activeBlock?.type === 'heading'
  const shownFont = !selectedMode ? '' : headingActive ? activeBlock.font || '' : fmt.font
  const shownSize = selectedMode && !headingActive && fmt.size ? fmt.size : ''
  const sizeList = shownSize && !FONT_SIZES.includes(shownSize) ? [...FONT_SIZES, shownSize].sort((a, b) => a - b) : FONT_SIZES
  const sizeOptions = sizeList.map((n) => ({ value: n, label: String(n) }))

  return (
    <div className="editor-sidebar">
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Formatting</div>

      <div style={{ marginBottom: 12 }}>
        <span style={sbLabelStyle}>Apply to</span>
        <label style={sbCheckStyle}>
          <input
            type="checkbox"
            checked={selectedMode}
            onChange={() => setScope('selected')}
            style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
          />
          <span>Selected text / paragraph</span>
        </label>
        <label style={sbCheckStyle}>
          <input
            type="checkbox"
            checked={!selectedMode}
            onChange={() => {
              setScope('all')
              setLinkOpen(false)
            }}
            style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
          />
          <span>All content</span>
        </label>
        <div style={sbHintStyle}>
          {!selectedMode
            ? 'Changes every paragraph, heading, table and chart in this post.'
            : activeLabel
              ? `Editing: ${activeLabel}. Select text, or select nothing to change the whole block.`
              : 'Click inside any block to start.'}
        </div>
      </div>

      <SbSection title="Font">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <Dropdown
            size="sm"
            preserveFocus
            resetAfterSelect
            value={shownFont}
            placeholder="Font"
            title="Font"
            onOpen={() => loadAllForPreview(GOOGLE_FONTS)}
            style={{ flex: 2 }}
            options={[
              ...customFonts.map((f) => ({
                value: f.name,
                label: f.name,
                group: 'My fonts',
                style: { fontFamily: `'${f.name}', sans-serif` },
              })),
              ...FONT_OPTIONS.map((f) => ({
                value: f.name,
                label: f.name,
                group: f.cat,
                style: { fontFamily: f.css },
              })),
            ]}
            onChange={applyFont}
          />
          <Dropdown
            size="sm"
            preserveFocus
            resetAfterSelect
            value={shownSize}
            placeholder="Size"
            title="Font size"
            style={{ flex: 1 }}
            options={sizeOptions}
            onChange={applySize}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <input
            type="number"
            min="8"
            max="80"
            placeholder="Custom size (8-80)"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (customSize) applySize(clampSize(customSize))
              }
            }}
            style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '5px 8px' }}
          />
          <button
            type="button"
            className="btn"
            style={{ padding: '5px 12px', fontSize: 12 }}
            onMouseDown={preventFocusLoss}
            onClick={() => customSize && applySize(clampSize(customSize))}
          >
            Set size
          </button>
        </div>
        <div style={sbRowStyle}>
          <button
            type="button"
            className={fmtBtn(fmt.bold)}
            style={{ ...sbBtnStyle, fontWeight: 700 }}
            title="Bold"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('bold', undefined, { toggle: true })}
          >
            B
          </button>
          <button
            type="button"
            className={fmtBtn(fmt.italic)}
            style={{ ...sbBtnStyle, fontStyle: 'italic' }}
            title="Italic"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('italic', undefined, { toggle: true })}
          >
            i
          </button>
          <button
            type="button"
            className={fmtBtn(fmt.underline)}
            style={{ ...sbBtnStyle, textDecoration: 'underline' }}
            title="Underline"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('underline', undefined, { toggle: true })}
          >
            U
          </button>
          <button
            type="button"
            className={fmtBtn(fmt.strike)}
            style={{ ...sbBtnStyle, textDecoration: 'line-through' }}
            title="Strikethrough"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('strikeThrough', undefined, { toggle: true })}
          >
            S
          </button>
        </div>
        <div style={sbRowStyle}>
          <button
            type="button"
            className={fmtBtn(fmt.ul)}
            style={sbBtnStyle}
            title="Bullet list"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('insertUnorderedList', undefined, { toggle: true })}
          >
            • List
          </button>
          <button
            type="button"
            className={fmtBtn(fmt.ol)}
            style={sbBtnStyle}
            title="Numbered list"
            onMouseDown={preventFocusLoss}
            onClick={() => applyCommand('insertOrderedList', undefined, { toggle: true })}
          >
            1. List
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={sbBtnStyle}
            title="Remove formatting (bold, color, font, size...)"
            onMouseDown={preventFocusLoss}
            onClick={clearFormatting}
          >
            Clear
          </button>
        </div>
      </SbSection>

      <SbSection title="Add more fonts" defaultOpen={false}>
        <div style={sbHintStyle}>Upload your own font file (.woff2, .woff, .ttf, .otf) or add any font from Google Fonts by name.</div>
        <span style={sbLabelStyle}>Upload font file</span>
        <input
          type="text"
          placeholder="Font name (optional)"
          value={fontName}
          onChange={(e) => setFontName(e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '5px 8px', marginBottom: 6, boxSizing: 'border-box' }}
        />
        <input ref={fontFileRef} type="file" accept=".woff2,.woff,.ttf,.otf" onChange={onFontFile} style={{ display: 'none' }} />
        <button
          type="button"
          className="btn btn-outline"
          disabled={fontBusy}
          style={{ ...sbBtnStyle, width: '100%', marginBottom: 12 }}
          onClick={() => fontFileRef.current?.click()}
        >
          {fontBusy ? 'Working...' : 'Choose font file'}
        </button>
        <span style={sbLabelStyle}>Google Font by name</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            placeholder="e.g. Dancing Script"
            value={googleName}
            onChange={(e) => setGoogleName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (googleName.trim()) onAddGoogle()
              }
            }}
            style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '5px 8px' }}
          />
          <button type="button" className="btn" disabled={fontBusy || !googleName.trim()} style={{ padding: '5px 12px', fontSize: 12 }} onClick={onAddGoogle}>
            Add
          </button>
        </div>
        {fontMsg && <p style={{ ...sbHintStyle, color: 'var(--color-ink)' }}>{fontMsg}</p>}
        {customFonts.length > 0 && (
          <>
            <span style={sbLabelStyle}>My fonts</span>
            {customFonts.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: `'${f.name}', sans-serif`, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <button type="button" className="btn-danger btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => onDeleteFont(f)}>
                  Remove
                </button>
              </div>
            ))}
          </>
        )}
      </SbSection>

      <SbSection title="Text color">
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
          {COLOR_SWATCHES.map((hex) => (
            <Swatch key={hex} color={hex} size={22} onClick={() => applyColor(hex)} />
          ))}
        </div>
        <span style={sbLabelStyle}>Any colour</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <ColorPick
            title="Pick any colour"
            value={customHex}
            onLive={setCustomHex}
            onPick={(hex) => {
              setCustomHex(hex)
              applyColor(hex)
            }}
          />
          <input
            type="text"
            value={customHex}
            placeholder="#3D5A45"
            maxLength={9}
            onChange={(e) => setCustomHex(e.target.value)}
            style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '5px 8px' }}
          />
          <button
            type="button"
            className="btn"
            style={{ padding: '5px 10px', fontSize: 12 }}
            onMouseDown={preventFocusLoss}
            onClick={() => applyColor(customHex)}
          >
            Apply
          </button>
        </div>
        <span style={sbLabelStyle}>Highlight</span>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
          {HIGHLIGHT_COLORS.map((hex) => (
            <Swatch
              key={hex}
              color={hex}
              size={22}
              title={`Highlight ${hex}`}
              onClick={() => applyCommand('hiliteColor', hex, { silent: false })}
            />
          ))}
          <Swatch
            dashed
            size={22}
            title="Remove highlight"
            onClick={() => applyCommand('hiliteColor', 'transparent')}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <ColorPick
            title="Pick any highlight colour"
            value={hiliteHex}
            onLive={setHiliteHex}
            onPick={(hex) => {
              setHiliteHex(hex)
              applyCommand('hiliteColor', hex, { silent: false })
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Any highlight colour</span>
        </div>
      </SbSection>

      <SbSection title="Align">
        <div style={sbRowStyle}>
          {ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              title={`Align ${opt.v}`}
              onMouseDown={preventFocusLoss}
              onClick={() => applyAlign(opt.v)}
              className={currentAlign === opt.v ? 'btn' : 'btn btn-outline'}
              style={sbBtnStyle}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SbSection>

      <SbSection title="Paragraph style">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <Dropdown
            size="sm"
            preserveFocus
            value={curText ? curText.theme || 'none' : ''}
            placeholder="Box style"
            title="Box style for the paragraph"
            style={{ flex: 3 }}
            options={BLOCK_THEMES.map((t) => ({ value: t.id, label: t.label }))}
            onChange={(v) => v && patchTarget('text', { theme: v }, 'paragraph')}
          />
          <Dropdown
            size="sm"
            preserveFocus
            value={curText ? curText.lineHeight || 'normal' : ''}
            placeholder="Spacing"
            title="Line spacing"
            style={{ flex: 2 }}
            options={LINE_SPACINGS.map((l) => ({ value: l.id, label: l.label }))}
            onChange={(v) => v && patchTarget('text', { lineHeight: v }, 'paragraph')}
          />
        </div>
      </SbSection>

      <SbSection title="Link" defaultOpen={false}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ ...sbBtnStyle, width: '100%', flex: 'none' }}
          title="Add link to the selected text"
          onMouseDown={preventFocusLoss}
          onClick={openLinkPanel}
        >
          Link selected text
        </button>
        {linkOpen && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: '1px solid var(--color-line)',
              borderRadius: 4,
              background: 'var(--color-bg)',
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                className={kind === 'inner' ? 'btn' : 'btn btn-outline'}
                style={{ ...sbBtnStyle, fontSize: 12 }}
                onClick={() => setKind('inner')}
              >
                Inner link
              </button>
              <button
                type="button"
                className={kind === 'outer' ? 'btn' : 'btn btn-outline'}
                style={{ ...sbBtnStyle, fontSize: 12 }}
                onClick={() => setKind('outer')}
              >
                Outer link
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginBottom: 8 }}>
              {kind === 'inner' ? 'A page or post on this site' : 'Another website'}
            </div>
            {kind === 'inner' ? (
              <div>
                <Dropdown
                  size="sm"
                  value={inner}
                  placeholder="Choose a page or post..."
                  options={[
                    ...[...SITE_PAGES, ...targets].map((t) => ({ value: t.url, label: t.label })),
                    { value: '__custom', label: 'Other path...' },
                  ]}
                  onChange={setInner}
                />
                {inner === '__custom' && (
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="/blog?category=Travel"
                    style={{ marginTop: 8, fontSize: 13, padding: '7px 10px' }}
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                value={outer}
                onChange={(e) => setOuter(e.target.value)}
                placeholder="https://example.com"
                style={{ fontSize: 13, padding: '7px 10px' }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn" style={{ padding: '5px 12px', fontSize: 12 }} onClick={applyLink}>
                Apply link
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => setLinkOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SbSection>

      {showTable && (
        <SbSection title="Table design">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {TABLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={
                  curTable && (activeBlock?.design ? activeBlock.design.presetId : 'classic') === p.id
                    ? 'btn'
                    : 'btn btn-outline'
                }
                style={{ ...sbBtnStyle, flex: 'none' }}
                onMouseDown={preventFocusLoss}
                onClick={() => patchTarget('table', () => ({ design: { ...p.design, presetId: p.id } }), 'table')}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span style={sbLabelStyle}>Header color</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {HEADER_SWATCHES.map((hex) => (
              <Swatch
                key={hex || 'none'}
                color={hex}
                dashed={!hex}
                title={hex ? `Header ${hex}` : 'No header color'}
                onClick={() => tableChange({ headerBg: hex, headerColor: hex ? textOn(hex) : '' })}
              />
            ))}
          </div>
          <label style={sbCheckStyle}>
            <input
              type="checkbox"
              checked={Boolean(curTable?.stripe)}
              onChange={(e) => tableChange({ stripe: e.target.checked })}
              style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
            />
            <span>Striped rows</span>
          </label>
          <span style={sbLabelStyle}>Lines</span>
          <div style={sbRowStyle}>
            {[
              ['rows', 'Rows'],
              ['all', 'Grid'],
              ['none', 'None'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={curTable?.borders === v ? 'btn' : 'btn btn-outline'}
                style={sbBtnStyle}
                onMouseDown={preventFocusLoss}
                onClick={() => tableChange({ borders: v })}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={sbLabelStyle}>Cell text</span>
          <div style={sbRowStyle}>
            {ALIGN_OPTIONS.slice(0, 3).map((opt) => (
              <button
                key={opt.v}
                type="button"
                title={`Align cells ${opt.v}`}
                className={curTable?.align === opt.v ? 'btn' : 'btn btn-outline'}
                style={sbBtnStyle}
                onMouseDown={preventFocusLoss}
                onClick={() => tableChange({ align: opt.v })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={sbRowStyle}>
            {[
              ['small', 'Small'],
              ['normal', 'Normal'],
              ['large', 'Large'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={curTable?.size === v ? 'btn' : 'btn btn-outline'}
                style={sbBtnStyle}
                onMouseDown={preventFocusLoss}
                onClick={() => tableChange({ size: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </SbSection>
      )}

      {showChart && (
        <SbSection title="Chart design">
          <span style={sbLabelStyle}>Type</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {CHART_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={curChart && (curChart.chartType || 'bar') === t.id ? 'btn' : 'btn btn-outline'}
                style={{ ...sbBtnStyle, flex: 'none' }}
                onMouseDown={preventFocusLoss}
                onClick={() => patchTarget('chart', { chartType: t.id }, 'chart')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span style={sbLabelStyle}>Colors</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {CHART_PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                onMouseDown={preventFocusLoss}
                onClick={() => patchTarget('chart', { palette: p.id }, 'chart')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 6px',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--color-ink)',
                  border:
                    curChart && (curChart.palette || 'forest') === p.id
                      ? '2px solid var(--color-ink)'
                      : '1px solid var(--color-line)',
                  borderRadius: 4,
                }}
              >
                <span style={{ display: 'flex' }}>
                  {p.colors.slice(0, 5).map((c) => (
                    <span key={c} style={{ width: 14, height: 14, background: c }} />
                  ))}
                </span>
                {p.label}
              </button>
            ))}
          </div>
          <label style={sbCheckStyle}>
            <input
              type="checkbox"
              checked={curChart ? curChart.showValues !== false : true}
              onChange={(e) => patchTarget('chart', { showValues: e.target.checked }, 'chart')}
              style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
            />
            <span>Show numbers on chart</span>
          </label>
        </SbSection>
      )}

      <SbSection title="Insert" defaultOpen={false}>
        <div style={sbHintStyle}>
          {activeLabel ? `Adds below the ${activeLabel.toLowerCase()} you clicked.` : 'Adds at the end of the post.'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['text', 'Paragraph'],
            ['heading', 'Heading'],
            ['table', 'Table'],
            ['chart', 'Chart'],
            ['html', 'Custom HTML'],
            ['faq', 'FAQs'],
            ['compare', 'Compare'],
            ['download', 'Download'],
          ].map(([type, label]) => (
            <button
              key={type}
              type="button"
              className="btn btn-outline"
              style={{ ...sbBtnStyle, flex: 'none' }}
              onClick={() => onInsert(type)}
            >
              + {label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline"
            style={{ ...sbBtnStyle, flex: 'none' }}
            onClick={() => imageInputRef.current?.click()}
          >
            + Image
          </button>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onInsertImage(e.target.files)
            e.target.value = ''
          }}
        />
      </SbSection>

      {msg && <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: '8px 0 0' }}>{msg}</p>}
    </div>
  )
}


export default function BlockEditor({ blocks, onChange, tldr, onTldrChange }) {
  const hasTldr = typeof tldr === 'string' && typeof onTldrChange === 'function'
  // Box style / spacing / alignment picked for the TL;DR while editing. The
  // TL;DR is saved as a single line of text, so only the inline formatting
  // (bold, colour, font, size, links) is stored with the post.
  const [tldrStyle, setTldrStyle] = useState({})
  // The editable area fills itself from `tldr` once, on mount. If the text is
  // replaced from outside (Quick paste), remount it so the new text shows.
  const lastTldr = useRef(tldr)
  const [tldrSeed, setTldrSeed] = useState(0)
  useEffect(() => {
    if (tldr !== lastTldr.current) {
      lastTldr.current = tldr
      setTldrSeed((s) => s + 1)
    }
  }, [tldr])

  function handleTldrChange(text) {
    lastTldr.current = text
    onTldrChange?.(text)
  }

  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [uploadingDl, setUploadingDl] = useState(null)
  const [targets, setTargets] = useState([])
  // Which paragraph / heading the sidebar is currently working on, and a map
  // of every live paragraph editor so the sidebar can format them.
  const [active, setActive] = useState(null)
  const registry = useRef(new Map())

  const wrapRef = useRef(null)

  function activate(key, blockId) {
    setActive((prev) => (prev && prev.key === key && prev.blockId === blockId ? prev : { key, blockId }))
  }

  // The sidebar works on a list of blocks. We hand it the TL;DR as an extra
  // paragraph at the front so every formatting control treats it like any
  // other paragraph, then split it back out again on the way down.
  const sidebarBlocks = hasTldr
    ? [{ id: TLDR_ID, type: 'text', label: 'TL;DR', content: tldr, ...tldrStyle }, ...blocks]
    : blocks

  function sidebarChange(updater) {
    const next = typeof updater === 'function' ? updater(sidebarBlocks) : updater
    if (!hasTldr) {
      onChange(next)
      return
    }
    const t = next.find((b) => b.id === TLDR_ID)
    if (t) {
      if (t.content !== tldr) handleTldrChange(t.content)
      // eslint-disable-next-line no-unused-vars
      const { id, type, label, content, ...rest } = t
      setTldrStyle(rest)
    }
    onChange(next.filter((b) => b.id !== TLDR_ID))
  }

  // Adds a new block right below the block that was clicked last (or at the
  // end if none was).
  function insertBlock(type) {
    const make = {
      text: () => newTextBlock(''),
      heading: () => newHeadingBlock(''),
      table: newTableBlock,
      chart: newChartBlock,
      html: newHtmlBlock,
      faq: newFaqBlock,
      compare: newCompareBlock,
      download: newDownloadBlock,
    }[type]
    if (!make) return
    const nb = make()
    const afterId = active?.blockId
    onChange((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId)
      const next = [...prev]
      next.splice(idx === -1 ? next.length : idx + 1, 0, nb)
      return next
    })
    setActive({ key: null, blockId: nb.id })
  }

  function insertImages(files) {
    const idx = blocks.findIndex((b) => b.id === active?.blockId)
    handleFiles(files, idx === -1 ? null : idx + 1)
  }

  useEffect(() => {
    supabase
      .from('posts')
      .select('title, slug, published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setTargets(
          data.map((p) => ({
            label: `Post: ${p.title}${p.published ? '' : ' (draft)'}`,
            url: `/blog/${p.slug}`,
          }))
        )
      })
  }, [])

  async function handleDownloadFile(block, file) {
    if (!file) return
    setUploadingDl(block.id)
    try {
      const { url, filename } = await uploadDownloadFile(file)
      updateBlock(block.id, { url, filename })
    } catch (err) {
      alert('File upload failed: ' + err.message)
    } finally {
      setUploadingDl(null)
    }
  }

  // `onChange` is React's setState, so these use the updater form: several
  // editors can then be changed in one go ("All content") without one
  // overwriting the others.
  function updateBlock(id, patch) {
    onChange((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function removeBlock(id) {
    onChange((prev) => prev.filter((b) => b.id !== id))
  }

  async function handleFiles(files, atIndex = null) {
    if (!files || !files.length) return
    setUploading(true)
    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const url = await uploadImage(file)
        uploaded.push(newImageBlock(url, ''))
      }
      if (uploaded.length) {
        if (atIndex === null) {
          onChange([...blocks, ...uploaded])
        } else {
          const next = [...blocks]
          next.splice(atIndex, 0, ...uploaded)
          onChange(next)
        }
      }
    } catch (err) {
      alert('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDropZoneDrop(e) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function handleBlockDragStart(index) {
    setDragIndex(index)
  }

  function handleBlockDragOver(e, index) {
    e.preventDefault()
    setDropIndex(index)
  }

  function handleBlockDrop(e, index) {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      const next = [...blocks]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      onChange(next)
    } else if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files, index)
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  // --- Table helpers ---
  function updateTableCell(block, rowIndex, colIndex, value) {
    const rows = block.rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row
    )
    updateBlock(block.id, { rows })
  }

  function updateTableHeader(block, colIndex, value) {
    const headers = block.headers.map((h, c) => (c === colIndex ? value : h))
    updateBlock(block.id, { headers })
  }

  function addTableRow(block) {
    updateBlock(block.id, { rows: [...block.rows, block.headers.map(() => '')] })
  }

  function removeTableRow(block, rowIndex) {
    updateBlock(block.id, { rows: block.rows.filter((_, r) => r !== rowIndex) })
  }

  function addTableColumn(block) {
    updateBlock(block.id, {
      headers: [...block.headers, `Column ${block.headers.length + 1}`],
      rows: block.rows.map((row) => [...row, '']),
    })
  }

  function removeTableColumn(block, colIndex) {
    if (block.headers.length <= 1) return
    updateBlock(block.id, {
      headers: block.headers.filter((_, c) => c !== colIndex),
      rows: block.rows.map((row) => row.filter((_, c) => c !== colIndex)),
    })
  }

  // --- Chart helpers ---
  function updateChartItem(block, index, patch) {
    onChange((prev) =>
      prev.map((b) =>
        b.id === block.id
          ? { ...b, items: b.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }
          : b
      )
    )
  }

  function addChartItem(block) {
    updateBlock(block.id, { items: [...block.items, { label: '', value: '' }] })
  }

  function removeChartItem(block, index) {
    updateBlock(block.id, { items: block.items.filter((_, i) => i !== index) })
  }

  // --- Compare helpers ---
  function updateCompareRow(block, index, patch) {
    updateBlock(block.id, {
      rows: block.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    })
  }
  function addCompareRow(block) {
    updateBlock(block.id, { rows: [...block.rows, { feature: '', a: '', b: '', winner: '' }] })
  }
  function removeCompareRow(block, index) {
    updateBlock(block.id, { rows: block.rows.filter((_, i) => i !== index) })
  }

  // --- FAQ helpers ---
  function updateFaqItem(block, index, patch) {
    onChange((prev) =>
      prev.map((b) =>
        b.id === block.id
          ? { ...b, items: b.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }
          : b
      )
    )
  }

  function addFaqItem(block) {
    updateBlock(block.id, { items: [...block.items, { question: '', answer: '' }] })
  }

  function removeFaqItem(block, index) {
    updateBlock(block.id, { items: block.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="editor-layout">
      <div className="editor-sidebar-wrap" ref={wrapRef}>
        <EditorSidebar
          registry={registry}
          active={active}
          setActive={setActive}
          blocks={sidebarBlocks}
          onChange={sidebarChange}
          targets={targets}
          onInsert={insertBlock}
          onInsertImage={insertImages}
        />
      </div>

      <div className="editor-main">
      {hasTldr && (
        <div
          onFocusCapture={() => activate(null, TLDR_ID)}
          style={{
            position: 'relative',
            marginBottom: 14,
            padding: 14,
            border:
              active?.blockId === TLDR_ID
                ? '1px solid var(--color-accent)'
                : '1px dashed var(--color-line)',
            borderRadius: 4,
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)' }}>
              TL;DR
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
              Shown at the top of the post &middot; formats like any paragraph
            </span>
          </div>
          <RichEditor
            key={tldrSeed}
            value={tldr}
            onChange={handleTldrChange}
            placeholder="A one or two line summary of the whole post..."
            align={tldrStyle.align}
            theme={tldrStyle.theme}
            lineHeight={tldrStyle.lineHeight}
            editorKey={TLDR_ID}
            blockId={TLDR_ID}
            registry={registry}
            onActivate={activate}
          />
        </div>
      )}

      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable
          onFocusCapture={() => activate(null, block.id)}
          onDragStart={() => handleBlockDragStart(index)}
          onDragOver={(e) => handleBlockDragOver(e, index)}
          onDrop={(e) => handleBlockDrop(e, index)}
          style={{
            position: 'relative',
            marginBottom: 14,
            padding: 14,
            border:
              active?.blockId === block.id
                ? '1px solid var(--color-accent)'
                : '1px solid var(--color-line)',
            borderRadius: 4,
            background: dropIndex === index ? 'var(--color-accent-soft)' : 'var(--color-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{ cursor: 'grab', fontSize: 13, color: 'var(--color-ink-soft)' }}
              title="Drag to reorder"
            >
              &#8942;&#8942;{' '}
              {BLOCK_LABELS[block.type]}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="btn-danger btn"
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                Remove
              </button>
            </div>
          </div>

          {block.type === 'text' && (
            <RichEditor
              value={block.content}
              onChange={(text) => updateBlock(block.id, { content: text })}
              placeholder="Write a paragraph..."
              align={block.align}
              theme={block.theme}
              lineHeight={block.lineHeight}
              editorKey={block.id}
              blockId={block.id}
              registry={registry}
              onActivate={activate}
            />
          )}

          {block.type === 'heading' && (
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Section heading"
              style={{
                fontSize: 18,
                fontFamily: (block.font && (ensureFont(block.font), fontCss(block.font))) || 'var(--font-display)',
                color: block.color || undefined,
                textAlign: block.align || 'left',
              }}
            />
          )}

          {block.type === 'image' && (
            <div>
              <img
                src={block.url}
                alt={block.caption}
                style={{
                  width:
                    block.width === 'small' ? '40%' : block.width === 'medium' ? '70%' : '100%',
                  borderRadius: 4,
                  margin: '0 auto 10px',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {['small', 'medium', 'large'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateBlock(block.id, { width: w })}
                    className={block.width === w ? 'btn' : 'btn btn-outline'}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Caption (optional)"
                value={block.caption}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
              />
            </div>
          )}

          {block.type === 'table' && (
            <div>
              <ModeSwitch htmlMode={Boolean(block.htmlMode)} onChange={(m) => updateBlock(block.id, { htmlMode: m })} />
              {block.htmlMode ? (
                <HtmlCodeEditor
                  value={block.html}
                  onChange={(html) => updateBlock(block.id, { html })}
                  seeds={[{ label: 'Start from my table', html: () => tableToHtml(block) }]}
                />
              ) : (
                <>
              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {block.headers.map((header, colIndex) => (
                        <th key={colIndex} style={{ padding: 4 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              value={header}
                              onChange={(e) => updateTableHeader(block, colIndex, e.target.value)}
                              style={{ fontWeight: 600 }}
                            />
                            <button
                              type="button"
                              className="btn-danger btn"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => removeTableColumn(block, colIndex)}
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} style={{ padding: 4 }}>
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) =>
                                updateTableCell(block, rowIndex, colIndex, e.target.value)
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            className="btn-danger btn"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => removeTableRow(block, rowIndex)}
                          >
                            Remove row
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: 12 }}
                  onClick={() => addTableRow(block)}
                >
                  + Row
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: 12 }}
                  onClick={() => addTableColumn(block)}
                >
                  + Column
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginBottom: 6 }}>
                  Preview — change the look from the Formatting panel on the left.
                </div>
                <TableView block={block} compact />
              </div>
                </>
              )}
            </div>
          )}

          {block.type === 'chart' && (
            <div>
              <ModeSwitch htmlMode={Boolean(block.htmlMode)} onChange={(m) => updateBlock(block.id, { htmlMode: m })} />
              {block.htmlMode ? (
                <HtmlCodeEditor
                  value={block.html}
                  onChange={(html) => updateBlock(block.id, { html })}
                  seeds={[
                    { label: 'Start from my data', html: () => chartToHtml(block) },
                    { label: 'Chart.js example', html: () => CHARTJS_EXAMPLE },
                  ]}
                />
              ) : (
                <>
              <div className="field">
                <label>Chart title (optional)</label>
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                  placeholder="e.g. Visitors per month"
                />
              </div>
              <label>Data</label>
              {block.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={item.label}
                    placeholder="Label"
                    onChange={(e) => updateChartItem(block, i, { label: e.target.value })}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.value}
                    placeholder="Number"
                    onChange={(e) => updateChartItem(block, i, { value: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-danger btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => removeChartItem(block, i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 12, marginBottom: 16 }}
                onClick={() => addChartItem(block)}
              >
                + Row
              </button>
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginBottom: 6 }}>
                Preview — change type and colors from the Formatting panel on the left.
              </div>
              <ChartView block={block} compact />
                </>
              )}
            </div>
          )}

          {block.type === 'download' && (
            <div>
              <div className="field">
                <label>Button text</label>
                <input
                  type="text"
                  value={block.label}
                  onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                  placeholder="Download the guide"
                />
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>File (PDF, doc, zip, image, anything)</label>
                {block.filename && (
                  <div style={{ fontSize: 13, marginBottom: 8 }}>Uploaded: {block.filename}</div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleDownloadFile(block, e.target.files?.[0])}
                />
                {uploadingDl === block.id && (
                  <div style={{ fontSize: 13, marginTop: 6 }}>Uploading...</div>
                )}
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Or paste a file link</label>
                <input
                  type="text"
                  value={block.url}
                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {block.type === 'html' && (
            <HtmlCodeEditor value={block.html} onChange={(html) => updateBlock(block.id, { html })} />
          )}

          {block.type === 'compare' && (
            <div>
              <div className="field">
                <label>Comparison title (optional)</label>
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                  placeholder="e.g. ChatGPT vs Gemini"
                />
              </div>
              <div className="compare-edit-names">
                <div className="field">
                  <label>Tool 1 name</label>
                  <input type="text" value={block.a || ''} onChange={(e) => updateBlock(block.id, { a: e.target.value })} placeholder="Tool 1" />
                </div>
                <div className="field">
                  <label>Tool 2 name</label>
                  <input type="text" value={block.b || ''} onChange={(e) => updateBlock(block.id, { b: e.target.value })} placeholder="Tool 2" />
                </div>
              </div>

              <div className="compare-edit-head">
                <span>Feature</span>
                <span>{block.a || 'Tool 1'}</span>
                <span>{block.b || 'Tool 2'}</span>
                <span>Better</span>
                <span />
              </div>
              {block.rows.map((r, i) => (
                <div className="compare-edit-row" key={i}>
                  <input type="text" value={r.feature} onChange={(e) => updateCompareRow(block, i, { feature: e.target.value })} placeholder="e.g. Price" />
                  <input type="text" value={r.a} onChange={(e) => updateCompareRow(block, i, { a: e.target.value })} placeholder="Tool 1" />
                  <input type="text" value={r.b} onChange={(e) => updateCompareRow(block, i, { b: e.target.value })} placeholder="Tool 2" />
                  <select value={r.winner || ''} onChange={(e) => updateCompareRow(block, i, { winner: e.target.value })}>
                    <option value="">-</option>
                    <option value="a">{block.a || 'Tool 1'}</option>
                    <option value="b">{block.b || 'Tool 2'}</option>
                    <option value="tie">Tie</option>
                  </select>
                  <button type="button" className="btn-danger btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => removeCompareRow(block, i)} aria-label="Remove row">
                    &times;
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline" style={{ fontSize: 13, marginBottom: 16 }} onClick={() => addCompareRow(block)}>
                + Add row
              </button>

              <div className="field">
                <label>Who is ahead overall?</label>
                <select value={block.winner || 'auto'} onChange={(e) => updateBlock(block.id, { winner: e.target.value })}>
                  <option value="auto">Automatic (whoever wins more rows)</option>
                  <option value="a">{block.a || 'Tool 1'}</option>
                  <option value="b">{block.b || 'Tool 2'}</option>
                  <option value="tie">It is a tie</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Verdict (short summary of which is better and for whom)</label>
                <textarea rows={3} value={block.verdict || ''} onChange={(e) => updateBlock(block.id, { verdict: e.target.value })} placeholder="e.g. Tool 1 is better for beginners, Tool 2 is better for teams." />
              </div>
            </div>
          )}

          {block.type === 'faq' && (
            <div>
              {block.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 14,
                    paddingBottom: 14,
                    borderBottom:
                      i === block.items.length - 1 ? 'none' : '1px solid var(--color-line)',
                  }}
                >
                  <div className="field">
                    <label>Question {i + 1}</label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaqItem(block, i, { question: e.target.value })}
                      placeholder="Question"
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Answer</label>
                    <RichEditor
                      value={item.answer}
                      onChange={(text) => updateFaqItem(block, i, { answer: text })}
                      placeholder="Answer"
                      editorKey={`${block.id}:${i}`}
                      blockId={block.id}
                      registry={registry}
                      onActivate={activate}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-danger btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => removeFaqItem(block, i)}
                  >
                    Remove question
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 13 }}
                onClick={() => addFaqItem(block)}
              >
                + Add question
              </button>
            </div>
          )}
        </div>
      ))}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropZoneDrop}
        style={{
          border: '1px dashed var(--color-line)',
          borderRadius: 4,
          padding: 28,
          textAlign: 'center',
          color: 'var(--color-ink-soft)',
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        {uploading ? 'Uploading...' : 'Drag & drop images here to add them anywhere in the post'}
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 13 }}
            onClick={() => fileInputRef.current?.click()}
          >
            Or browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newTextBlock('')])}
        >
          + Add paragraph
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newHeadingBlock('')])}
        >
          + Add heading
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newTableBlock()])}
        >
          + Add table
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newChartBlock()])}
        >
          + Add chart
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newHtmlBlock()])}
        >
          + Add HTML
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newFaqBlock()])}
        >
          + Add FAQs
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newCompareBlock()])}
        >
          + Add comparison
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onChange([...blocks, newDownloadBlock()])}
        >
          + Add download
        </button>
      </div>
      </div>
    </div>
  )
}