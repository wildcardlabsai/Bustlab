import { Palette } from 'lucide-react'
import { cn } from '@/lib/format'

/** Marks imagery of painted pieces so it is never confused with the unpainted product supplied. */
export function PaintedExampleTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200 ring-1 ring-inset ring-amber-300/40 backdrop-blur', className)}>
      <Palette className="h-3 w-3" aria-hidden /> Painted example
    </span>
  )
}
