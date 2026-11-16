import { Expand } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { PaintedExampleTag } from './PaintedExampleTag'
import type { GalleryImage } from '@/types/content'
import { cn } from '@/lib/format'

interface MasonryGridProps {
  images: GalleryImage[]
  onOpen?: (index: number) => void
  className?: string
}

/** Responsive CSS-columns masonry layout. */
export function MasonryGrid({ images, onOpen, className }: MasonryGridProps) {
  return (
    <ul className={cn('columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4', className)}>
      {images.map((img, i) => (
        <li key={img.id} className="break-inside-avoid">
          <figure className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
            <button type="button" onClick={() => onOpen?.(i)} className="block w-full cursor-zoom-in text-left" aria-label={`View larger: ${img.caption || img.alt_text || 'gallery image'}`}>
              <SmartImage
                src={img.image_url}
                alt={img.alt_text || img.caption || 'BUSTLAB bust'}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className={cn('w-full transition duration-700 group-hover:scale-[1.04]', i % 3 === 1 ? 'aspect-[4/5]' : i % 3 === 2 ? 'aspect-square' : 'aspect-[4/5]', 'object-cover')}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition group-hover:opacity-100">
                <Expand className="h-4 w-4" aria-hidden />
              </span>
            </button>
            {img.is_painted_example && <PaintedExampleTag className="pointer-events-none absolute left-3 top-3" />}
            {img.caption && (
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-sm text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {img.caption}
              </figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  )
}
