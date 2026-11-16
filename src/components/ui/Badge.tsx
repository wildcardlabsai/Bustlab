import { Paintbrush } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

export function Badge({ children, className, tone = 'neutral' }: { children: ReactNode; className?: string; tone?: 'neutral' | 'purple' | 'green' | 'amber' | 'red' }) {
  const tones = {
    neutral: 'bg-white/8 text-silver ring-white/10',
    purple: 'bg-purple/15 text-[#d9a3ff] ring-purple/40',
    green: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
    amber: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
    red: 'bg-red-500/10 text-red-300 ring-red-400/30',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  )
}

export function ReadyToPaintBadge({ className }: { className?: string }) {
  return (
    <Badge tone="purple" className={cn('backdrop-blur', className)}>
      <Paintbrush className="h-3 w-3" aria-hidden /> Ready to paint
    </Badge>
  )
}
