import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/format'

export interface Crumb { label: string; to?: string }

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />}
            {c.to ? (
              <Link to={c.to} className="transition hover:text-white">{c.label}</Link>
            ) : (
              <span aria-current="page" className={cn('text-silver')}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
