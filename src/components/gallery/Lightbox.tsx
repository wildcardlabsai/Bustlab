import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PaintedExampleTag } from './PaintedExampleTag'

export interface LightboxItem {
  src: string
  alt: string
  caption?: string | null
  painted?: boolean
}

interface LightboxProps {
  items: LightboxItem[]
  index: number | null
  onClose: () => void
  onIndexChange: (i: number) => void
}

/** Accessible full-screen image viewer with keyboard, swipe and button navigation. */
export function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null && items[index] !== undefined
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  const go = useCallback(
    (delta: number) => {
      if (index === null || !items.length) return
      onIndexChange((index + delta + items.length) % items.length)
    },
    [index, items.length, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        const f = document.querySelectorAll<HTMLElement>('[data-lightbox] button')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      restoreFocus.current?.focus?.()
    }
  }, [open, onClose, go])

  if (!open) return null
  const item = items[index]

  return createPortal(
    <div
      data-lightbox
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-[fade-up_0.25s_ease-out]"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-muted sm:px-6">
        <span aria-live="polite">{index + 1} / {items.length}</span>
        <button ref={closeRef} onClick={onClose} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Close image viewer">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <img key={item.src} src={item.src} alt={item.alt} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-[fade-up_0.35s_ease-out]" />
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white ring-1 ring-white/20 backdrop-blur hover:bg-purple sm:left-4" aria-label="Previous image">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white ring-1 ring-white/20 backdrop-blur hover:bg-purple sm:right-4" aria-label="Next image">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      <div className="flex min-h-16 flex-wrap items-center justify-center gap-3 px-6 py-4 text-center">
        {item.painted && <PaintedExampleTag />}
        {item.caption && <p className="text-sm text-silver">{item.caption}</p>}
      </div>
    </div>,
    document.body,
  )
}
