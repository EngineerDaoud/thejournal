// Turns a pasted Markdown blog (title, TL;DR, headings, paragraphs, tables,
// FAQs, images) into the block structure the editor uses.

let idCounter = 0
function newId() {
  idCounter += 1
  return `pasted-${Date.now()}-${idCounter}`
}

function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line)
}

function isListLine(line) {
  return /^\s*([-*+]|\d+[.)])\s+/.test(line)
}

function cleanInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*\*/g, '')
}

function consumeParagraph(lines, startIndex) {
  const text = []
  let idx = startIndex
  let hasList = false
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    !/^#{1,6}\s/.test(lines[idx].trim()) &&
    !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[idx].trim()) &&
    !/^!\[.*?\]\(.*?\)/.test(lines[idx].trim()) &&
    !isTableLine(lines[idx])
  ) {
    if (isListLine(lines[idx])) hasList = true
    text.push(lines[idx].trim())
    idx++
  }
  // Bullet/numbered lists keep their line breaks, normal paragraphs are joined.
  return { text: text.join(hasList ? '\n' : ' '), nextIndex: idx }
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function parseMarkdownBlog(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  let title = ''
  let tldr = ''
  let ctaText = ''
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (trimmed === '') {
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      i++
      continue
    }

    const h1Match = trimmed.match(/^#\s+(.*)/)
    if (h1Match && !title) {
      title = h1Match[1].trim()
      i++
      continue
    }

    const headingMatch = trimmed.match(/^(#{2,4})\s+(.*)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()

      if (/^tl;?dr/i.test(headingText)) {
        const { text, nextIndex } = consumeParagraph(lines, i + 1)
        tldr = text
        i = nextIndex
        continue
      }

      if (/faq|frequently asked questions/i.test(headingText)) {
        i++
        const faqItems = []
        while (i < lines.length) {
          const l = lines[i].trim()
          if (l === '') {
            i++
            continue
          }
          const nextHeading = l.match(/^(#{1,4})\s+(.*)/)
          if (nextHeading && nextHeading[1].length <= level) break

          let question = ''
          if (nextHeading) {
            question = nextHeading[2].trim()
            i++
          } else {
            const boldMatch = l.match(/^\*\*(.+?)\*\*\s*$/)
            const qMatch = l.match(/^q[:.)]\s*(.*)/i)
            if (boldMatch) {
              question = boldMatch[1].trim()
              i++
            } else if (qMatch) {
              question = qMatch[1].trim()
              i++
            } else {
              i++
              continue
            }
          }
          const { text: answerRaw, nextIndex } = consumeParagraph(lines, i)
          const answer = answerRaw.replace(/^a[:.)]\s*/i, '')
          faqItems.push({ question: cleanInline(question), answer })
          i = nextIndex
        }
        if (faqItems.length) {
          blocks.push({ id: newId(), type: 'faq', items: faqItems })
        }
        continue
      }

      if (/call to action|^cta\b/i.test(headingText)) {
        const { text, nextIndex } = consumeParagraph(lines, i + 1)
        ctaText = cleanInline(text)
        i = nextIndex
        continue
      }

      blocks.push({ id: newId(), type: 'heading', content: cleanInline(headingText) })
      i++
      continue
    }

    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/)
    if (imgMatch) {
      blocks.push({
        id: newId(),
        type: 'image',
        url: imgMatch[2],
        caption: imgMatch[1] || '',
        width: 'large',
      })
      i++
      continue
    }

    if (isTableLine(trimmed)) {
      const tableLines = []
      let idx = i
      while (idx < lines.length && isTableLine(lines[idx])) {
        tableLines.push(lines[idx])
        idx++
      }
      const headers = parseTableRow(tableLines[0])
      const rows = tableLines.slice(2).map(parseTableRow)
      blocks.push({
        id: newId(),
        type: 'table',
        headers,
        rows: rows.length ? rows : [headers.map(() => '')],
      })
      i = idx
      continue
    }

    const tldrInline = trimmed.match(/^\*\*tl;?dr:?\*\*\s*(.*)/i)
    if (tldrInline) {
      let text = tldrInline[1].trim()
      if (!text) {
        const result = consumeParagraph(lines, i + 1)
        text = result.text
        i = result.nextIndex
      } else {
        i++
      }
      tldr = text
      continue
    }

    const { text, nextIndex } = consumeParagraph(lines, i)
    if (text) {
      blocks.push({ id: newId(), type: 'text', content: text })
    }
    i = nextIndex
  }

  const firstText = blocks.find((b) => b.type === 'text')
  const excerpt = firstText
    ? firstText.content.replace(/\s+/g, ' ').slice(0, 160).trim()
    : ''

  return { title, tldr, ctaText, excerpt, blocks }
}

// Reverse of the parser: turns the current post into Markdown so it can be
// copied and pasted somewhere else (or pasted back into the editor later).
export function postToMarkdown({ title, tldr, blocks, ctaText }) {
  const out = []
  if (title) out.push(`# ${title}`)
  if (tldr) out.push(`## TL;DR\n${tldr}`)

  for (const b of blocks) {
    if (b.type === 'html' || (b.htmlMode && b.html?.trim())) {
      if (b.html?.trim()) out.push(b.html.trim())
      continue
    }
    if (b.type === 'heading' && b.content?.trim()) {
      out.push(`## ${b.content.trim()}`)
    } else if (b.type === 'text' && b.content?.trim()) {
      out.push(b.content.trim())
    } else if (b.type === 'image' && b.url) {
      out.push(`![${b.caption || ''}](${b.url})`)
    } else if (b.type === 'table') {
      const head = `| ${b.headers.join(' | ')} |`
      const sep = `| ${b.headers.map(() => '---').join(' | ')} |`
      const rows = b.rows.map((r) => `| ${r.join(' | ')} |`)
      out.push([head, sep, ...rows].join('\n'))
    } else if (b.type === 'chart') {
      const rows = (b.items || []).map((it) => `| ${it.label} | ${it.value} |`)
      out.push([b.title ? `**${b.title}**\n` : '', '| Label | Value |', '| --- | --- |', ...rows].join('\n').trim())
    } else if (b.type === 'download' && b.url) {
      out.push(`[${b.label || 'Download'}](${b.url})`)
    } else if (b.type === 'compare') {
      const na = b.a || 'Tool A'
      const nb = b.b || 'Tool B'
      const rows = (b.rows || []).map((r) => `| ${r.feature} | ${r.a} | ${r.b} |`)
      out.push([b.title ? `**${b.title}**\n` : '', `| Feature | ${na} | ${nb} |`, '| --- | --- | --- |', ...rows, b.verdict ? `\n**Verdict:** ${b.verdict}` : ''].join('\n').trim())
    } else if (b.type === 'faq') {
      const items = b.items
        .filter((it) => it.question?.trim())
        .map((it) => `### ${it.question.trim()}\n${(it.answer || '').trim()}`)
      if (items.length) out.push(`## FAQs\n\n${items.join('\n\n')}`)
    }
  }

  if (ctaText) out.push(`## Call to action\n${ctaText}`)
  return out.join('\n\n') + '\n'
}