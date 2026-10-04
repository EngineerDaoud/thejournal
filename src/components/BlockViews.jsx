import { useEffect, useMemo, useRef, useState } from 'react'
import RichText from './RichText'
import { CHART_PALETTES, resolveTableDesign, tableStyles } from '../lib/blockStyles'

// Table, chart and custom-HTML blocks. Used by the public post page AND by
// the live previews in the admin editor.

// Custom HTML runs inside a sandboxed <iframe>: your <style>, <table>, <svg>
// and even <script> (e.g. Chart.js from a CDN) all work, but the code is
// isolated from the rest of the site (it cannot touch the page, the admin
// login or the database). The frame reports its own height so it fits.
let frameCounter = 0

function buildHtmlDoc(html, id) {
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;padding:0}body{display:flow-root;font-family:'Times New Roman',Times,serif;font-size:17px;line-height:1.6;color:#23241F;background:transparent}img,canvas{max-width:100%}</style>
</head><body>${html}
<script>(function(){var id=${JSON.stringify(id)};function send(){try{parent.postMessage({__htmlBlock:id,height:document.body.offsetHeight},'*')}catch(e){}}window.addEventListener('load',send);if(window.ResizeObserver){new ResizeObserver(send).observe(document.body)}setTimeout(send,150);setTimeout(send,800)})();</script>
</body></html>`
}

export function HtmlFrame({ html, compact = false }) {
  const ref = useRef(null)
  const id = useMemo(() => `hf-${Date.now()}-${++frameCounter}`, [])
  const doc = useMemo(() => buildHtmlDoc(html || '', id), [html, id])
  const [height, setHeight] = useState(160)

  useEffect(() => {
    function onMessage(e) {
      if (e.source !== ref.current?.contentWindow) return
      const d = e.data
      if (d && d.__htmlBlock === id && Number.isFinite(d.height)) {
        setHeight(Math.min(Math.max(40, Math.ceil(d.height)), 6000))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [id])

  return (
    <iframe
      ref={ref}
      title="Custom HTML"
      srcDoc={doc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: '100%', height, border: 0, display: 'block', margin: compact ? 0 : '32px 0' }}
    />
  )
}

const usesHtml = (block) => Boolean(block.htmlMode && (block.html || '').trim())

export function TableView({ block, compact = false }) {
  if (usesHtml(block)) return <HtmlFrame html={block.html} compact={compact} />
  const d = resolveTableDesign(block.design)
  const st = tableStyles(d)
  return (
    <div style={{ overflowX: 'auto', margin: compact ? 0 : '32px 0' }}>
      <table style={st.table}>
        <thead>
          <tr>
            {block.headers.map((header, i) => (
              <th key={i} style={st.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} style={st.td(r)}>
                  <RichText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Charts (plain SVG, no library) ----------
const W = 600
const svgStyle = { width: '100%', height: 'auto', display: 'block' }
const axisText = { fontSize: 11, fill: 'var(--color-ink-soft)' }

function fmtNum(v) {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function niceMax(v) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function clip(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function BarChart({ items, color, showValues }) {
  const H = 320
  const m = { t: 26, r: 16, b: 52, l: 48 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const max = niceMax(Math.max(...items.map((i) => i.value)))
  const step = pw / items.length
  const bw = Math.min(64, step * 0.62)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (max / 4) * i
        const y = m.t + ph - (t / max) * ph
        return (
          <g key={i}>
            <line x1={m.l} x2={W - m.r} y1={y} y2={y} stroke="var(--color-line)" />
            <text x={m.l - 8} y={y + 4} textAnchor="end" {...axisText}>
              {fmtNum(t)}
            </text>
          </g>
        )
      })}
      {items.map((it, i) => {
        const h = (it.value / max) * ph
        const x = m.l + step * i + (step - bw) / 2
        const y = m.t + ph - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx={2} fill={color} />
            {showValues && (
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--color-ink)">
                {fmtNum(it.value)}
              </text>
            )}
            <text x={x + bw / 2} y={H - m.b + 18} textAnchor="middle" {...axisText}>
              {clip(it.label, step < 70 ? 8 : 14)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function HBarChart({ items, color, showValues }) {
  const rowH = 38
  const m = { t: 10, r: 46, b: 10, l: 120 }
  const H = m.t + m.b + items.length * rowH
  const pw = W - m.l - m.r
  const max = niceMax(Math.max(...items.map((i) => i.value)))
  const bh = Math.min(26, rowH * 0.66)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img">
      {items.map((it, i) => {
        const w = (it.value / max) * pw
        const y = m.t + i * rowH + (rowH - bh) / 2
        return (
          <g key={i}>
            <text x={m.l - 10} y={y + bh / 2 + 4} textAnchor="end" fontSize="12" fill="var(--color-ink)">
              {clip(it.label, 18)}
            </text>
            <rect x={m.l} y={y} width={Math.max(w, 1)} height={bh} rx={2} fill={color} />
            {showValues && (
              <text x={m.l + w + 8} y={y + bh / 2 + 4} fontSize="12" fill="var(--color-ink)">
                {fmtNum(it.value)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ items, color, showValues }) {
  const H = 320
  const m = { t: 26, r: 24, b: 52, l: 48 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const max = niceMax(Math.max(...items.map((i) => i.value)))
  const step = pw / items.length
  const pts = items.map((it, i) => [m.l + step * i + step / 2, m.t + ph - (it.value / max) * ph])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (max / 4) * i
        const y = m.t + ph - (t / max) * ph
        return (
          <g key={i}>
            <line x1={m.l} x2={W - m.r} y1={y} y2={y} stroke="var(--color-line)" />
            <text x={m.l - 8} y={y + 4} textAnchor="end" {...axisText}>
              {fmtNum(t)}
            </text>
          </g>
        )
      })}
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4.5" fill="var(--color-surface)" stroke={color} strokeWidth="2.5" />
          {showValues && (
            <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="12" fill="var(--color-ink)">
              {fmtNum(items[i].value)}
            </text>
          )}
          <text x={p[0]} y={H - m.b + 18} textAnchor="middle" {...axisText}>
            {clip(items[i].label, step < 70 ? 8 : 14)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function arcPath(cx, cy, r, a0, a1, r0) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const at = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]
  const [x0, y0] = at(a0, r)
  const [x1, y1] = at(a1, r)
  if (!r0) return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
  const [x2, y2] = at(a1, r0)
  const [x3, y3] = at(a0, r0)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`
}

