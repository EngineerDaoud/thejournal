// Shared style definitions used by BOTH the admin editor and the public post
// renderer, so what you design in the editor is exactly what visitors see.

import { GOOGLE_FONTS, SYSTEM_FONTS } from './fonts'

// ---------- Fonts ----------
// `css` is what gets applied. Google Fonts are loaded in index.html; the
// system fonts (Georgia, Arial, ...) need nothing.
export const FONT_OPTIONS = [
  ...GOOGLE_FONTS.map((f) => ({
    name: f.name,
    cat: f.cat,
    css: `'${f.name}', ${f.fallback}`,
  })),
  ...SYSTEM_FONTS,
]

const SAFE_FONT_NAME = /^[\w\s-]{1,40}$/

export function fontCss(name) {
  const clean = (name || '').trim()
  if (!clean) return null
  const found = FONT_OPTIONS.find((f) => f.name.toLowerCase() === clean.toLowerCase())
  if (found) return found.css
  // Fonts the admin added (uploaded or extra Google Fonts).
  return SAFE_FONT_NAME.test(clean) ? `'${clean}', sans-serif` : null
}

export const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72, 80]

export function clampSize(n) {
  return Math.min(80, Math.max(8, Math.round(Number(n) || 0)))
}

export const HIGHLIGHT_SWATCHES = ['#FFF3A3', '#C8F7C5', '#FFD6D6', '#CDE7FF', '#E9D5FF', '#FFD9A8']

// ---------- Paragraph look ----------
export const LINE_SPACINGS = [
  { id: 'tight', label: 'Tight', value: 1.35 },
  { id: 'normal', label: 'Normal', value: null },
  { id: 'relaxed', label: 'Relaxed', value: 1.9 },
  { id: 'loose', label: 'Loose', value: 2.3 },
]

export function lineHeightValue(id) {
  return LINE_SPACINGS.find((l) => l.id === id)?.value || null
}

