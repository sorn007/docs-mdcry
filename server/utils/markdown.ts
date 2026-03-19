import { dirname, posix } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import rehypeExternalLinks from 'rehype-external-links'
import { visit } from 'unist-util-visit'

type Options = {
  docKey: string
  docLinkBase?: string
  assetLinkBase?: string
}

function isRelativeUrl(url: string) {
  if (!url) return false
  if (url.startsWith('#')) return false
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return false
  return !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) && !url.startsWith('//')
}

function joinS3Key(baseDirKey: string, ref: string) {
  const normalized = ref.replace(/\\/g, '/')
  return posix.normalize(posix.join(baseDirKey, normalized)).replace(/^(\.\.\/)+/, '')
}

function rehypeRewriteRelativeLinks(opts: Options) {
  const baseDir = dirname(opts.docKey).replace(/\\/g, '/')
  const docBase = opts.docLinkBase || '/view?key='
  const assetBase = opts.assetLinkBase || '/api/asset?key='
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (!node?.properties) return
      if (node.tagName === 'img' && typeof node.properties.src === 'string') {
        const src = node.properties.src
        if (!isRelativeUrl(src)) return
        const key = joinS3Key(baseDir, src)
        node.properties.src = `${assetBase}${encodeURIComponent(key)}`
      }

      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        const href = node.properties.href
        if (!isRelativeUrl(href)) return
        if (href.endsWith('.md') || href.includes('.md#') || href.includes('.md?')) {
          const key = joinS3Key(baseDir, href)
          node.properties.href = `${docBase}${encodeURIComponent(key)}`
        } else {
          const key = joinS3Key(baseDir, href)
          node.properties.href = `${assetBase}${encodeURIComponent(key)}`
        }
      }
    })
  }
}

export async function renderMarkdownToHtml(markdown: string, opts: Options) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeRewriteRelativeLinks, opts)
    .use(rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] })
    .use(rehypeSlug)
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        h1: [...(defaultSchema.attributes?.h1 || []), 'id', 'tabIndex'],
        h2: [...(defaultSchema.attributes?.h2 || []), 'id', 'tabIndex'],
        h3: [...(defaultSchema.attributes?.h3 || []), 'id', 'tabIndex'],
        h4: [...(defaultSchema.attributes?.h4 || []), 'id', 'tabIndex'],
        h5: [...(defaultSchema.attributes?.h5 || []), 'id', 'tabIndex'],
        h6: [...(defaultSchema.attributes?.h6 || []), 'id', 'tabIndex'],
        a: [
          ...(defaultSchema.attributes?.a || []),
          'target',
          'rel'
        ],
        img: [
          ...(defaultSchema.attributes?.img || []),
          'src',
          'alt',
          'title'
        ],
        code: [
          ...(defaultSchema.attributes?.code || []),
          ['className']
        ],
        pre: [
          ...(defaultSchema.attributes?.pre || []),
          ['className']
        ]
      }
    })
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}

