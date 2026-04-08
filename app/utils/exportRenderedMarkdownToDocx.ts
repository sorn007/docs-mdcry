import type { FileChild } from 'docx'

type DocxMod = typeof import('docx')

function sanitizeFileBase(name: string) {
  const base = name.replace(/[/\\]/g, '_').replace(/\.md$/i, '') || 'document'
  return base.replace(/[^\w\u0E00-\u0E7F.-]+/g, '_').slice(0, 120)
}

function collectRuns(
  el: HTMLElement,
  docx: DocxMod,
  style: { bold?: boolean, italics?: boolean, font?: string } = {}
): import('docx').ParagraphChild[] {
  const runs: import('docx').ParagraphChild[] = []
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        runs.push(
          new docx.TextRun({
            text,
            bold: style.bold,
            italics: style.italics,
            font: style.font
          })
        )
      }
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const child = node as HTMLElement
    const tag = child.tagName.toLowerCase()
    if (tag === 'br') {
      runs.push(new docx.TextRun({ break: 1 }))
      continue
    }
    if (tag === 'strong' || tag === 'b') {
      runs.push(...collectRuns(child, docx, { ...style, bold: true }))
      continue
    }
    if (tag === 'em' || tag === 'i') {
      runs.push(...collectRuns(child, docx, { ...style, italics: true }))
      continue
    }
    if (tag === 'code') {
      runs.push(...collectRuns(child, docx, { ...style, font: 'Courier New' }))
      continue
    }
    if (tag === 'a') {
      runs.push(...collectRuns(child, docx, style))
      continue
    }
    runs.push(...collectRuns(child, docx, style))
  }
  return runs
}

function makeParagraph(
  docx: DocxMod,
  el: HTMLElement,
  options?: {
    heading?: (typeof docx.HeadingLevel)[keyof typeof docx.HeadingLevel]
    bullet?: string
  }
) {
  const runs = collectRuns(el, docx)
  if (options?.bullet) {
    return new docx.Paragraph({
      heading: options.heading,
      children: [new docx.TextRun(`${options.bullet} `), ...runs]
    })
  }
  if (runs.length) return new docx.Paragraph({ heading: options?.heading, children: runs })
  return new docx.Paragraph({ heading: options?.heading, text: el.textContent?.trim() || '' })
}

function elementToBlocks(el: HTMLElement, docx: DocxMod): FileChild[] {
  const tag = el.tagName.toLowerCase()

  if (tag === 'div') {
    const out: FileChild[] = []
    for (const c of el.children) out.push(...elementToBlocks(c as HTMLElement, docx))
    return out
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1])
    const map = [
      docx.HeadingLevel.HEADING_1,
      docx.HeadingLevel.HEADING_2,
      docx.HeadingLevel.HEADING_3,
      docx.HeadingLevel.HEADING_4,
      docx.HeadingLevel.HEADING_5,
      docx.HeadingLevel.HEADING_6
    ] as const
    return [makeParagraph(docx, el, { heading: map[level - 1] })]
  }

  if (tag === 'p' || tag === 'blockquote') return [makeParagraph(docx, el)]

  if (tag === 'pre') {
    const text = el.textContent ?? ''
    return [
      new docx.Paragraph({
        children: [new docx.TextRun({ text, font: 'Courier New' })]
      })
    ]
  }

  if (tag === 'ul') {
    const out: FileChild[] = []
    for (const li of el.querySelectorAll(':scope > li')) {
      out.push(makeParagraph(docx, li as HTMLElement, { bullet: '\u2022' }))
    }
    return out
  }

  if (tag === 'ol') {
    const out: FileChild[] = []
    const items = el.querySelectorAll(':scope > li')
    items.forEach((li, idx) => {
      out.push(makeParagraph(docx, li as HTMLElement, { bullet: `${idx + 1}.` }))
    })
    return out
  }

  if (tag === 'table') {
    const rows: InstanceType<typeof docx.TableRow>[] = []
    for (const tr of el.querySelectorAll('tr')) {
      const cells: InstanceType<typeof docx.TableCell>[] = []
      for (const cell of tr.querySelectorAll('th, td')) {
        const p = makeParagraph(docx, cell as HTMLElement)
        cells.push(
          new docx.TableCell({
            children: [p]
          })
        )
      }
      if (cells.length) rows.push(new docx.TableRow({ children: cells }))
    }
    if (!rows.length) return []
    return [
      new docx.Table({
        rows,
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
      })
    ]
  }

  if (tag === 'hr') return [new docx.Paragraph({ text: '---' })]

  return [makeParagraph(docx, el)]
}

function walkRoot(root: HTMLElement, docx: DocxMod): FileChild[] {
  const blocks: FileChild[] = []
  for (const child of root.children) {
    if (child instanceof HTMLElement) blocks.push(...elementToBlocks(child, docx))
  }
  return blocks
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportRenderedMarkdownToDocx(root: HTMLElement, docKey: string) {
  const docx = await import('docx')
  const children = walkRoot(root, docx)
  const doc = new docx.Document({
    sections: [
      {
        children: children.length ? children : [new docx.Paragraph({ text: '' })]
      }
    ]
  })
  const blob = await docx.Packer.toBlob(doc)
  const name = `${sanitizeFileBase(docKey.split('/').pop() || docKey)}.docx`
  triggerBrowserDownload(blob, name)
}