// Longhand borders only (no `border:` shorthand) so React can switch between
// themes without style-conflict warnings.
export const BLOCK_THEMES = [
  { id: 'none', label: 'Plain', style: {} },
  {
    id: 'callout',
    label: 'Callout (green)',
    style: {
      background: 'var(--color-accent-soft)',
      borderLeft: '3px solid var(--color-accent)',
      padding: '16px 20px',
      borderRadius: 4,
    },
  },
  {
    id: 'note',
    label: 'Note (gold)',
    style: {
      background: '#FBF3E2',
      borderLeft: '3px solid var(--color-gold)',
      padding: '16px 20px',
      borderRadius: 4,
    },
  },
  {
    id: 'info',
    label: 'Info (blue)',
    style: {
      background: '#E8F0FE',
      borderLeft: '3px solid #1a56db',
      padding: '16px 20px',
      borderRadius: 4,
    },
  },
  {
    id: 'warning',
    label: 'Warning (red)',
    style: {
      background: '#FBE9E6',
      borderLeft: '3px solid var(--color-danger)',
      padding: '16px 20px',
      borderRadius: 4,
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    style: {
      borderLeft: '3px solid var(--color-ink)',
      padding: '4px 0 4px 20px',
      fontStyle: 'italic',
      color: 'var(--color-ink-soft)',
      fontFamily: 'var(--font-display)',
    },
  },
  {
    id: 'dark',
    label: 'Dark box',
    style: {
      background: 'var(--color-ink)',
      color: 'var(--color-bg)',
      padding: '16px 20px',
      borderRadius: 4,
    },
  },
]

export function themeStyle(id) {
  return { ...(BLOCK_THEMES.find((t) => t.id === id)?.style || {}) }
}

// ---------- Tables ----------
export const TABLE_PRESETS = [
  {
    id: 'classic',
    label: 'Classic',
    design: { headerBg: '', headerColor: '', stripe: false, borders: 'rows', align: 'left', size: 'normal' },
  },
  {
    id: 'striped',
    label: 'Striped',
    design: { headerBg: '#3D5A45', headerColor: '#FFFFFF', stripe: true, borders: 'none', align: 'left', size: 'normal' },
  },
  {
    id: 'grid',
    label: 'Grid',
    design: { headerBg: '#E7EBE3', headerColor: '#23241F', stripe: false, borders: 'all', align: 'left', size: 'normal' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    design: { headerBg: '', headerColor: '', stripe: false, borders: 'none', align: 'left', size: 'normal' },
  },
  {
    id: 'dark',
    label: 'Dark header',
    design: { headerBg: '#23241F', headerColor: '#FFFFFF', stripe: true, borders: 'rows', align: 'left', size: 'normal' },
  },
  {
    id: 'warm',
    label: 'Warm',
    design: { headerBg: '#A97F3F', headerColor: '#FFFFFF', stripe: true, borders: 'rows', align: 'left', size: 'normal' },
  },
]

export const HEADER_SWATCHES = ['', '#23241F', '#3D5A45', '#A97F3F', '#1a56db', '#A23B2E', '#8e2de2', '#E7EBE3']

// Readable text color (dark or white) for a given background color.
export function textOn(hex) {
  const h = (hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (!/^[0-9a-fA-F]{6}/.test(full)) return ''
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#23241F' : '#FFFFFF'
}

export function resolveTableDesign(design) {
  return { ...TABLE_PRESETS[0].design, ...(design || {}) }
}

export function tableStyles(d) {
  const line = '1px solid var(--color-line)'
  const none = 'none'
  const fontSize = { small: 13, normal: 15, large: 17 }[d.size] || 15
  const padding = d.size === 'small' ? '7px 10px' : d.size === 'large' ? '13px 16px' : '10px 14px'
  const grid = d.borders === 'all'
  const rows = d.borders === 'rows'

  const table = {
    width: '100%',
    borderCollapse: 'collapse',
    borderTop: grid ? line : none,
    borderRight: grid ? line : none,
    borderBottom: grid ? line : none,
    borderLeft: grid ? line : none,
  }
  const th = {
    textAlign: d.align || 'left',
    padding,
    fontSize: fontSize - 1,
    fontWeight: 600,
    background: d.headerBg || 'transparent',
    color: d.headerColor || 'inherit',
    borderTop: none,
    borderRight: grid ? line : none,
    borderBottom: d.headerBg && !grid ? none : grid ? line : '2px solid var(--color-ink)',
    borderLeft: grid ? line : none,
  }
  const td = (rowIndex) => ({
    textAlign: d.align || 'left',
    padding,
    fontSize,
    background: d.stripe && rowIndex % 2 === 1 ? 'rgba(35, 36, 31, 0.05)' : 'transparent',
    borderTop: none,
    borderRight: grid ? line : none,
    borderBottom: grid || rows ? line : none,
    borderLeft: grid ? line : none,
  })
  return { table, th, td }
}

// ---------- Charts ----------
export const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'hbar', label: 'Horizontal' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie' },
  { id: 'donut', label: 'Donut' },
]

export const CHART_PALETTES = [
  { id: 'forest', label: 'Forest', colors: ['#3D5A45', '#6B8F71', '#A97F3F', '#C9B37E', '#23241F', '#8FA98F'] },
  { id: 'warm', label: 'Warm', colors: ['#A23B2E', '#D9822B', '#A97F3F', '#E8B86B', '#7A3E2B', '#F2D0A4'] },
  { id: 'ocean', label: 'Ocean', colors: ['#1a56db', '#3b82f6', '#0e9f9f', '#60a5fa', '#1e3a8a', '#93c5fd'] },
  { id: 'vivid', label: 'Vivid', colors: ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#8e2de2', '#e9c46a'] },
  { id: 'mono', label: 'Mono', colors: ['#23241F', '#5C5C52', '#8C8C80', '#B5B2A5', '#DEDACF', '#3d3d36'] },
]

// ---------- Custom HTML (starting points for the "HTML code" mode) ----------
const escHtml = (t) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Turns the visual table (with its current design) into editable HTML.
export function tableToHtml(block) {
  const d = resolveTableDesign(block.design)
  const pad = d.size === 'small' ? '7px 10px' : d.size === 'large' ? '13px 16px' : '10px 14px'
  const fs = { small: 13, normal: 15, large: 17 }[d.size] || 15
  const line = '1px solid #DEDACF'
  const grid = d.borders === 'all'
  const rows = d.borders === 'rows'
  const css = [
    `table { width: 100%; border-collapse: collapse; font-size: ${fs}px; ${grid ? `border: ${line};` : ''} }`,
    `th { text-align: ${d.align}; padding: ${pad}; font-size: ${fs - 1}px; ${
      d.headerBg
        ? `background: ${d.headerBg}; color: ${d.headerColor || '#fff'};`
        : 'border-bottom: 2px solid #23241F;'
    } ${grid ? `border: ${line};` : ''} }`,
    `td { text-align: ${d.align}; padding: ${pad}; ${grid ? `border: ${line};` : rows ? `border-bottom: ${line};` : ''} }`,
    d.stripe ? 'tbody tr:nth-child(even) td { background: rgba(35, 36, 31, 0.05); }' : '',
  ]
    .filter(Boolean)
    .map((l) => `  ${l}`)
    .join('\n')
  const head = block.headers.map((h) => `<th>${escHtml(h)}</th>`).join('')
  const body = block.rows
    .map((r) => `    <tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join('')}</tr>`)
    .join('\n')
  return `<style>\n${css}\n</style>\n<table>\n  <thead><tr>${head}</tr></thead>\n  <tbody>\n${body}\n  </tbody>\n</table>\n`
}

// Turns the visual chart data into simple, editable HTML bars.
export function chartToHtml(block) {
  const color = (CHART_PALETTES.find((p) => p.id === block.palette) || CHART_PALETTES[0]).colors[0]
  const items = (block.items || [])
    .map((i) => ({ label: String(i.label ?? ''), value: Number(String(i.value ?? '').replace(/,/g, '')) }))
    .filter((i) => Number.isFinite(i.value) && (i.label || i.value))
  const max = Math.max(1, ...items.map((i) => i.value))
  const bars = items
    .map(
      (i) =>
        `  <div class="row"><span class="label">${escHtml(i.label)}</span>` +
        `<div class="bar" style="width: ${Math.round((i.value / max) * 100)}%"></div>` +
        `<span class="value">${i.value}</span></div>`
    )
    .join('\n')
  return `<style>
  .chart h3 { margin: 0 0 14px; text-align: center; font-weight: 500; }
  .row { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
  .label { width: 110px; text-align: right; font-size: 14px; }
  .bar { height: 24px; border-radius: 3px; background: ${color}; }
  .value { font-size: 14px; }
</style>
<div class="chart">
${block.title ? `  <h3>${escHtml(block.title)}</h3>\n` : ''}${bars}
</div>
`
}

export const CHARTJS_EXAMPLE = `<div style="position: relative; height: 320px;">
  <canvas id="myChart"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  new Chart(document.getElementById('myChart'), {
    type: 'bar', // try 'line', 'pie', 'doughnut'
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{ label: 'Visitors', data: [10, 18, 14, 22], backgroundColor: '#3D5A45' }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
</script>
`