function PieChart({ items, colors, showValues, donut }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const H = Math.max(300, items.length * 26 + 40)
  const cx = 150
  const cy = H / 2
  const r = 120
  let angle = -Math.PI / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img">
      {total > 0 &&
        items.map((it, i) => {
          const sweep = Math.min((it.value / total) * Math.PI * 2, Math.PI * 2 - 0.001)
          const a0 = angle
          angle += (it.value / total) * Math.PI * 2
          if (it.value <= 0) return null
          return (
            <path
              key={i}
              d={arcPath(cx, cy, r, a0, a0 + sweep, donut ? r * 0.58 : 0)}
              fill={colors[i % colors.length]}
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          )
        })}
      {items.map((it, i) => {
        const y = cy - (items.length * 26) / 2 + i * 26 + 13
        const pct = total > 0 ? Math.round((it.value / total) * 100) : 0
        return (
          <g key={i}>
            <rect x={330} y={y - 9} width={14} height={14} rx={2} fill={colors[i % colors.length]} />
            <text x={352} y={y + 3} fontSize="13" fill="var(--color-ink)">
              {clip(it.label, 22)}
              <tspan fill="var(--color-ink-soft)">{`  ${showValues ? fmtNum(it.value) + ' · ' : ''}${pct}%`}</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function ChartView({ block, compact = false }) {
  if (usesHtml(block)) return <HtmlFrame html={block.html} compact={compact} />
  const colors = (CHART_PALETTES.find((p) => p.id === block.palette) || CHART_PALETTES[0]).colors
  const items = (block.items || [])
    .map((it) => ({
      label: String(it.label ?? '').trim(),
      value: Math.max(0, Number(String(it.value ?? '').replace(/,/g, ''))),
    }))
    .filter((it) => Number.isFinite(it.value) && (it.label !== '' || it.value > 0))
  const type = block.chartType || 'bar'
  const showValues = block.showValues !== false

  let chart
  if (items.length === 0) {
    chart = (
      <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--color-ink-soft)', fontSize: 14 }}>
        Add some data to see the chart.
      </div>
    )
  } else if (type === 'pie' || type === 'donut') {
    chart = <PieChart items={items} colors={colors} showValues={showValues} donut={type === 'donut'} />
  } else if (type === 'hbar') {
    chart = <HBarChart items={items} color={colors[0]} showValues={showValues} />
  } else if (type === 'line') {
    chart = <LineChart items={items} color={colors[0]} showValues={showValues} />
  } else {
    chart = <BarChart items={items} color={colors[0]} showValues={showValues} />
  }

  return (
    <figure style={{ margin: compact ? 0 : '36px 0' }}>
      {block.title && (
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            marginBottom: 12,
          }}
        >
          {block.title}
        </div>
      )}
      {chart}
    </figure>
  )
}

// Side-by-side comparison of two tools: a row per feature (the better tool in each
// row is highlighted), a running score, and a short verdict at the end.
export function CompareView({ block }) {
  const a = (block.a || '').trim() || 'Tool A'
  const b = (block.b || '').trim() || 'Tool B'
  const rows = (block.rows || []).filter((r) => (r.feature || '').trim() || (r.a || '').trim() || (r.b || '').trim())
  const winsA = rows.filter((r) => r.winner === 'a').length
  const winsB = rows.filter((r) => r.winner === 'b').length

  // "auto" = whoever wins more rows; or the author can pick the overall winner by hand
  let overall = block.winner && block.winner !== 'auto' ? block.winner : winsA > winsB ? 'a' : winsB > winsA ? 'b' : 'tie'
  if (!winsA && !winsB && (!block.winner || block.winner === 'auto')) overall = ''
  const overallName = overall === 'a' ? a : overall === 'b' ? b : ''

  return (
    <div className="compare-card">
      {block.title && <h3 className="compare-title">{block.title}</h3>}

      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className={overall === 'a' ? 'is-lead' : ''}>
                {a}
                {overall === 'a' && <span className="compare-badge">Ahead</span>}
              </th>
              <th className={overall === 'b' ? 'is-lead' : ''}>
                {b}
                {overall === 'b' && <span className="compare-badge">Ahead</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{r.feature}</th>
                <td className={r.winner === 'a' ? 'compare-win' : ''}>
                  {r.winner === 'a' && <span aria-label="better">&#10003; </span>}
                  {r.a}
                </td>
                <td className={r.winner === 'b' ? 'compare-win' : ''}>
                  {r.winner === 'b' && <span aria-label="better">&#10003; </span>}
                  {r.b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(winsA > 0 || winsB > 0) && (
        <div className="compare-score">
          <span>{a}: <strong>{winsA}</strong></span>
          <span className="compare-score-sep">vs</span>
          <span>{b}: <strong>{winsB}</strong></span>
        </div>
      )}

      {(block.verdict || overall) && (
        <div className="compare-verdict">
          <strong>
            {overall === 'tie' ? 'Verdict: it is a tie' : overallName ? `Verdict: ${overallName} is ahead` : 'Verdict'}
          </strong>
          {block.verdict && <p>{block.verdict}</p>}
        </div>
      )}
    </div>
  )
}