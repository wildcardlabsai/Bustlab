import { useState } from 'react'
import { Expand } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { Lightbox } from '@/components/gallery/Lightbox'
import { ReadyToPaintBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/format'

export function ProductGallery({ images, name, readyToPaint }: { images: string[]; name: string; readyToPaint: boolean }) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const current = images[active] ?? null
  return (
    <div>
      <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface">
        <button type="button" className="block h-full w-full cursor-zoom-in" onClick={() => current && setLightbox(active)} aria-label={`View ${name} full size`} disabled={!current}>
          <SmartImage key={current ?? 'none'} src={current} alt={`${name} — view ${active + 1}`} priority sizes="(min-width:1024px) 50vw, 100vw" className="h-full w-full object-cover" />
        </button>
        {readyToPaint && <ReadyToPaintBadge className="pointer-events-none absolute left-4 top-4" />}
        {current && (
          <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white ring-1 ring-white/20 backdrop-blur">
            <Expand className="h-3.5 w-3.5" aria-hidden /> Zoom
          </span>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cn('block aspect-square w-full overflow-hidden rounded-xl border-2 bg-surface transition', i === active ? 'border-purple' : 'border-transparent opacity-70 hover:opacity-100')}
              >
                <SmartImage src={src} alt="" sizes="120px" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox items={images.map((src, i) => ({ src, alt: `${name} — view ${i + 1}` }))} index={lightbox} onClose={() => setLightbox(null)} onIndexChange={(i) => { setLightbox(i); setActive(i) }} />
    </div>
  )
}
