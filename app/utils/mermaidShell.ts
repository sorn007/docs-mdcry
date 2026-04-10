/**
 * Wraps rendered Mermaid SVG with zoom / pan / fullscreen controls (vanilla DOM).
 */

/** ขั้นต่ำตอนซูมด้วยล้อ/ปุ่ม — ต่ำพอให้ scale หลัง fit (อาจ < 0.25) ไม่กระโดดเมื่อกดย่อ */
const MIN_SCALE = 0.05
const MAX_SCALE = 64
const ZOOM_STEP = 0.15

/** ระยะห่างจากขอบ viewport ตอนคำนวณ fit (ทุกด้าน) */
const FIT_VIEWPORT_PADDING_PX = 14

let fullscreenListenerAttached = false

function syncAllMermaidFullscreenUi() {
  for (const shell of document.querySelectorAll<HTMLElement>('.md-mermaid-shell')) {
    const fs = document.fullscreenElement === shell
    shell.classList.toggle('md-mermaid-shell--fullscreen', fs)
    const fsBtn = shell.querySelector<HTMLButtonElement>('[data-action="fullscreen"]')
    if (fsBtn) {
      fsBtn.setAttribute('aria-pressed', fs ? 'true' : 'false')
      fsBtn.title = fs ? 'ออกจากเต็มจอ' : 'เต็มจอ'
      fsBtn.setAttribute('aria-label', fs ? 'ออกจากเต็มจอ' : 'เต็มจอ')
    }
  }
}

function ensureFullscreenGlobalListener() {
  if (fullscreenListenerAttached) return
  fullscreenListenerAttached = true
  document.addEventListener('fullscreenchange', syncAllMermaidFullscreenUi)
}

