import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

function decodeHash(rawHash: string) {
  const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
  if (!hash) return ''
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

function normalizeAnchorId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function stripLeadingSectionNumber(text: string) {
  // Examples:
  // "2.4 User Authentication" -> "User Authentication"
  // "2.4.1 Feature Requirements" -> "Feature Requirements"
  return text.replace(/^\s*\d+(?:\.\d+)*\s+/, '')
}

function isFocusable(el: HTMLElement) {
  return el.tabIndex >= 0
}

export function useMarkdownHashFocus(container: Ref<HTMLElement | null>) {
  function findAnchorFromEvent(event: MouseEvent) {
    const path = event.composedPath()
    for (const item of path) {
      if (item instanceof HTMLAnchorElement) return item
      if (item instanceof HTMLElement) {
        const anchor = item.closest('a')
        if (anchor) return anchor as HTMLAnchorElement
      }
    }
    return null
  }

  function focusElement(target: HTMLElement) {
    const run = () => {
      if (!isFocusable(target)) target.setAttribute('tabindex', '-1')
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' })
      target.focus({ preventScroll: true })
    }

    requestAnimationFrame(() => requestAnimationFrame(run))
  }

  function focusFromHash(preferredText?: string) {
    if (!import.meta.client) return
    const id = decodeHash(window.location.hash)
    if (!id) return

    const root = container.value || document.body
    const escaped = (window.CSS && typeof window.CSS.escape === 'function') ? window.CSS.escape(id) : id
    let target = root.querySelector<HTMLElement>(`#${escaped}`) || root.querySelector<HTMLElement>(`[name="${escaped}"]`)
    if (!target) {
      const wanted = normalizeAnchorId(id)
      const candidates = root.querySelectorAll<HTMLElement>('[id]')
      for (const el of candidates) {
        const elId = el.getAttribute('id') || ''
        if (normalizeAnchorId(elId) === wanted) {
          target = el
          break
        }
      }
    }

    // Fallback: focus heading with the same visible text as clicked link
    if (!target && preferredText) {
      const wantedText = normalizeText(stripLeadingSectionNumber(preferredText))
      if (wantedText) {
        const headings = root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
        for (const heading of headings) {
          const actualRaw = heading.textContent || ''
          const actual = normalizeText(stripLeadingSectionNumber(actualRaw))
          if (actual === wantedText || actual.endsWith(wantedText) || actual.includes(wantedText)) {
            target = heading
            break
          }
        }
      }
    }

    if (!target) return
    focusElement(target)
  }

  function onClick(event: MouseEvent) {
    const root = container.value
    if (!root) return
    const anchor = findAnchorFromEvent(event)
    if (!anchor) return
    if (!root.contains(anchor)) return

    const href = anchor.getAttribute('href') || ''
    if (!href) return

    // Support both "#id" and absolute/same-page URLs with hash
    let rawHash = ''
    if (href.startsWith('#')) {
      rawHash = href
    } else {
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname !== window.location.pathname || url.search !== window.location.search) return
        rawHash = url.hash
      } catch {
        return
      }
    }

    const hash = decodeHash(rawHash)
    if (!hash) return

    event.preventDefault()
    const nextHash = `#${encodeURIComponent(hash)}`
    if (window.location.hash !== nextHash) {
      history.replaceState(null, '', nextHash)
    }
    const linkText = anchor.textContent?.trim() || ''
    focusFromHash(linkText)
  }

  function bind(el: HTMLElement | null) {
    if (el) el.addEventListener('click', onClick)
  }

  function unbind(el: HTMLElement | null) {
    if (el) el.removeEventListener('click', onClick)
  }

  function onHashChange() {
    focusFromHash()
  }

  onMounted(() => {
    bind(container.value)
    window.addEventListener('hashchange', onHashChange)
  })

  watch(container, (newEl, oldEl) => {
    unbind(oldEl)
    bind(newEl)
  })

  onBeforeUnmount(() => {
    unbind(container.value)
    if (import.meta.client) window.removeEventListener('hashchange', onHashChange)
  })

  return { focusFromHash }
}

