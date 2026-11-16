import { cn } from '@/lib/format'

export interface ChipOption { value: string; label: string; count?: number }

export function FilterChips({ options, value, onChange, label }: { options: ChipOption[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset transition',
              active ? 'bg-purple text-white ring-purple-bright shadow-[0_0_24px_-6px_rgba(161,0,255,0.8)]' : 'bg-surface text-silver ring-line hover:text-white hover:ring-white/25',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn('ml-2 text-[10px]', active ? 'text-white/80' : 'text-muted')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
