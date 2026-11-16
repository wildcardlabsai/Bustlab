import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { cn } from '@/lib/format'
import type { Collection } from '@/types/content'

export function CollectionCard({ collection, index, className, size = 'md' }: { collection: Collection; index?: number; className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className={cn(
        'group relative isolate flex min-h-[22rem] overflow-hidden rounded-2xl border border-line bg-surface transition duration-500 hover:border-purple/60 hover:shadow-[0_24px_70px_-24px_rgba(161,0,255,0.6)]',
        size === 'lg' && 'min-h-[26rem] lg:min-h-[30rem]',
        className,
      )}
    >
      <SmartImage
        src={collection.cover_image}
        alt=""
        sizes="(min-width:1024px) 50vw, 100vw"
        wrapperClassName="absolute inset-0 -z-10"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_35%] transition duration-[1200ms] ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-purple/20 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="mt-auto w-full p-6 sm:p-8">
        {index !== undefined && <span className="font-display text-sm font-bold text-purple-bright">{String(index + 1).padStart(2, '0')}</span>}
        <h3 className="mt-1 text-2xl font-bold uppercase sm:text-3xl">{collection.name}</h3>
        {collection.description && <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-silver/80">{collection.description}</p>}
        <span className="mt-5 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
          Explore
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition group-hover:bg-purple group-hover:ring-purple-bright">
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  )
}
