import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { ReadyToPaintBadge } from '@/components/ui/Badge'
import type { ProductWithCollection } from '@/types/content'

export function ProductCard({ product }: { product: ProductWithCollection }) {
  const href = `/products/${product.slug}`
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-purple/50 hover:shadow-[0_20px_60px_-20px_rgba(161,0,255,0.45)]">
      <Link to={href} className="relative block aspect-[4/5] overflow-hidden bg-bg-2" tabIndex={-1} aria-hidden>
        <SmartImage
          src={product.main_image}
          alt=""
          sizes="(min-width:1280px) 400px, (min-width:640px) 50vw, 100vw"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
        {product.ready_to_paint && <ReadyToPaintBadge className="absolute left-4 top-4" />}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {product.collection && <p className="eyebrow !text-[10px] !tracking-[0.25em]">{product.collection.name}</p>}
        <h3 className="mt-2 text-xl font-bold uppercase tracking-tight">
          <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {product.short_description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{product.short_description}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-display text-xs font-semibold uppercase tracking-[0.18em] text-white">
          View details
          <ArrowUpRight className="h-4 w-4 text-purple-bright transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </div>
    </article>
  )
}