function wireMermaidControls(shell: HTMLElement) {
  const vp = shell.querySelector<HTMLElement>('.md-mermaid-viewport')
  const cv = shell.querySelector<HTMLElement>('.md-mermaid-canvas')
  if (!vp || !cv) return

  ensureFullscreenGlobalListener()

  let scale = 1
  let tx = 0
  let ty = 0

  let panMode = false
  let dragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragStartTx = 0
  let dragStartTy = 0

  const panBtn = shell.querySelector<HTMLButtonElement>('[data-action="pan-toggle"]')

  /**
   * ค่าเริ่มต้น / รีเซ็ต: ย่อ-ขยายให้ทั้งไดอะแกรมอยู่ใน viewport แล้วจัดกึ่งกลาง (ภาพรวม)
   * ไม่ล็อก scale=1 — ใช้ scale ตามขนาดจริงของ SVG กับพื้นที่ว่าง
   */
  function fitDiagramToViewport() {
    cv!.style.removeProperty('transform')
    void cv!.offsetWidth
    const vw = vp!.clientWidth
    const vh = vp!.clientHeight
    const cw = cv!.offsetWidth
    const ch = cv!.offsetHeight
    if (vw <= 0 || vh <= 0 || cw <= 0 || ch <= 0) return

    const aw = Math.max(1, vw - FIT_VIEWPORT_PADDING_PX * 2)
    const ah = Math.max(1, vh - FIT_VIEWPORT_PADDING_PX * 2)
    scale = Math.min(aw / cw, ah / ch)
    tx = (vw - scale * cw) / 2
    ty = (vh - scale * ch) / 2
  }

  function applyTransform() {
    const rtx = Math.round(tx)
    const rty = Math.round(ty)
    // ไม่ใส่ transform เมื่อเป็นค่าเริ่มต้น — ลดการยกเลเยอร์ที่ทำให้ SVG เบลอบนจอ HiDPI
    if (scale === 1 && rtx === 0 && rty === 0) {
      cv!.style.removeProperty('transform')
    } else {
      cv!.style.transform = `translate(${rtx}px, ${rty}px) scale(${scale})`
    }
  }

  function setPanMode(on: boolean) {
    panMode = on
    vp!.dataset.panMode = on ? 'true' : 'false'
    panBtn?.setAttribute('aria-pressed', on ? 'true' : 'false')
    panBtn?.classList.toggle('md-mermaid-btn--active', on)
  }

  shell.querySelector('.md-mermaid-toolbar')?.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')
    if (!t || !shell.contains(t)) return
    const action = t.dataset.action
    if (action === 'zoom-in') {
      scale = Math.min(MAX_SCALE, scale + ZOOM_STEP)
      applyTransform()
    } else if (action === 'zoom-out') {
      scale = Math.max(MIN_SCALE, scale - ZOOM_STEP)
      applyTransform()
    } else if (action === 'reset') {
      fitDiagramToViewport()
      applyTransform()
    } else if (action === 'pan-toggle') {
      setPanMode(!panMode)
    } else if (action === 'fullscreen') {
      if (document.fullscreenElement === shell) {
        void document.exitFullscreen()
      } else {
        void shell.requestFullscreen().catch(() => {})
      }
    }
  })

  vp!.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const dir = e.deltaY < 0 ? 1 : -1
      const next = scale + dir * ZOOM_STEP
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
      applyTransform()
    },
    { passive: false }
  )

  function endMouseDrag() {
    if (!dragging) return
    dragging = false
    vp!.classList.remove('md-mermaid-viewport--grabbing')
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return
    tx = dragStartTx + (e.clientX - dragStartX)
    ty = dragStartTy + (e.clientY - dragStartY)
    applyTransform()
  }

  function onMouseUp() {
    endMouseDrag()
  }

  vp!.addEventListener('mousedown', (e) => {
    if (!panMode || e.button !== 0) return
    dragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragStartTx = tx
    dragStartTy = ty
    vp!.classList.add('md-mermaid-viewport--grabbing')
    e.preventDefault()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  })

  function endTouchDrag() {
    dragging = false
    vp!.classList.remove('md-mermaid-viewport--grabbing')
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', endTouchDrag)
    window.removeEventListener('touchcancel', endTouchDrag)
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging || e.touches.length !== 1) return
    const t0 = e.touches.item(0)
    if (!t0) return
    tx = dragStartTx + (t0.clientX - dragStartX)
    ty = dragStartTy + (t0.clientY - dragStartY)
    applyTransform()
    e.preventDefault()
  }

  vp!.addEventListener(
    'touchstart',
    (e) => {
      if (!panMode || e.touches.length !== 1) return
      const t0 = e.touches.item(0)
      if (!t0) return
      dragging = true
      dragStartX = t0.clientX
      dragStartY = t0.clientY
      dragStartTx = tx
      dragStartTy = ty
      vp!.classList.add('md-mermaid-viewport--grabbing')
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', endTouchDrag)
      window.addEventListener('touchcancel', endTouchDrag)
    },
    { passive: true }
  )

  function layoutInitialFit() {
    fitDiagramToViewport()
    applyTransform()
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(layoutInitialFit)
  })
}

export function buildMermaidShell(
  svgString: string,
  bindFunctions?: (element: Element) => void
) {
  const shell = document.createElement('div')
  shell.className = 'md-mermaid-shell'
  shell.tabIndex = -1

  const toolbar = document.createElement('div')
  toolbar.className = 'md-mermaid-toolbar'
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', 'เครื่องมือไดอะแกรม')

  const buttons: { action: string, title: string, text: string }[] = [
    { action: 'zoom-in', title: 'ขยาย', text: '+' },
    { action: 'zoom-out', title: 'ย่อ', text: '−' },
    { action: 'reset', title: 'พอดีกับกรอบ (ภาพรวม)', text: '⌂' },
    { action: 'pan-toggle', title: 'โหมดลาก (มือจับ)', text: '✋' },
    { action: 'fullscreen', title: 'เต็มจอ', text: '⛶' }
  ]

  for (const b of buttons) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'md-mermaid-btn'
    btn.dataset.action = b.action
    btn.title = b.title
    btn.setAttribute('aria-label', b.title)
    btn.textContent = b.text
    if (b.action === 'pan-toggle') btn.setAttribute('aria-pressed', 'false')
    toolbar.appendChild(btn)
  }

  const viewport = document.createElement('div')
  viewport.className = 'md-mermaid-viewport'

  const canvas = document.createElement('div')
  canvas.className = 'md-mermaid-canvas'
  canvas.innerHTML = svgString
  bindFunctions?.(canvas)

  viewport.appendChild(canvas)
  shell.appendChild(toolbar)
  shell.appendChild(viewport)

  wireMermaidControls(shell)
  return shell
}
