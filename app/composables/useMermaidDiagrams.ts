import { nextTick, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { toValue } from 'vue'
import type { Mermaid } from 'mermaid'
import { buildMermaidShell } from '~/utils/mermaidShell'

function isDocumentDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

let mermaidLoadPromise: Promise<Mermaid> | null = null

function ensureMermaid(isDark: boolean): Promise<Mermaid> {
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import('mermaid').then(({ default: m }) => {
      m.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: isDark ? 'dark' : 'default'
      })
      return m
    })
  }
  return mermaidLoadPromise
}

function mermaidErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message
  return String(err)
}

export function useMermaidDiagrams(
  container: Ref<HTMLElement | null>,
  html: MaybeRefOrGetter<string>
) {
  if (!import.meta.client) return

  let generation = 0

  watch(
    [container, () => toValue(html)],
    async () => {
      const myGen = ++generation
      const root = container.value
      const htmlStr = toValue(html)
      if (!root || !htmlStr) return

      await nextTick()
      if (myGen !== generation) return

      const m = await ensureMermaid(isDocumentDark())
      if (myGen !== generation) return

      const codes = [...root.querySelectorAll('pre code.language-mermaid')]
      for (const code of codes) {
        const pre = code.parentElement
        if (!pre || pre.tagName !== 'PRE') continue

        const graph = (code.textContent || '').trim()
        if (!graph) continue

        const id = `mermaid-${crypto.randomUUID()}`
        try {
          const { svg, bindFunctions } = await m.render(id, graph)
          if (myGen !== generation) return

          const shell = buildMermaidShell(svg, bindFunctions)
          pre.replaceWith(shell)
        } catch (err) {
          if (myGen !== generation) return

          const wrap = document.createElement('div')
          wrap.className = 'md-mermaid md-mermaid-error'
          wrap.setAttribute('role', 'alert')
          wrap.textContent = mermaidErrorMessage(err)
          pre.replaceWith(wrap)
        }
      }
    },
    { flush: 'post', immediate: true }
  )
}
